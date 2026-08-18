/**
 * Forgiving word matching for the ringer's steal attempt.
 * Nobody should lose a round to a typo, and nobody should win on a wild miss.
 */

function normalise(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] as number) + 1,
        (prev[j] as number) + 1,
        (prev[j - 1] as number) + cost,
      );
    }
    prev = curr;
  }
  return prev[b.length] as number;
}

/** Exact after normalising, or within one edit for words longer than 5 chars. */
export function guessMatches(guess: string, target: string): boolean {
  const g = normalise(guess);
  const t = normalise(target);
  if (g.length === 0) return false;
  if (g === t) return true;
  if (t.length > 5 && levenshtein(g, t) <= 1) return true;
  return false;
}

/** Close but not close enough — offer the host a "call it?" override. */
export function guessIsNearMiss(guess: string, target: string): boolean {
  const g = normalise(guess);
  const t = normalise(target);
  if (g.length === 0 || guessMatches(guess, target)) return false;
  return levenshtein(g, t) <= Math.max(2, Math.floor(t.length / 4));
}
