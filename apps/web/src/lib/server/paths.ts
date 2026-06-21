import { existsSync } from 'fs';
import { join, resolve } from 'path';

export function getDemoDataDir(): string {
  const candidates = [
    resolve(process.cwd(), 'demo-data'),
    resolve(process.cwd(), '../../demo-data'),
    resolve(process.cwd(), '../../../demo-data')
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, 'manifest.json'))) return dir;
  }

  return resolve(process.cwd(), '../../demo-data');
}
