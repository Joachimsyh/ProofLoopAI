import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://proofloop:proofloop@localhost:5432/proofloop';

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!dbInstance) {
    try {
      client = postgres(connectionString, { max: 1, connect_timeout: 3 });
      await client`SELECT 1`;
      dbInstance = drizzle(client, { schema });
    } catch {
      return null;
    }
  }
  return dbInstance;
}

export function isDemoMode() {
  return process.env.AI_DEMO_MODE === 'true' || !process.env.VOYAGE_API_KEY;
}

export { schema };
