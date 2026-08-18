/**
 * WHO AM I — everyone can see your identity except you.
 *
 * The phone is passed round and held so the guesser cannot read it, exactly as
 * the paper-on-the-forehead version works. Deliberately NOT the tilt-the-phone
 * interaction that a well-known app uses as its signature: the mechanic is a
 * folk game and free to build, but that specific interaction is its trade
 * dress, and copying it invites an argument worth nobody's time.
 *
 * Pure and seeded like the rest of src/engine.
 */
import type { Player, Word } from './types';
import { makeRng, shuffle } from './rng';

export interface WhoAmITurn {
  playerId: string;
  word: Word;
}

export interface WhoAmIState {
  turns: WhoAmITurn[];
  index: number;
  solvedIds: string[];
  passedIds: string[];
}

/**
 * One identity each, in a shuffled order so the same table doesn't get the same
 * run twice. Deals as many turns as there are players, or as many as the deck
 * allows — whichever is smaller.
 */
export function startWhoAmI(
  players: readonly Player[],
  words: readonly Word[],
  seed: number,
): WhoAmIState {
  const rng = makeRng(seed >>> 0);
  const deck = shuffle(words, rng);
  const turns = players
    .slice(0, deck.length)
    .map((player, i) => ({ playerId: player.id, word: deck[i] as Word }));
  return { turns, index: 0, solvedIds: [], passedIds: [] };
}

export function currentTurn(state: WhoAmIState): WhoAmITurn | null {
  return state.turns[state.index] ?? null;
}

export function isOver(state: WhoAmIState): boolean {
  return state.index >= state.turns.length;
}

function advance(state: WhoAmIState, key: 'solvedIds' | 'passedIds'): WhoAmIState {
  const turn = currentTurn(state);
  if (!turn) return state;
  return { ...state, index: state.index + 1, [key]: [...state[key], turn.playerId] };
}

export const markSolved = (s: WhoAmIState): WhoAmIState => advance(s, 'solvedIds');
export const markPassed = (s: WhoAmIState): WhoAmIState => advance(s, 'passedIds');

/** Everyone who has had a go, with what they were and whether they got it. */
export function results(state: WhoAmIState): { turn: WhoAmITurn; solved: boolean }[] {
  return state.turns.slice(0, state.index).map((turn) => ({
    turn,
    solved: state.solvedIds.includes(turn.playerId),
  }));
}
