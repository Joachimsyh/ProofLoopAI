const API_BASE = typeof window !== 'undefined' ? '' : (process.env.API_URL ?? 'http://localhost:3001');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export interface TrustSignal {
  id: string;
  quote: string;
  category: string;
  signalType: string;
  strength: number;
  proofScore: number;
  credibility: number;
  specificity: number;
  revenueImpact: number;
  emotionalImpact: number;
  conversionPotential: number;
  recommendedUses: string[];
  sourceId?: string;
  createdAt?: string;
}

export interface ProofSource {
  id: string;
  type: string;
  title: string;
  content: string;
  fileName?: string;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  workspaceId: string;
  stats: {
    totalProofSources: number;
    trustSignalsFound: number;
    avgProofScore: number;
    assetsGenerated: number;
    conversionLift: number;
  };
  topSignals: TrustSignal[];
  recentSources: ProofSource[];
  integrationStatus: Record<string, boolean>;
}

export interface CrmSyncState {
  status: 'not_synced' | 'not_configured' | 'synced' | 'failed';
  zeroId?: string;
  zeroUrl?: string;
  error?: string;
  lastSyncedAt?: string;
}

export interface CrmEntry {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  status: string;
  conversionOutcome?: string;
  zeroSync: CrmSyncState;
}

export const api = {
  getDashboard: () => request<DashboardData>('/api/dashboard'),
  getSources: () => request<ProofSource[]>('/api/sources'),
  getTrustSignals: () => request<TrustSignal[]>('/api/trust-signals'),
  getRankings: () => request<(TrustSignal & { rank: number })[]>('/api/rankings'),
  getAudiences: () => request<unknown[]>('/api/audiences'),
  expandAudience: (proofQuote: string) =>
    request<{ audiences: unknown[]; poweredBy: string }>('/api/audiences/expand', {
      method: 'POST',
      body: JSON.stringify({ proofQuote })
    }),
  getGtmPlaybooks: () => request<unknown[]>('/api/gtm-playbooks'),
  generateGtm: () => request<{ playbooks: unknown[]; poweredBy: string }>('/api/gtmengineer/generate', { method: 'POST' }),
  getContent: () => request<unknown[]>('/api/content'),
  generateContent: (signalId: string) =>
    request<{ assets: unknown[]; poweredBy: string }>('/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({ signalId })
    }),
  getCrm: () => request<CrmEntry[]>('/api/crm'),
  syncCrmEntry: (id: string) =>
    request<{ entry: CrmEntry; result: CrmSyncState & { synced: boolean; mode: string } }>(`/api/crm/sync/${id}`, {
      method: 'POST'
    }),
  getGrowth: () => request<unknown[]>('/api/growth'),
  analyzeGrowth: () => request<{ recommendations: unknown[]; poweredBy: string }>('/api/growth/analyze', { method: 'POST' }),
  getAnalytics: () => request<unknown>('/api/analytics'),
  getSettings: () => request<unknown>('/api/settings'),
  updateSettings: (data: unknown) =>
    request('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  submitText: (content: string, title?: string, type?: string) =>
    request<{ source: ProofSource; signals: TrustSignal[]; count: number }>('/api/sources/text', {
      method: 'POST',
      body: JSON.stringify({ content, title, type })
    }),
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ source: ProofSource; signals: TrustSignal[]; count: number }>('/api/sources/upload', {
      method: 'POST',
      body: form
    });
  },
  getSampleDatasets: () => request<{ id: string; name: string; type: string }[]>('/api/demo/sample-datasets'),
  resetDemo: () => request('/api/demo/reset', { method: 'POST' })
};
