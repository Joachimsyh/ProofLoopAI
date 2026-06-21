import { withRateLimit } from '@/lib/server/http';
import { getUnifyAnalyticsEventsHandler } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function GET(request: Request) { return withRateLimit(request, async () => getUnifyAnalyticsEventsHandler()); }
