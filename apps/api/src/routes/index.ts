import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getStore, addSource, addSignals, DEMO_ANALYTICS, resetStore, WORKSPACE_ID } from '../store/memory.js';
import { runProofDiscoveryPipeline, parseFileContent } from '../ai/pipeline.js';
import {
  expandAudience,
  generateGtmSystem,
  amplifyProof,
  syncToZero,
  getGrowthRecommendations,
  validateProof
} from '../integrations/sponsors.js';

const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));

app.get('/health', (c) => c.json({ status: 'ok', service: 'proofloop-api', demo: true }));

app.get('/api/dashboard', (c) => {
  const store = getStore();
  const topSignals = [...store.signals].sort((a, b) => b.proofScore - a.proofScore).slice(0, 5);
  return c.json({
    workspaceId: store.workspaceId,
    stats: DEMO_ANALYTICS.overview,
    topSignals,
    recentSources: store.sources.slice(0, 5),
    integrationStatus: store.settings.integrations
  });
});

app.get('/api/sources', (c) => c.json(getStore().sources));

app.post('/api/sources/text', async (c) => {
  const body = await c.req.json<{ content: string; title?: string; type?: string }>();
  if (!body.content?.trim()) return c.json({ error: 'Content is required' }, 400);

  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: body.type ?? 'paste',
    title: body.title ?? 'Pasted Content',
    content: body.content,
    status: 'processing'
  });

  const extracted = await runProofDiscoveryPipeline(body.content);
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  const signals = addSignals(
    validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s }))
  );

  source.status = 'processed';
  await syncToZero({ type: 'source', source, signals });

  return c.json({ source, signals, count: signals.length });
});

app.post('/api/sources/upload', async (c) => {
  const form = await c.req.parseBody();
  const file = form['file'];
  if (!file || !(file instanceof File)) return c.json({ error: 'File is required' }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await parseFileContent(buffer, file.name);

  const source = addSource({
    workspaceId: WORKSPACE_ID,
    type: file.name.split('.').pop() ?? 'file',
    title: file.name,
    content,
    fileName: file.name,
    status: 'processing'
  });

  const extracted = await runProofDiscoveryPipeline(content);
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  const signals = addSignals(
    validated.map((s) => ({ workspaceId: WORKSPACE_ID, sourceId: source.id, ...s }))
  );

  source.status = 'processed';
  return c.json({ source, signals, count: signals.length });
});

app.post('/api/discovery/run', async (c) => {
  const body = await c.req.json<{ content: string }>();
  const extracted = await runProofDiscoveryPipeline(body.content ?? '');
  const validated = await Promise.all(extracted.map((s) => validateProof(s)));
  return c.json({ signals: validated });
});

app.get('/api/trust-signals', (c) => {
  const store = getStore();
  const sorted = [...store.signals].sort((a, b) => b.proofScore - a.proofScore);
  return c.json(sorted);
});

app.get('/api/trust-signals/:id', (c) => {
  const signal = getStore().signals.find((s) => s.id === c.req.param('id'));
  if (!signal) return c.json({ error: 'Not found' }, 404);
  return c.json(signal);
});

app.get('/api/rankings', (c) => {
  const store = getStore();
  const ranked = [...store.signals]
    .sort((a, b) => b.proofScore - a.proofScore)
    .map((s, i) => ({ rank: i + 1, ...s }));
  return c.json(ranked);
});

app.get('/api/audiences', (c) => c.json(getStore().audiences));

app.post('/api/audiences/expand', async (c) => {
  const body = await c.req.json<{ proofQuote: string; signalId?: string }>();
  const audiences = await expandAudience(body.proofQuote);
  return c.json({ audiences, poweredBy: process.env.UNIFY_API_KEY ? 'unify' : 'demo' });
});

app.get('/api/gtm-playbooks', (c) => c.json(getStore().playbooks));

app.post('/api/gtmengineer/generate', async (c) => {
  const store = getStore();
  const playbooks = await generateGtmSystem(store.signals.slice(0, 5));
  return c.json({
    playbooks,
    poweredBy: 'gtmengineer.dev',
    message: 'GTMengineer.dev powers our GTM System Generator'
  });
});

app.get('/api/content', (c) => c.json(getStore().contentAssets));

app.post('/api/content/generate', async (c) => {
  const body = await c.req.json<{ signalId: string }>();
  const signal = getStore().signals.find((s) => s.id === body.signalId);
  if (!signal) return c.json({ error: 'Signal not found' }, 404);

  const assets = await amplifyProof(signal);
  return c.json({
    assets,
    poweredBy: process.env.FAXXING_API_KEY ? 'faxxing' : 'demo'
  });
});

app.get('/api/crm', (c) => c.json(getStore().crmEntries));

app.post('/api/crm/sync', async (c) => {
  const body = await c.req.json();
  const result = await syncToZero(body);
  return c.json(result);
});

app.get('/api/growth', (c) => c.json(getStore().recommendations));

app.post('/api/growth/analyze', async (c) => {
  const store = getStore();
  const recommendations = await getGrowthRecommendations(store.signals);
  return c.json({
    recommendations,
    poweredBy: process.env.SCAILE_API_KEY ? 'scaile' : 'demo'
  });
});

app.get('/api/analytics', (c) => c.json(DEMO_ANALYTICS));

app.get('/api/settings', (c) => c.json(getStore().settings));

app.patch('/api/settings', async (c) => {
  const body = await c.req.json<{ demoMode?: boolean; aiProvider?: string; integrations?: Record<string, boolean> }>();
  const store = getStore();
  Object.assign(store.settings, body);
  return c.json(store.settings);
});

app.post('/api/demo/reset', (c) => {
  resetStore();
  return c.json({ message: 'Demo data reset' });
});

app.get('/api/demo/sample-datasets', (c) => {
  return c.json([
    { id: 'enterprise-email', name: 'Enterprise Customer Email', type: 'email' },
    { id: 'g2-review', name: 'G2 Review Bundle', type: 'review' },
    { id: 'sales-transcript', name: 'Sales Call Transcript', type: 'transcript' },
    { id: 'nps-survey', name: 'NPS Survey Responses', type: 'survey' },
    { id: 'support-tickets', name: 'Support Ticket Archive', type: 'support' }
  ]);
});

export default app;
