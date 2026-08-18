/**
 * Rules of Hooks, checked statically.
 *
 * React requires every hook to run in the same order on every render. A hook
 * placed after a conditional `return` in a component silently works until the
 * branch flips — and then React tears the component down mid-game. Screens in
 * this app return early all the time (no round, wrong vote style, not yet
 * handed over), so this is the exact shape of bug that hides here.
 *
 * Heuristic but effective: inside a component body, once a top-level `return`
 * has been seen, any top-level hook call is flagged.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HOOK = /^\s{2}(?:const|let)?\s*[\w{},[\]\s:]*=?\s*use[A-Z]\w*\(/;
const HOOK_BARE = /^\s{2}use[A-Z]\w*\(/;
// Both shapes count: a bare `return` on its own line, and the inline
// `if (cond) return null;` guard these screens use constantly.
const TOP_RETURN = /^\s{2}(?:return\b|if\s*\(.*\)\s*return\b)/;
const COMPONENT = /^(?:export\s+default\s+)?function\s+[A-Z]\w*\s*\(/;

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
}
walk(join(process.cwd(), 'app'));
walk(join(process.cwd(), 'src'));

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inComponent = false;
  let sawReturn = false;
  lines.forEach((line, i) => {
    if (COMPONENT.test(line)) {
      inComponent = true;
      sawReturn = false;
      return;
    }
    if (!inComponent) return;
    if (line === '}') {
      inComponent = false;
      return;
    }
    if (TOP_RETURN.test(line)) sawReturn = true;
    if (sawReturn && (HOOK.test(line) || HOOK_BARE.test(line))) {
      problems.push(`${file}:${i + 1} — hook after an early return: ${line.trim().slice(0, 60)}`);
    }
  });
}

if (problems.length) {
  console.error(`\n${problems.length} Rules of Hooks violation(s):`);
  for (const p of problems) console.error('  ✕ ' + p.replace(process.cwd() + '/', ''));
  process.exit(1);
}
console.log(`hooks OK — ${files.length} components checked`);
