import fs from 'fs';
import path from 'path';

const appApi = path.join(process.cwd(), 'src', 'app', 'api');

const routes = [
  {
    file: 'dashboard/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getDashboard } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getDashboard()); }']
  },
  {
    file: 'sources/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getSources } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getSources()); }']
  },
  {
    file: 'sources/text/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postSourcesText } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postSourcesText(request)); }']
  },
  {
    file: 'sources/upload/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postSourcesUpload } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postSourcesUpload(request)); }']
  },
  {
    file: 'discovery/demo/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postDiscoveryDemo } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postDiscoveryDemo()); }']
  },
  {
    file: 'discovery/run/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postDiscoveryRun } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postDiscoveryRun(request)); }']
  },
  {
    file: 'trust-signals/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getTrustSignals } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getTrustSignals()); }']
  },
  {
    file: 'trust-signals/[id]/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getTrustSignalById } from '@/lib/server/handlers';"],
    exports: [
      'export const runtime = "nodejs";',
      'export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  const { id } = await params;',
      '  return withRateLimit(request, async () => getTrustSignalById(id));',
      '}'
    ]
  },
  {
    file: 'rankings/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getRankings } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getRankings()); }']
  },
  {
    file: 'audiences/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getAudiences } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getAudiences()); }']
  },
  {
    file: 'audiences/expand/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postAudiencesExpand } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postAudiencesExpand(request)); }']
  },
  {
    file: 'rag/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getRagStatusHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getRagStatusHandler()); }']
  },
  {
    file: 'rag/ingest/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postRagIngest } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postRagIngest(request)); }']
  },
  {
    file: 'rag/query/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postRagQuery } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postRagQuery(request)); }']
  },
  {
    file: 'rag/supported-types/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getRagSupportedTypes } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getRagSupportedTypes()); }']
  },
  {
    file: 'rag/demo-data/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getRagDemoData } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getRagDemoData()); }']
  },
  {
    file: 'unify/conversations/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyConversations } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyConversations()); }']
  },
  {
    file: 'unify/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyStatus } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyStatus()); }']
  },
  {
    file: 'unify/objects/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyObjects } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyObjects()); }']
  },
  {
    file: 'unify/sync-signals/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifySyncSignals } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifySyncSignals()); }']
  },
  {
    file: 'unify/notifications/subscribe/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifyNotificationsSubscribe } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyNotificationsSubscribe(request)); }']
  },
  {
    file: 'unify/notifications/subscriptions/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyNotificationSubscriptions } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyNotificationSubscriptions()); }']
  },
  {
    file: 'unify/notifications/subscriptions/[id]/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { deleteUnifyNotificationSubscription } from '@/lib/server/handlers';"],
    exports: [
      'export const runtime = "nodejs";',
      'export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  const { id } = await params;',
      '  return withRateLimit(request, async () => deleteUnifyNotificationSubscription(id));',
      '}'
    ]
  },
  {
    file: 'unify/notifications/test/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifyNotificationsTest } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyNotificationsTest(request)); }']
  },
  {
    file: 'unify/notifications/webhook/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifyNotificationsWebhook } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyNotificationsWebhook(request)); }']
  },
  {
    file: 'unify/notifications/events/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyNotificationEvents } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyNotificationEvents()); }']
  },
  {
    file: 'unify/notifications/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyNotificationsStatusHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyNotificationsStatusHandler()); }']
  },
  {
    file: 'unify/analytics/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyAnalyticsStatusHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyAnalyticsStatusHandler()); }']
  },
  {
    file: 'unify/analytics/events/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getUnifyAnalyticsEventsHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyAnalyticsEventsHandler()); }']
  },
  {
    file: 'unify/analytics/track/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifyAnalyticsTrack } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyAnalyticsTrack(request)); }']
  },
  {
    file: 'unify/analytics/identify/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postUnifyAnalyticsIdentify } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyAnalyticsIdentify(request)); }']
  },
  {
    file: 'faxxing/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getFaxxingStatusHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getFaxxingStatusHandler()); }']
  },
  {
    file: 'faxxing/validate/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postFaxxingValidate } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postFaxxingValidate(request)); }']
  },
  {
    file: 'gtm-playbooks/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getGtmPlaybooks } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getGtmPlaybooks()); }']
  },
  {
    file: 'gtmengineer/generate/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postGtmengineerGenerate } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postGtmengineerGenerate()); }']
  },
  {
    file: 'gtm/generate/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postGtmGenerate } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postGtmGenerate()); }']
  },
  {
    file: 'gtm/feedback/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postGtmFeedback } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postGtmFeedback(request)); }']
  },
  {
    file: 'gtm/metrics/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getGtmMetricsHandler } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getGtmMetricsHandler()); }']
  },
  {
    file: 'content/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getContent } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getContent()); }']
  },
  {
    file: 'content/generate/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postContentGenerate } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postContentGenerate(request)); }']
  },
  {
    file: 'crm/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getCrm } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getCrm()); }']
  },
  {
    file: 'crm/status/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getCrmStatus } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getCrmStatus()); }']
  },
  {
    file: 'crm/sync/[id]/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postCrmSync } from '@/lib/server/handlers';"],
    exports: [
      'export const runtime = "nodejs";',
      'export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {',
      '  const { id } = await params;',
      '  return withRateLimit(request, async () => postCrmSync(id));',
      '}'
    ]
  },
  {
    file: 'crm/sync-all/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postCrmSyncAll } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postCrmSyncAll()); }']
  },
  {
    file: 'growth/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getGrowth } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getGrowth()); }']
  },
  {
    file: 'growth/analyze/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postGrowthAnalyze } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postGrowthAnalyze()); }']
  },
  {
    file: 'analytics/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getAnalytics } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getAnalytics()); }']
  },
  {
    file: 'settings/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getSettings, patchSettings } from '@/lib/server/handlers';"],
    exports: [
      'export const runtime = "nodejs";',
      'export async function GET(request: Request) { return withRateLimit(request, async () => getSettings()); }',
      'export async function PATCH(request: Request) { return withRateLimit(request, async () => patchSettings(request)); }'
    ]
  },
  {
    file: 'demo/reset/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { postDemoReset } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function POST(request: Request) { return withRateLimit(request, async () => postDemoReset()); }']
  },
  {
    file: 'demo/sample-datasets/route.ts',
    imports: ["import { withRateLimit } from '@/lib/server/http';", "import { getDemoSampleDatasets } from '@/lib/server/handlers';"],
    exports: ['export const runtime = "nodejs";', 'export async function GET(request: Request) { return withRateLimit(request, async () => getDemoSampleDatasets()); }']
  }
];

for (const route of routes) {
  const dir = path.join(appApi, path.dirname(route.file));
  fs.mkdirSync(dir, { recursive: true });
  const content = [...route.imports, '', ...route.exports, ''].join('\n');
  fs.writeFileSync(path.join(appApi, route.file), content);
}

const healthDir = path.join(process.cwd(), 'src', 'app', 'health');
fs.mkdirSync(healthDir, { recursive: true });
fs.writeFileSync(
  path.join(healthDir, 'route.ts'),
  `import { getHealth } from '@/lib/server/handlers';

export const runtime = 'nodejs';

export async function GET() {
  return getHealth();
}
`
);

console.log(`Generated ${routes.length + 1} route handlers`);
