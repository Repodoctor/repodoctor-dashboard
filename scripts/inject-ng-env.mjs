#!/usr/bin/env node
/**
 * Writes Angular environment files from NG_APP_* so Cloudflare Pages / Coolify
 * build vars reach the browser bundle. Run before `ng serve` / `ng build`.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gateway = (process.env.NG_APP_GATEWAY_URL || 'http://127.0.0.1:43111').replace(/\/$/, '');
const supabaseUrl = process.env.NG_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NG_APP_SUPABASE_ANON_KEY || '';

function render(production) {
  return `export const environment = {
  production: ${production},
  gatewayUrl: ${JSON.stringify(gateway)},
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  apiBaseUrl: ${JSON.stringify(`${gateway}/api/v1`)},
};
`;
}

writeFileSync(join(root, 'src/environments/environment.ts'), render(false));
writeFileSync(join(root, 'src/environments/environment.prod.ts'), render(true));
console.log(`injected NG_APP_GATEWAY_URL=${gateway}`);
