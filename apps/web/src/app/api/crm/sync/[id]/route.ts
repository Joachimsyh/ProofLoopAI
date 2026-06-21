import { withRateLimit } from '@/lib/server/http';
import { postCrmSync } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withRateLimit(request, async () => postCrmSync(id));
}
