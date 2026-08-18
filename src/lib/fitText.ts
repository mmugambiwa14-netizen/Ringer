/**
 * Pick a font size that lets a word fit, rather than trusting the platform to.
 *
 * `adjustsFontSizeToFit` is unreliable — react-native-web largely ignores it —
 * and the failure is ugly in a specific way: a long single word gets broken
 * mid-word, so ACCOUNTANT renders as "ACCOUNTA / NT". These screens show one
 * word at display size, so a deterministic size computed from the text is both
 * safer and testable.
 *
 * The binding constraint is the longest single token, because that is the part
 * that cannot wrap. Total length matters too, but only for how many lines.
 */

/** Archivo Black caps run about 0.72em wide, so ~9 characters fill a phone at 52pt. */
const CHARS_AT_MAX = 9;
const CHARS_ACROSS_TWO_LINES = 15;

export function displayFontSize(text: string, max = 52, min = 22): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return max;
  const longestToken = Math.max(...trimmed.split(/\s+/).map((w) => w.length), 1);
  const byToken = (max * CHARS_AT_MAX) / longestToken;
  const byTotal = (max * CHARS_ACROSS_TWO_LINES) / trimmed.length;
  return Math.round(Math.max(min, Math.min(max, byToken, byTotal)));
}
