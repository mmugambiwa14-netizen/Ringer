import { describe, it } from 'node:test';
import { expect } from './expect';
import { applyAwards, awardsForRound, standings } from '../scoring';
import type { Player, RoundState } from '../types';

const players: Player[] = ['a', 'b', 'c', 'd'].map((id, i) => ({
  id,
  name: id.toUpperCase(),
  icon: i,
  score: 0,
  ringerCount: 0,
}));

const round = (patch: Partial<RoundState> = {}): RoundState => ({
  startedAt: 1_700_000_000_000,
  wordId: 'w1',
  word: 'PIZZA',
  decoyWord: null,
  hintWord: null,
  category: 'FOOD',
  imposterIds: ['b'],
  revealIndex: 0,
  startingPlayerId: 'a',
  clueLap: 0,
  clueTurnIndex: 0,
  votes: {},
  accusedId: 'b',
  tiedIds: [],
  revoteCount: 0,
  imposterGuess: null,
  guessWasCorrect: false,
  outcome: null,
  ...patch,
});

const total = (list: Player[], id: string) => list.find((p) => p.id === id)!.score;

describe('scoring', () => {
  it('crew win gives every non-ringer a point', () => {
    const out = applyAwards(players, awardsForRound(players, round(), 'crew', false));
    expect(total(out, 'a')).toBe(1);
    expect(total(out, 'c')).toBe(1);
    expect(total(out, 'd')).toBe(1);
    expect(total(out, 'b')).toBe(0); // the ringer gets nothing
  });

  it('adds a bonus for crew who personally voted for a ringer', () => {
    const r = round({ votes: { a: 'b', c: 'd', d: 'b' } });
    const out = applyAwards(players, awardsForRound(players, r, 'crew', false));
    expect(total(out, 'a')).toBe(2); // voted right
    expect(total(out, 'd')).toBe(2); // voted right
    expect(total(out, 'c')).toBe(1); // voted wrong, still on the winning side
  });

  it('a surviving ringer takes 3', () => {
    const out = applyAwards(
      players,
      awardsForRound(players, round({ accusedId: 'c' }), 'imposter', false),
    );
    expect(total(out, 'b')).toBe(3);
    expect(total(out, 'a')).toBe(0);
  });

  it('a caught ringer who guesses the word takes 2', () => {
    const out = applyAwards(players, awardsForRound(players, round(), 'imposter', true));
    expect(total(out, 'b')).toBe(2);
    expect(total(out, 'a')).toBe(0);
  });

  it('a caught ringer who guesses wrong takes nothing', () => {
    const out = applyAwards(players, awardsForRound(players, round(), 'crew', false));
    expect(total(out, 'b')).toBe(0);
  });

  it('splits ringer points per ringer, not per team', () => {
    const r = round({ imposterIds: ['b', 'c'], accusedId: 'a' });
    const out = applyAwards(players, awardsForRound(players, r, 'imposter', false));
    expect(total(out, 'b')).toBe(3);
    expect(total(out, 'c')).toBe(3);
  });

  it('orders standings highest first', () => {
    const scored = players.map((p, i) => ({ ...p, score: i }));
    expect(standings(scored).map((p) => p.id)).toEqual(['d', 'c', 'b', 'a']);
  });
});
