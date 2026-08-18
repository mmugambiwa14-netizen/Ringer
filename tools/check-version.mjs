/**
 * One version number, three places that have to agree.
 *
 * `package.json` and `app.json` are what actually ship; `APP_VERSION` in
 * src/config.ts is what the settings screen prints back to the player. They
 * had already drifted — settings said v1.0.0 while the build was 0.1.0 — which
 * is exactly the kind of thing nobody notices until a bug report quotes a
 * version that was never released.
 *
 * Usage:  node tools/check-version.mjs
 */
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const pkg = JSON.parse(read('package.json')).version;
const app = JSON.parse(read('app.json')).expo.version;

const configSrc = read('src/config.ts');
const match = /export const APP_VERSION = '([^']+)'/.exec(configSrc);
if (!match) {
  console.error("✕ src/config.ts — couldn't find `export const APP_VERSION = '...'`");
  process.exit(1);
}
const config = match[1];

const found = { 'package.json': pkg, 'app.json (expo.version)': app, 'src/config.ts': config };
const distinct = [...new Set(Object.values(found))];

if (distinct.length > 1) {
  console.error('\nVersion mismatch:');
  for (const [where, value] of Object.entries(found)) console.error(`  ✕ ${where}: ${value}`);
  console.error('\nAll three must match. The settings screen shows src/config.ts to players.');
  process.exit(1);
}

console.log(`version OK — ${distinct[0]} in all three places`);
