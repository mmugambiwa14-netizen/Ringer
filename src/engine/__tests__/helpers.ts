import type { GameState, Pack } from '../types';
import { initialState, reducer } from '../reducer';

export const PACKS: Pack[] = [
  {
    id: 'party',
    name: 'PARTY',
    emoji: '🎉',
    isFree: true,
    words: [
      { id: 'party-1', text: 'KARAOKE', decoy: 'STAND-UP' },
      { id: 'party-2', text: 'HANGOVER', decoy: 'JET LAG' },
      { id: 'party-3', text: 'BIRTHDAY', decoy: 'ANNIVERSARY' },
      { id: 'party-4', text: 'DANCE FLOOR' },
    ],
  },
  {
    id: 'food',
    name: 'FOOD',
    emoji: '🍕',
    isFree: true,
    words: [
      { id: 'food-1', text: 'PIZZA', decoy: 'PANCAKE' },
      { id: 'food-2', text: 'LEFTOVERS' },
    ],
  },
];

export function withPlayers(count: number, seed = 12345): GameState {
  let s = initialState(seed, { packs: ['party', 'food'] });
  for (let i = 0; i < count; i++) s = reducer(s, { type: 'ADD_PLAYER', name: `P${i + 1}` });
  return s;
}

export function deal(state: GameState) {
  // Fixed timestamp: the engine must never read a clock, and neither should its tests.
  return reducer(state, { type: 'DEAL', at: 1_700_000_000_000 }, PACKS);
}

/** Walk every reveal so the state lands on startingPlayer. */
export function revealAll(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < s.players.length; i++) s = reducer(s, { type: 'REVEAL_NEXT' });
  return s;
}

/** Run the clue phase to completion. */
export function playClues(state: GameState): GameState {
  let s = reducer(state, { type: 'BEGIN_CLUES' });
  const total = s.config.clueLaps * s.players.length;
  for (let i = 0; i < total; i++) s = reducer(s, { type: 'NEXT_TURN' });
  return s;
}
