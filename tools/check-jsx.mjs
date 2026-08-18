/**
 * Structural JSX check.
 *
 * `tsc` needs node_modules, so in a bare checkout an unbalanced tag ships
 * silently and only appears as a red screen on a device. This is a small
 * scanner — not a parser — that tracks strings, comments and brace depth well
 * enough to balance JSX tags across multi-line elements.
 *
 * The tricky part is telling `<View>` from `useState<Player[]>`. A JSX tag is
 * never preceded by an identifier character; a generic argument always is.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

const IDENT_END = /[A-Za-z0-9_$)\]]/;
const NAME = /[A-Za-z0-9_.]/;

function scan(src, report) {
  const stack = [];
  let i = 0;
  let line = 1;

  const prevMeaningful = (at) => {
    let j = at - 1;
    while (j >= 0 && /\s/.test(src[j])) j--;
    return j >= 0 ? src[j] : '';
  };

  while (i < src.length) {
    const c = src[i];
    if (c === '\n') {
      line++;
      i++;
      continue;
    }

    // comments
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    // strings
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i++;
        else if (src[i] === '\n') line++;
        i++;
      }
      i++;
      continue;
    }

    if (c !== '<') {
      i++;
      continue;
    }

    // ---- closing tag ----
    if (src[i + 1] === '/') {
      let j = i + 2,
        name = '';
      while (j < src.length && NAME.test(src[j])) name += src[j++];
      while (j < src.length && src[j] !== '>') j++;
      if (!name) {
        // `</>` closes a fragment, which was pushed with an empty name.
        const open = stack.pop();
        if (!open) report(`${line} — closing </> with no fragment open`);
        else if (open.name !== '')
          report(`${line} — </> closes <${open.name}> opened at line ${open.line}`);
      } else {
        const open = stack.pop();
        if (!open) report(`${line} — closing </${name}> with nothing open`);
        else if (open.name !== name) {
          report(`${line} — </${name}> closes <${open.name}> opened at line ${open.line}`);
        }
      }
      i = j + 1;
      continue;
    }

    // ---- fragment ----
    if (src[i + 1] === '>') {
      stack.push({ name: '', line });
      i += 2;
      continue;
    }
    if (src[i + 1] === '/') {
      i += 2;
      continue;
    }

    // ---- opening tag, maybe ----
    if (!/[A-Za-z]/.test(src[i + 1] ?? '')) {
      i++;
      continue;
    }
    // A generic argument is always preceded by an identifier character.
    if (IDENT_END.test(prevMeaningful(i))) {
      i++;
      continue;
    }

    let j = i + 1,
      name = '';
    while (j < src.length && NAME.test(src[j])) name += src[j++];
    // Components are capitalised; lowercase means a DOM tag we don't use, or `a < b`.
    if (!/^[A-Z]/.test(name)) {
      i = j;
      continue;
    }

    // consume attributes, respecting nested braces and strings
    let depth = 0,
      selfClosing = false,
      closed = false;
    while (j < src.length) {
      const d = src[j];
      if (d === '\n') line++;
      else if (d === '/' && src[j + 1] === '/') {
        while (j < src.length && src[j] !== '\n') j++;
        continue;
      } else if (d === '/' && src[j + 1] === '*') {
        j += 2;
        while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) {
          if (src[j] === '\n') line++;
          j++;
        }
        j += 2;
        continue;
      } else if (d === '{') depth++;
      else if (d === '}') depth--;
      else if (d === "'" || d === '"' || d === '`') {
        const quote = d;
        j++;
        while (j < src.length && src[j] !== quote) {
          if (src[j] === '\\') j++;
          else if (src[j] === '\n') line++;
          j++;
        }
      } else if (depth === 0 && d === '>') {
        let k = j - 1;
        while (k > i && /\s/.test(src[k])) k--;
        selfClosing = src[k] === '/';
        closed = true;
        j++;
        break;
      }
      j++;
    }
    if (!closed) {
      i = j;
      continue;
    }
    if (!selfClosing) stack.push({ name, line });
    i = j;
  }

  for (const open of stack) report(`${open.line} — <${open.name || 'fragment'}> is never closed`);
}

const problems = [];
for (const file of files) {
  const rel = file.replace(process.cwd() + '/', '');
  scan(readFileSync(file, 'utf8'), (msg) => problems.push(`${rel}:${msg}`));
}

if (problems.length) {
  console.error(`\n${problems.length} JSX problem(s):`);
  for (const p of problems) console.error('  ✕ ' + p);
  process.exit(1);
}
console.log(`JSX OK — ${files.length} components balanced`);
