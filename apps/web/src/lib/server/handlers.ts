import 'server-only';

import {
  getStore,
  addSource,
  addSignals,
  DEMO_ANALYTICS,
  resetStore,
  WORKSPACE_ID,
  addPlaybook,
  addFeedback,
  getGtmMetrics,
  updateCrmEntryZeroSync
} from '@/lib/server/store/memory';
import type { CrmEntry } from '@/lib/server/store/memory';
import { getZeroSyncStatesForEntries, saveZeroSyncResult } from '@/lib/server/db/zeroSync';
import { parseFileContent, validateUploadFile, FileParseError } from '@/lib/server/ai/file-parser';
import {
  expandAudienceWithContext,
  generateGtmSystem,
  amplifyProof,
  syncToZero,
  getGrowthRecommendations,
  validateProof,
  isUnifyLive
} from '@/lib/server/integrations/sponsors';
import {
  ingestUnifyConversations,
  ragQuery,
  getRagStatus,
  discoverProofWithRag,
  discoverFromDemoData,
  getDemoDataSummary
} from '@/lib/server/rag/pipeline';
import { SUPPORTED_UPLOAD_TYPES, SUPPORTED_PASTE_TYPES } from '@/lib/server/rag/supported-types';
import { loadDemoSources } from '@/lib/server/rag/demo-data-loader';
import { cleanTrustSignals } from '@/lib/server/utils/signals';
import {
  getUnifyEvents,
  getUnifyNotificationsStatus,
  listAllSubscriptions,
  receiveWebhookNotification,
  resetUnifyNotifications,
  sendTestNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  type SubscribeRequest,
  type TestNotificationRequest,
  type UnifyNotificationPayload
} from '@/lib/server/integrations/unify-notifications';
import {
  getUnifyAnalyticsEvents,
  getUnifyAnalyticsStatus,
  identifyVisitor,
  trackEvent,
  emitProofEvent
} from '@/lib/server/integrations/unify-analytics';
import {
  fetchUnifyConversations,
  getUnifyGtmStatus,
  listUnifyGtmObjects,
  syncTrustSignalsToUnifyGtm
} from '@/lib/server/integrations/unify';
import { validateProofOnSocialMedia, getFaxxingStatus } from '@/lib/server/integrations/faxxing';
import { getZeroStatus, isDatabaseConnected } from '@/lib/server/integrations/zero';
import { json, parseJson } from '@/lib/server/http';

function resolveCrmEntity(entry: CrmEntry): Record<string, unknown> | undefined {
  const store = getStore();
  switch (entry.entityType) {
    case 'trust_signal':
      return store.signals.find((signal) => signal.id === entry.entityId) as Record<string, unknown> | undefined;
    case 'content_asset':
      return store.contentAssets.find((asset) => asset.id === entry.entityId) as Record<string, unknown> | undefined;
    case 'gtm_playbook':
      return store.playbooks.find((playbook) => playbook.id === entry.entityId) as Record<string, unknown> | undefined;
    case 'growth_recommendation':
      return store.recommendations.find((recommendation) => recommendation.id === entry.entityId) as
        | Record<string, unknown>
        | undefined;
    case 'proof_source':
      return store.sources.find((source) => source.id === entry.entityId) as Record<string, unknown> | undefined;
    default:
      return undefined;
  }
}

async function syncCrmEntryToZero(entry: CrmEntry) {
  const entity = resolveCrmEntity(entry);
  if (!entity) {
    return { entry, result: null, error: `Linked ${entry.entityType} record not found` };
  }

  const syncInput = {
    type: entry.entityType,
    workspaceId: WORKSPACE_ID,
    entityId: entry.entityId,
    title: entry.title,
    entity,
    crmEntry: entry as unknown as Record<string, unknown>
  };

  const result = await syncToZero(syncInput);
  const persistedSync = await saveZeroSyncResult(syncInput, result);
  const updated = updateCrmEntryZeroSync(entry.id, {
    status: persistedSync?.status ?? result.status,
    zeroId: persistedSync?.zeroId ?? result.zeroId,
    zeroUrl: persistedSync?.zeroUrl ?? result.zeroUrl,
    error: persistedSync?.error ?? result.error,
    lastSyncedAt: persistedSync?.lastSyncedAt ?? result.lastSyncedAt
  });

  return { entry: updated ?? entry, result, error: undefined };
}

