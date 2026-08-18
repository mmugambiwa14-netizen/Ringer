/**
 * Content pipeline: content/en/<pack>.tsv  ->  src/data/packs/en/<pack>.json
 *
 * Words live in tab-separated text files so they can be edited, diffed and
 * argued about by someone who has never opened a JSON file. Ids are generated
 * here and are stable as long as a word keeps its text, which matters because
 * recently-used tracking and future analytics key off them.
 *
 * Every word is checked against the mechanical half of the five criteria from
 * the build plan. The half a machine can't check — "is this clueable from four
 * angles?" — is what playtesting is for.
 *
 * Usage:  node tools/build-packs.mjs [--check]
 *         --check validates without writing, for CI.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'content', 'en');
const OUT = join(ROOT, 'src', 'data', 'packs', 'en');
const META = JSON.parse(readFileSync(join(ROOT, 'content', 'packs.json'), 'utf8')).packs;
const checkOnly = process.argv.includes('--check');

// The binding constraint is display width on a phone, not word count —
// "WALK OF SHAME" is 13 characters and sets beautifully. Word count is only
// capped to stop entries drifting into sentences, which clue terribly.
const MAX_LEN = 16;
const MAX_WORDS = 3;
const MIN_PER_PACK = 40;
const ALLOWED = /^[A-Z0-9][A-Z0-9 '-]*$/;

const errors = [];
const warnings = [];
const seenText = new Map(); // text -> pack id, for cross-pack duplicates

function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function checkText(packId, line, label, text) {
  const where = `${packId}:${line} ${label} "${text}"`;
  if (!ALLOWED.test(text))
    errors.push(`${where} — must be UPPERCASE letters, digits, spaces, ' or -`);
  if (text.length > MAX_LEN)
    errors.push(`${where} — ${text.length} chars, max ${MAX_LEN} (won't fit at display size)`);
  if (text.trim().split(/\s+/).length > MAX_WORDS)
    errors.push(`${where} — more than ${MAX_WORDS} words`);
  if (text !== text.trim()) errors.push(`${where} — stray whitespace`);
}

const built = [];

for (const meta of META) {
  const file = join(SRC, `${meta.id}.tsv`);
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    errors.push(`${meta.id} — missing content/en/${meta.id}.tsv`);
    continue;
  }

  const words = [];
  const idsUsed = new Set();
  const textsInPack = new Set();

  raw.split('\n').forEach((rawLine, i) => {
    const line = i + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const parts = rawLine
      .split('\t')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length < 2) {
      errors.push(
        `${meta.id}:${line} — expected "WORD<tab>DECOY<tab>difficulty", got "${trimmed}"`,
      );
      return;
    }
    const [text, decoy, diffRaw] = parts;
    const difficulty = Number(diffRaw ?? 2);

    checkText(meta.id, line, 'word', text);
    checkText(meta.id, line, 'decoy', decoy);

    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
      errors.push(`${meta.id}:${line} "${text}" — difficulty must be 1, 2 or 3`);
    }
    if (text === decoy)
      errors.push(`${meta.id}:${line} "${text}" — decoy is identical to the word`);
    if (text.includes(decoy) || decoy.includes(text)) {
      errors.push(`${meta.id}:${line} "${text}" / "${decoy}" — one contains the other`);
    }
    // A shared word is the real killer: "TRAIN DRIVER" / "TRAM DRIVER" means
    // every clue about the shared half lands identically for both roles, so
    // the ringer never gives themselves away.
    // Stopwords don't carry meaning, so sharing one is harmless:
    // "SPIN THE BOTTLE" / "PASS THE PARCEL" is a perfectly good pair.
    const STOP = new Set(['THE', 'AND', 'FOR', 'OFF', 'OUT', 'ONE', 'TWO']);
    const shared = text
      .split(' ')
      .filter((tok) => tok.length > 2 && !STOP.has(tok) && decoy.split(' ').includes(tok));
    if (shared.length > 0) {
      errors.push(`${meta.id}:${line} "${text}" / "${decoy}" — share the word "${shared[0]}"`);
    }
    // Spelling-similarity only matters once words are long enough to misread.
    if (Math.min(text.length, decoy.length) >= 8 && levenshtein(text, decoy) <= 2) {
      errors.push(
        `${meta.id}:${line} "${text}" / "${decoy}" — near-identical spelling, easy to misread`,
      );
    }
    if (textsInPack.has(text))
      errors.push(`${meta.id}:${line} "${text}" — duplicate inside the pack`);
    textsInPack.add(text);

    const otherPack = seenText.get(text);
    if (otherPack && otherPack !== meta.id) {
      warnings.push(`"${text}" appears in both ${otherPack} and ${meta.id}`);
    }
    seenText.set(text, meta.id);

    let id = `${meta.id}-${slug(text)}`;
    if (idsUsed.has(id)) {
      errors.push(`${meta.id}:${line} "${text}" — generated id "${id}" collides`);
      return;
    }
    idsUsed.add(id);
    words.push({ id, text, decoy, difficulty });
  });

  if (words.length < MIN_PER_PACK) {
    errors.push(`${meta.id} — only ${words.length} words, minimum ${MIN_PER_PACK}`);
  }

  built.push({ ...meta, words });
}

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn('  ! ' + w);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error('  ✕ ' + e);
  process.exit(1);
}

if (!checkOnly) {
  mkdirSync(OUT, { recursive: true });
  for (const pack of built) {
    writeFileSync(join(OUT, `${pack.id}.json`), JSON.stringify(pack, null, 2) + '\n');
  }
}

const total = built.reduce((n, p) => n + p.words.length, 0);
const byDiff = [1, 2, 3].map(
  (d) => `${d}:${built.reduce((n, p) => n + p.words.filter((w) => w.difficulty === d).length, 0)}`,
);
console.log(
  `${checkOnly ? 'checked' : 'built'} ${built.length} packs, ${total} words (difficulty ${byDiff.join(' ')})`,
);
for (const p of built)
  console.log(
    `  ${p.name.padEnd(9)} ${String(p.words.length).padStart(3)}${p.adult ? '  (18+)' : ''}`,
  );
