#!/usr/bin/env node
/**
 * Writes Angular environment files from NG_APP_* so Cloudflare Pages / Coolify
 * build vars reach the browser bundle. Run before `ng serve` / `ng build`.
 *
 * Loads `.env` when present so local `npm start` can use the same names as Pages.
 * Process env wins over `.env` (CI/Pages).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv(join(root, '.env'));

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

function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
