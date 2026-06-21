import { withRateLimit } from '@/lib/server/http';
import { getTrustSignalById } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withRateLimit(request, async () => getTrustSignalById(id));
}