function requireStringFields(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = body[field];
    if (typeof value !== 'string' || !value.trim()) {
      return `${field} is required`;
    }
  }
  return null;
}

export function getHealth() {
  return json({ status: 'ok', service: 'corroba-api', demo: true });
}

export function getDashboard() {
  const store = getStore();
  const topSignals = [...store.signals].sort((a, b) => b.proofScore - a.proofScore).slice(0, 5);
  return json({
    workspaceId: store.workspaceId,
    stats: DEMO_ANALYTICS.overview,
    topSignals,
    recentSources: store.sources.slice(0, 5),
    integrationStatus: store.settings.integrations
  });
}

export function getSources() {
  return json(getStore().sources);
}

export async function postSourcesText(request: Request) {
  const body = await parseJson<{ content: string; title?: string; type?: string }>(request);
  if (!body.content?.trim()) return json({ error: 'Content is required' }, 400);

  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: body.type ?? 'paste',
    title: body.title ?? 'Pasted Content',
    content: body.content,
    status: 'processing'
  });

  const discovery = await discoverProofWithRag(body.content, {
    sourceId: source.id,
    title: source.title,
    type: source.type
  });
  const validated = await Promise.all(discovery.signals.map((s) => validateProof(s)));
  const signals = addSignals(validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s })));

  source.status = 'processed';
  await syncToZero({
    type: 'source',
    workspaceId: WORKSPACE_ID,
    entityId: source.id,
    title: source.title,
    source: source as unknown as Record<string, unknown>,
    signals: signals as unknown as Record<string, unknown>[]
  });

  emitProofEvent(
    'Proof Discovered',
    {
      sourceId: source.id,
      sourceType: source.type,
      signalCount: signals.length,
      topSignalType: signals[0]?.signalType,
      topProofScore: signals[0]?.proofScore
    },
    WORKSPACE_ID
  );

  return json({ source, signals, count: signals.length, rag: discovery });
}

export async function postSourcesUpload(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return json({ error: 'File is required' }, 400);

    validateUploadFile(file.name, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseFileContent(buffer, file.name);

    if (!parsed.text.trim()) {
      return json(
        {
          error: 'No readable text found in file. Try a text-based PDF, .txt, or .csv with customer quotes.',
          warnings: parsed.warnings
        },
        422
      );
    }

    const source = addSource({
      workspaceId: WORKSPACE_ID,
      type: file.name.split('.').pop()?.toLowerCase() ?? 'file',
      title: file.name,
      content: parsed.text,
      fileName: file.name,
      status: 'processing'
    });

    const discovery = await discoverProofWithRag(parsed.text, {
      sourceId: source.id,
      title: source.title,
      type: source.type
    });
    const validated = await Promise.all(discovery.signals.map((s) => validateProof(s)));
    const signals = addSignals(validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s })));

    source.status = 'processed';
    return json({
      source,
      signals,
      count: signals.length,
      rag: discovery,
      file: { name: file.name, size: file.size, parser: parsed.parser },
      warnings: parsed.warnings
    });
  } catch (e) {
    const message = e instanceof FileParseError || e instanceof Error ? e.message : 'Upload failed';
    const status = e instanceof FileParseError ? 400 : 500;
    console.error('[upload]', message);
    return json({ error: message }, status);
  }
}

export async function postDiscoveryDemo() {
  const discovery = await discoverFromDemoData();
  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: 'demo',
    title: 'Demo Data Scan',
    content: 'Auto-discovered from demo-data folder',
    status: 'processing'
  });
  const validated = await Promise.all(discovery.signals.map((s) => validateProof(s)));
  const signals = addSignals(validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s })));
  source.status = 'processed';
  emitProofEvent(
    'Proof Discovered',
    {
      sourceId: source.id,
      sourceType: 'demo',
      signalCount: signals.length,
      topSignalType: signals[0]?.signalType,
      topProofScore: signals[0]?.proofScore
    },
    WORKSPACE_ID
  );
  return json({ source, signals, count: signals.length, rag: discovery });
}

