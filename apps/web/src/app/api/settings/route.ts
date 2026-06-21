import { withRateLimit } from '@/lib/server/http';
import { getSettings, patchSettings } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function GET(request: Request) { return withRateLimit(request, async () => getSettings()); }
export async function PATCH(request: Request) { return withRateLimit(request, async () => patchSettings(request)); }
