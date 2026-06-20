import { v4 as uuidv4 } from 'uuid';
import type { ExtractedSignal, AudienceMatch, ContentAssetResult, GrowthRecommendationResult } from '../data/demo.js';
import {
  DEMO_SOURCES,
  DEMO_SIGNALS,
  DEMO_AUDIENCES,
  DEMO_GTM_PLAYBOOKS,
  DEMO_CONTENT_ASSETS,
  DEMO_GROWTH_RECOMMENDATIONS,
  DEMO_ANALYTICS
} from '../data/demo.js';

export interface ProofSource {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  content: string;
  fileName?: string;
  status: string;
  createdAt: string;
}

export interface TrustSignal extends ExtractedSignal {
  id: string;
  workspaceId: string;
  sourceId?: string;
  createdAt: string;
}

export interface Store {
  workspaceId: string;
  sources: ProofSource[];
  signals: TrustSignal[];
  audiences: (AudienceMatch & { id: string; trustSignalId?: string })[];
  playbooks: typeof DEMO_GTM_PLAYBOOKS & { id: string }[];
  contentAssets: (ContentAssetResult & { id: string; trustSignalId?: string })[];
  crmEntries: { id: string; entityType: string; entityId: string; title: string; status: string; conversionOutcome?: string; createdAt: string }[];
  recommendations: (GrowthRecommendationResult & { id: string })[];
  settings: { demoMode: boolean; aiProvider: string; integrations: Record<string, boolean> };
}

const WORKSPACE_ID = 'demo-workspace-001';

function initStore(): Store {
  const now = new Date().toISOString();
  return {
    workspaceId: WORKSPACE_ID,
    sources: DEMO_SOURCES.map((s, i) => ({
      id: `source-${i + 1}`,
      workspaceId: WORKSPACE_ID,
      ...s,
      status: 'processed',
      createdAt: now
    })),
    signals: DEMO_SIGNALS.map((s, i) => ({
      id: `signal-${i + 1}`,
      workspaceId: WORKSPACE_ID,
      sourceId: `source-${(i % 5) + 1}`,
      ...s,
      createdAt: now
    })),
    audiences: DEMO_AUDIENCES.map((a, i) => ({
      id: `audience-${i + 1}`,
      trustSignalId: 'signal-2',
      ...a
    })),
    playbooks: DEMO_GTM_PLAYBOOKS.map((p, i) => ({
      id: `playbook-${i + 1}`,
      ...p
    })) as Store['playbooks'],
    contentAssets: DEMO_CONTENT_ASSETS.map((c, i) => ({
      id: `content-${i + 1}`,
      trustSignalId: `signal-${(i % 3) + 1}`,
      ...c
    })),
    crmEntries: [
      { id: 'crm-1', entityType: 'trust_signal', entityId: 'signal-1', title: '£40K Savings — Landing Page Hero', status: 'deployed', conversionOutcome: '+34% CVR', createdAt: now },
      { id: 'crm-2', entityType: 'content_asset', entityId: 'content-1', title: 'Founder LinkedIn Post', status: 'published', conversionOutcome: '2.4K impressions', createdAt: now },
      { id: 'crm-3', entityType: 'gtm_playbook', entityId: 'playbook-1', title: 'Recruitment ICP Outbound', status: 'active', conversionOutcome: '12 meetings booked', createdAt: now },
      { id: 'crm-4', entityType: 'trust_signal', entityId: 'signal-2', title: '12hrs/week — SDR Deck', status: 'active', createdAt: now },
      { id: 'crm-5', entityType: 'content_asset', entityId: 'content-3', title: 'TalentFlow Case Study', status: 'draft', createdAt: now }
    ],
    recommendations: DEMO_GROWTH_RECOMMENDATIONS.map((r, i) => ({
      id: `rec-${i + 1}`,
      ...r,
      proofSignalIds: [`signal-${i + 1}`]
    })),
    settings: {
      demoMode: true,
      aiProvider: 'demo',
      integrations: {
        unify: !!process.env.UNIFY_API_KEY,
        gtmengineer: true,
        faxxing: !!process.env.FAXXING_API_KEY,
        zero: !!process.env.ZERO_API_KEY,
        lightfern: !!process.env.LIGHTFERN_API_KEY,
        scaile: !!process.env.SCAILE_API_KEY
      }
    }
  };
}

let store: Store = initStore();

export function getStore() {
  return store;
}

export function resetStore() {
  store = initStore();
  return store;
}

export function addSource(source: Omit<ProofSource, 'id' | 'createdAt'>) {
  const entry: ProofSource = {
    ...source,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  store.sources.unshift(entry);
  return entry;
}

export function addSignals(signals: Omit<TrustSignal, 'id' | 'createdAt'>[]) {
  const entries = signals.map((s) => ({
    ...s,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  }));
  store.signals.unshift(...entries);
  return entries;
}

export { DEMO_ANALYTICS, WORKSPACE_ID };