export async function postDiscoveryRun(request: Request) {
  const body = await parseJson<{ content: string }>(request).catch(() => ({ content: '' }));
  const discovery = await discoverProofWithRag(body.content ?? '', {
    sourceId: `temp-${Date.now()}`,
    title: 'Discovery Run',
    type: 'paste'
  });
  const validated = await Promise.all(discovery.signals.map((s) => validateProof(s)));
  return json({ signals: validated, rag: discovery });
}

export function getTrustSignals() {
  const store = getStore();
  return json(cleanTrustSignals([...store.signals].sort((a, b) => b.proofScore - a.proofScore)));
}

export function getTrustSignalById(id: string) {
  const signal = getStore().signals.find((s) => s.id === id);
  if (!signal) return json({ error: 'Not found' }, 404);
  return json(signal);
}

export function getRankings() {
  const store = getStore();
  const ranked = [...store.signals]
    .sort((a, b) => b.proofScore - a.proofScore)
    .map((s, i) => ({ rank: i + 1, ...s }));
  return json(ranked);
}

export function getAudiences() {
  return json(getStore().audiences);
}

export async function postAudiencesExpand(request: Request) {
  const body = await parseJson<{ proofQuote: string; signalId?: string }>(request).catch(() => ({ proofQuote: '' }));
  if (!body.proofQuote?.trim()) return json({ error: 'proofQuote is required' }, 400);
  const { audiences, ragContext } = await expandAudienceWithContext(body.proofQuote);
  return json({
    audiences,
    ragContext,
    poweredBy: isUnifyLive() ? 'unify' : ragContext.source === 'demo' ? 'demo' : 'rag'
  });
}

export function getRagStatusHandler() {
  return json(getRagStatus());
}

export async function postRagIngest(request: Request) {
  const body = await parseJson<{ force?: boolean }>(request).catch(() => ({ force: false }));
  const result = await ingestUnifyConversations(body.force ?? false);
  return json(result);
}

export async function postRagQuery(request: Request) {
  const body = await parseJson<{ query: string; topK?: number }>(request);
  if (!body.query?.trim()) return json({ error: 'Query is required' }, 400);
  const result = await ragQuery(body.query, body.topK ?? 5);
  return json(result);
}

export function getRagSupportedTypes() {
  return json({ uploads: SUPPORTED_UPLOAD_TYPES, pasteTypes: SUPPORTED_PASTE_TYPES });
}

export function getRagDemoData() {
  return json(getDemoDataSummary());
}

export async function getUnifyConversations() {
  try {
    const data = await fetchUnifyConversations();
    return json(data);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Failed to fetch conversations' }, 502);
  }
}

export function getUnifyStatus() {
  return json(getUnifyGtmStatus());
}

export async function getUnifyObjects() {
  return json(await listUnifyGtmObjects());
}

export async function postUnifySyncSignals() {
  const store = getStore();
  const signals = [...store.signals].sort((a, b) => b.proofScore - a.proofScore).slice(0, 10);
  const result = await syncTrustSignalsToUnifyGtm(signals);
  return json(result);
}

export async function postUnifyNotificationsSubscribe(request: Request) {
  const body = await parseJson<SubscribeRequest>(request);
  const error = requireStringFields(body as unknown as Record<string, unknown>, ['topic', 'subjectFilter', 'webhookUrl']);
  if (error) return json({ error }, 400);
  return json(subscribeToNotifications(body));
}

export async function deleteUnifyNotificationSubscription(id: string) {
  if (!id?.trim()) return json({ error: 'subscription id is required' }, 400);
  return json(await unsubscribeFromNotifications(id));
}

