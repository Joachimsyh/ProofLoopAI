import { withRateLimit } from '@/lib/server/http';
import { postUnifyNotificationsSubscribe } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function POST(request: Request) { return withRateLimit(request, async () => postUnifyNotificationsSubscribe(request)); }
