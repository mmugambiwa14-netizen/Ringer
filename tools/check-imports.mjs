/**
 * Static sanity check: every relative import in the project must resolve to a
 * real file, and nothing under src/engine may import UI or React Native.
 * Runs without node_modules, which is the only static check available before
 * `npm install` has happened.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd();
const EXT = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx'];
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full)) files.push(full);
  }
}
walk(join(ROOT, 'src'));
walk(join(ROOT, 'app'));

const problems = [];
const IMPORT_RE = /(?:from|import)\s+['"]([^'"]+)['"]/g;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const isEngine = file.includes('/src/engine/') && !file.includes('__tests__');

  for (const [, spec] of src.matchAll(IMPORT_RE)) {
    if (isEngine && (spec.includes('/ui') || spec.startsWith('react') || spec.startsWith('expo'))) {
      problems.push(`${file}: engine must stay pure, but imports "${spec}"`);
    }
    if (!spec.startsWith('.')) continue;
    const base = resolve(dirname(file), spec);
    const found = EXT.some((e) => {
      try {
        return statSync(base + e).isFile();
      } catch {
        return false;
      }
    });
    if (!found) problems.push(`${file}: cannot resolve "${spec}"`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p.replace(ROOT + '/', ''));
  process.exit(1);
}
console.log(`imports OK — ${files.length} files checked, engine boundary intact`);

/* ------------------------------------------------------------------ *
 * Pass 2: named imports must actually exist, and React hooks must be
 * imported. Without `tsc` in a bare checkout these are the two typos
 * that reach a device as a blank screen.
 * ------------------------------------------------------------------ */

const exportsOf = new Map(); // absolute file path -> Set of exported names
const EXPORT_DECL =
  /export\s+(?:async\s+)?(?:function|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST = /export\s*\{([^}]*)\}/g;
const REEXPORT = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;

function resolveFile(base) {
  for (const e of EXT) {
    try {
      if (statSync(base + e).isFile()) return base + e;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

function collectExports(file, seen = new Set()) {
  if (exportsOf.has(file)) return exportsOf.get(file);
  if (seen.has(file)) return new Set();
  seen.add(file);

  const names = new Set();
  let src = '';
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    exportsOf.set(file, names);
    return names;
  }

  for (const [, name] of src.matchAll(EXPORT_DECL)) names.add(name);
  for (const [, list] of src.matchAll(EXPORT_LIST)) {
    for (const part of list.split(',')) {
      const name = part
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
        .replace(/^type\s+/, '');
      if (name) names.add(name);
    }
  }
  for (const [, spec] of src.matchAll(REEXPORT)) {
    const target = resolveFile(resolve(dirname(file), spec));
    if (target) for (const n of collectExports(target, seen)) names.add(n);
  }

  exportsOf.set(file, names);
  return names;
}

const HOOKS = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useReducer'];
const NAMED_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g;

const pass2 = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');

  for (const [, list, spec] of src.matchAll(NAMED_IMPORT)) {
    const target = resolveFile(resolve(dirname(file), spec));
    if (!target) continue; // pass 1 already reported unresolvable paths
    const available = collectExports(target);
    if (available.size === 0) continue; // JSON or something we can't read
    for (const raw of list.split(',')) {
      const name = raw
        .split(/\s+as\s+/)[0]
        ?.trim()
        .replace(/^type\s+/, '');
      if (!name) continue;
      if (!available.has(name)) {
        pass2.push(`${file}: "${name}" is not exported by ${spec}`);
      }
    }
  }

  // A hook used but never imported is a hard crash on first render.
  const reactImport = src.match(/import\s*\{([^}]*)\}\s*from\s*['"]react['"]/);
  const imported = new Set(
    (reactImport?.[1] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const hook of HOOKS) {
    if (new RegExp(`(^|[^.\\w])${hook}\\s*\\(`).test(src) && !imported.has(hook)) {
      pass2.push(`${file}: uses ${hook}() but does not import it from react`);
    }
  }
}

if (pass2.length) {
  console.error(`\n${pass2.length} problem(s):`);
  for (const p of pass2) console.error('  ✕ ' + p.replace(ROOT + '/', ''));
  process.exit(1);
}
console.log(`named imports OK — ${exportsOf.size} modules indexed`);
