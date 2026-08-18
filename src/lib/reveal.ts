/**
 * The maths behind slide-up-to-reveal, kept pure so it can be tested without
 * a simulator. RevealCard.tsx owns the gesture wiring; this owns the numbers.
 */

/** Fraction of the card height the finger must travel for a full reveal. */
export const TRAVEL_RATIO = 0.72;

/** Progress past which the word is properly readable, not just peeking. */
export const READABLE_AT = 0.55;

export function travelFor(cardHeight: number): number {
  return Math.max(cardHeight * TRAVEL_RATIO, 1);
}

/**
 * Maps a pan gesture's translationY to shutter progress.
 * Up is negative in gesture space, so an upward drag increases progress.
 * Clamped at both ends: dragging past the top does nothing, and dragging
 * downward never opens the shutter.
 */
export function shutterProgress(translationY: number, travel: number): number {
  if (travel <= 0) return 0;
  const raw = -translationY / travel;
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return raw;
}

export function isReadable(progress: number): boolean {
  return progress >= READABLE_AT;
}

/**
 * How far the shutter is drawn up the card, in pixels.
 * Guarded against negative zero: `-0 * h` is `-0`, which is not `0` under
 * Object.is and shows up as a spurious style change on every frame at rest.
 */
export function shutterOffset(progress: number, cardHeight: number): number {
  if (progress === 0) return 0;
  return -progress * cardHeight;
}
