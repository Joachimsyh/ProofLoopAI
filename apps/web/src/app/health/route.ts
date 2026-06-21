import { getHealth } from '@/lib/server/handlers';

export const runtime = 'nodejs';

export async function GET() {
  return getHealth();
}
