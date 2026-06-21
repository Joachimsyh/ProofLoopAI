import { withRateLimit } from '@/lib/server/http';
import { deleteUnifyNotificationSubscription } from '@/lib/server/handlers';

export const runtime = "nodejs";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withRateLimit(request, async () => deleteUnifyNotificationSubscription(id));
}