export async function postUnifyNotificationsTest(request: Request) {
  const body = await parseJson<TestNotificationRequest>(request);
  const error = requireStringFields(body as unknown as Record<string, unknown>, ['event', 'conversationId', 'message']);
  if (error) return json({ error }, 400);
  return json(await sendTestNotification(body));
}

export async function postUnifyNotificationsWebhook(request: Request) {
  const body = await parseJson<UnifyNotificationPayload>(request);
  const error = requireStringFields(body as unknown as Record<string, unknown>, ['event', 'conversationId', 'message']);
  if (error) return json({ error }, 400);

  receiveWebhookNotification(
    {
      event: body.event,
      conversationId: body.conversationId,
      message: body.message,
      timestamp: body.timestamp ?? new Date().toISOString()
    },
    { source: 'simulated' }
  );

  return json({ received: true });
}

export function getUnifyNotificationEvents() {
  return json(getUnifyEvents());
}

export async function getUnifyNotificationSubscriptions() {
  return json(await listAllSubscriptions());
}

export function getUnifyNotificationsStatusHandler() {
  return json(getUnifyNotificationsStatus());
}

export function getUnifyAnalyticsStatusHandler() {
  return json(getUnifyAnalyticsStatus());
}

export function getUnifyAnalyticsEventsHandler() {
  return json(getUnifyAnalyticsEvents());
}

export async function postUnifyAnalyticsTrack(request: Request) {
  const body = (await parseJson(request).catch(() => ({}))) as {
    name?: string;
    properties?: Record<string, unknown>;
    visitorId?: string;
  };
  if (!body.name?.trim()) return json({ error: 'name is required' }, 400);
  const entry = await trackEvent(body.name.trim(), body.properties ?? {}, body.visitorId);
  return json(entry);
}

export async function postUnifyAnalyticsIdentify(request: Request) {
  const body = (await parseJson(request).catch(() => ({}))) as {
    visitorId?: string;
    traits?: Record<string, unknown>;
  };
  if (!body.visitorId?.trim()) return json({ error: 'visitorId is required' }, 400);
  const entry = await identifyVisitor(body.visitorId.trim(), body.traits ?? {});
  return json(entry);
}

export function getFaxxingStatusHandler() {
  return json(getFaxxingStatus());
}

export async function postFaxxingValidate(request: Request) {
  const body = await parseJson<{ quote: string; signalId?: string }>(request);
  if (!body.quote?.trim()) return json({ error: 'quote is required' }, 400);
  const result = await validateProofOnSocialMedia(body.quote.trim());
  return json(result);
}

export function getGtmPlaybooks() {
  return json({ playbooks: getStore().playbooks, metrics: getGtmMetrics() });
}

export async function postGtmengineerGenerate() {
  const store = getStore();
  const playbooks = await generateGtmSystem(store.signals.slice(0, 5));
  const saved = playbooks.map((p) => addPlaybook(p));
  const gtmLive = Boolean(process.env.GTMENGINEER_API_KEY && process.env.GTMENGINEER_API_URL);
  return json({
    playbooks: saved,
    poweredBy: gtmLive ? 'gtmengineer.dev' : 'simulated',
    message: gtmLive
      ? 'Generated via GTMengineer.dev'
      : 'Simulated GTM System Generator — GTMengineer.dev integration pending'
  });
}

export async function postGtmGenerate() {
  const store = getStore();
  const topSignals = [...store.signals].sort((a, b) => b.proofScore - a.proofScore).slice(0, 3);

  const recs = await getGrowthRecommendations(topSignals);
  const generated = await generateGtmSystem(topSignals);

  const nextActions = (recs ?? []).slice(0, 3).map((r) => ({
    action: r.title,
    impact: r.priority === 'high' ? 'High' : r.priority === 'medium' ? 'Medium' : 'Low',
    effort: r.effort <= 25 ? 'Low' : r.effort <= 50 ? 'Medium' : 'High',
    source: process.env.SCAILE_API_KEY ? 'Scaile' : 'GTM System'
  }));

  const playbook = {
    ...generated[0],
    content: {
      ...generated[0].content,
      nextActions: [...nextActions, ...generated[0].content.nextActions.slice(0, 1)]
    }
  };

  const saved = addPlaybook(playbook);
  emitProofEvent(
    'GTM System Generated',
    { playbookId: saved.id, signalsUsed: topSignals.length, topSignalType: topSignals[0]?.signalType },
    WORKSPACE_ID
  );
  return json({
    playbook: saved,
    signalsUsed: topSignals.map((s) => ({ id: s.id, quote: s.quote, proofScore: s.proofScore, signalType: s.signalType })),
    metrics: getGtmMetrics(),
    poweredBy: process.env.SCAILE_API_KEY ? 'scaile' : 'demo'
  });
}

