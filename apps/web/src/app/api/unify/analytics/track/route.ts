import { withRateLimit } from '@/lib/server/http';
import { postUnifyAnalyticsTrack } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyAnalyticsTrack(request)); }
