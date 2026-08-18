/**
 * CHARADES — act it out, no words, no pointing.
 *
 * Deliberately much smaller than the RINGER engine: there is no hidden
 * information, so there is nothing to get wrong about who may see what. It is a
 * shuffled deck, a timer the UI owns, and two buttons.
 *
 * Pure and seeded like everything else in src/engine — no clock, no
 * Math.random, so a round is reproducible in a test.
 */
import type { Word } from './types';
import { makeRng, shuffle } from './rng';

export interface CharadesState {
  /** The whole shuffled deck. A round consumes as much of it as it gets through. */
  deck: Word[];
  index: number;
  gotIds: string[];
  skippedIds: string[];
}

export function startCharades(words: readonly Word[], seed: number): CharadesState {
  return { deck: shuffle(words, makeRng(seed >>> 0)), index: 0, gotIds: [], skippedIds: [] };
}

export function currentWord(state: CharadesState): Word | null {
  return state.deck[state.index] ?? null;
}

/** True once the deck is spent — a long round on a small pack can reach this. */
export function isDeckSpent(state: CharadesState): boolean {
  return state.index >= state.deck.length;
}

function advance(state: CharadesState, key: 'gotIds' | 'skippedIds'): CharadesState {
  const word = currentWord(state);
  if (!word) return state;
  return { ...state, index: state.index + 1, [key]: [...state[key], word.id] };
}

export const markGot = (s: CharadesState): CharadesState => advance(s, 'gotIds');
export const markSkipped = (s: CharadesState): CharadesState => advance(s, 'skippedIds');

/** Skips cost nothing but the clock — the point is to keep the round moving. */
export function charadesScore(state: CharadesState): { got: number; skipped: number } {
  return { got: state.gotIds.length, skipped: state.skippedIds.length };
}

/** What the deck actually produced, in play order, for the results screen. */
export function playedWords(state: CharadesState): { word: Word; got: boolean }[] {
  return state.deck.slice(0, state.index).map((word) => ({
    word,
    got: state.gotIds.includes(word.id),
  }));
}