export async function postGtmFeedback(request: Request) {
  const body = await parseJson<{
    playbookId: string;
    actionIndex?: number;
    rating: 'helpful' | 'not_helpful';
    comment?: string;
  }>(request);
  if (!body.playbookId || !body.rating) return json({ error: 'playbookId and rating are required' }, 400);
  const entry = addFeedback({
    playbookId: body.playbookId,
    actionIndex: body.actionIndex,
    rating: body.rating,
    comment: body.comment
  });
  return json({ feedback: entry, metrics: getGtmMetrics() });
}

export function getGtmMetricsHandler() {
  return json(getGtmMetrics());
}

export function getContent() {
  return json(getStore().contentAssets);
}

export async function postContentGenerate(request: Request) {
  const body = await parseJson<{ signalId: string }>(request);
  const signal = getStore().signals.find((s) => s.id === body.signalId);
  if (!signal) return json({ error: 'Signal not found' }, 404);

  const assets = await amplifyProof(signal);
  return json({
    assets,
    poweredBy: process.env.FAXXING_API_KEY ? 'faxxing' : 'demo'
  });
}

export async function getCrm() {
  const entries = getStore().crmEntries;
  const persistedEntries = await getZeroSyncStatesForEntries(entries, WORKSPACE_ID);
  return json(persistedEntries ?? entries);
}

export async function getCrmStatus() {
  return json(await getZeroStatus(await isDatabaseConnected()));
}

export async function postCrmSync(id: string) {
  const entry = getStore().crmEntries.find((item) => item.id === id);
  if (!entry) return json({ error: 'CRM entry not found' }, 404);

  const { entry: updated, result, error } = await syncCrmEntryToZero(entry);
  if (!result) return json({ error }, 404);

  return json({ result, entry: updated });
}

export async function postCrmSyncAll() {
  const store = getStore();
  const results = [];

  for (const entry of store.crmEntries) {
    const { entry: updated, result, error } = await syncCrmEntryToZero(entry);
    results.push({
      entityId: entry.entityId,
      synced: result?.synced ?? false,
      status: result?.status,
      error: error ?? result?.error,
      entry: updated
    });
  }

  const synced = results.filter((r) => r.synced).length;
  return json({ synced, total: results.length, results });
}

export function getGrowth() {
  return json(getStore().recommendations);
}

export async function postGrowthAnalyze() {
  const store = getStore();
  const recommendations = await getGrowthRecommendations(store.signals);
  return json({
    recommendations,
    poweredBy: process.env.SCAILE_API_KEY ? 'scaile' : 'demo'
  });
}

export function getAnalytics() {
  return json(DEMO_ANALYTICS);
}

export function getSettings() {
  return json(getStore().settings);
}

export async function patchSettings(request: Request) {
  const body = await parseJson<{ demoMode?: boolean; aiProvider?: string; integrations?: Record<string, boolean> }>(
    request
  );
  const store = getStore();
  Object.assign(store.settings, body);
  return json(store.settings);
}

export function postDemoReset() {
  resetStore();
  resetUnifyNotifications();
  return json({ message: 'Demo data reset' });
}

export function getDemoSampleDatasets() {
  return json(
    loadDemoSources().map((s) => ({
      id: s.id,
      name: s.title,
      type: s.type,
      content: s.content
    }))
  );
}
