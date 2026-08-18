/**
 * Launch blockers, made executable.
 *
 * The README carries a "before you submit" checklist. Prose checklists get
 * skimmed; this one exits non-zero. Everything here needs a human, an account
 * or a domain, so it is deliberately NOT part of `npm run check` or CI — it
 * would fail every build until the day you actually ship. Run it by hand
 * before a store submission.
 *
 * Usage:  npm run preflight
 */
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const blockers = [];
const ok = [];

const check = (label, isReady, detail) =>
  (isReady ? ok : blockers).push(`${label}${detail ? ` — ${detail}` : ''}`);

// --- the share loop points somewhere real ---
const config = read('src/config.ts');
const appLink = /export const APP_LINK = '([^']+)'/.exec(config)?.[1] ?? '';
check(
  'APP_LINK',
  appLink !== '' && appLink !== 'https://ringergame.app',
  appLink === 'https://ringergame.app'
    ? `still the placeholder (${appLink}); the podium share button sends the table here`
    : appLink,
);

// --- store submission credentials ---
const eas = JSON.parse(read('eas.json'));
const ios = eas.submit?.production?.ios ?? {};
for (const [key, value] of Object.entries(ios)) {
  check(`eas.json submit.ios.${key}`, !String(value).includes('REPLACE_ME'), String(value));
}

// --- the privacy policy has to be reachable, not just written ---
check(
  'Privacy policy hosted',
  /PRIVACY_POLICY_URL\s*=/.test(config),
  'store/privacy-policy.html is written but no hosted URL is recorded in src/config.ts; both stores require one',
);

// --- version is a real release, not the scaffold default ---
const version = JSON.parse(read('package.json')).version;
check('Version', version !== '0.1.0', version === '0.1.0' ? 'still 0.1.0' : version);

for (const line of ok) console.log(`  ✓ ${line}`);
if (blockers.length) {
  console.error(`\n${blockers.length} launch blocker(s):`);
  for (const b of blockers) console.error(`  ✕ ${b}`);
  console.error(
    '\nThese each need a human, an account or a domain. See "Before you submit" in the README.',
  );
  process.exit(1);
}
console.log('\nNo launch blockers.');
