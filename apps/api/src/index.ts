import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../../..');
if (process.env.DOTENV_CONFIG_PATH) {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH });
}
dotenv.config({ path: resolve(rootDir, '.env') });
dotenv.config({ path: resolve(rootDir, '.env.example') });
dotenv.config();
import { serve } from '@hono/node-server';
import app from './routes/index.js';

const port = Number(process.env.PORT ?? 3001);

console.log(`🚀 ProofLoop API running on http://localhost:${port}`);
console.log(`   Demo mode: ${process.env.AI_DEMO_MODE !== 'false' ? 'ON' : 'OFF'}`);

serve({ fetch: app.fetch, port });
