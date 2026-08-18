import { describe, it } from 'node:test';
import { expect } from './expect';
import { candidateWords, chooseImposters, resolveImposterCount } from '../deal';
import { DEFAULT_CONFIG, reducer } from '../reducer';
import { makeRng } from '../rng';
import type { Player } from '../types';
import { PACKS, deal, withPlayers } from './helpers';

const cfg = (patch = {}) => ({ ...DEFAULT_CONFIG, ...patch });

describe('withheld packs', () => {
  // The reducer is only ever handed the packs the device is allowed to deal
  // from, so a pack that has been locked again simply is not there.
  it('cannot deal from a pack that was not supplied', () => {
    const permitted = PACKS.filter((p) => p.id !== 'food');
    const words = candidateWords(permitted, cfg({ packs: ['party', 'food'] }), []);
    expect(words.every((c) => c.category !== 'FOOD')).toBe(true);
    expect(words.length).toBeGreaterThan(0);
  });

  it('falls back to what is permitted rather than dealing an empty deck', () => {
    // A table picks one pack, then that pack is withheld. Throwing "no words
    // available" into the middle of a round is not an acceptable answer.
    const permitted = PACKS.filter((p) => p.id !== 'food');
    const words = candidateWords(permitted, cfg({ packs: ['food'] }), []);
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((c) => c.category !== 'FOOD')).toBe(true);
  });
});

describe('imposter count', () => {
  it('scales with table size on auto', () => {
    expect(resolveImposterCount(cfg(), 3)).toBe(1);
    expect(resolveImposterCount(cfg(), 6)).toBe(1);
    expect(resolveImposterCount(cfg(), 7)).toBe(2);
    expect(resolveImposterCount(cfg(), 11)).toBe(2);
    expect(resolveImposterCount(cfg(), 12)).toBe(3);
  });

  it('never lets ringers reach half the table', () => {
    expect(resolveImposterCount(cfg({ imposterCount: 3 }), 3)).toBe(1);
    expect(resolveImposterCount(cfg({ imposterCount: 3 }), 4)).toBe(1);
    expect(resolveImposterCount(cfg({ imposterCount: 2 }), 4)).toBe(1);
    expect(resolveImposterCount(cfg({ imposterCount: 3 }), 8)).toBe(3);
  });
});

describe('word selection', () => {
  it('only offers words with a pair in decoy mode', () => {
    const all = candidateWords(PACKS, cfg({ packs: ['party', 'food'] }), []);
    const decoy = candidateWords(PACKS, cfg({ mode: 'decoy', packs: ['party', 'food'] }), []);
    expect(all.length).toBe(6);
    expect(decoy.length).toBe(4);
    expect(decoy.every((c) => c.word.decoy)).toBe(true);
  });

  it('avoids recently used words, but recovers when the pool is exhausted', () => {
    const recent = PACKS.flatMap((p) => p.words.map((w) => w.id));
    const fresh = candidateWords(PACKS, cfg({ packs: ['party', 'food'] }), recent);
    expect(fresh.length).toBe(6); // falls back rather than throwing
  });

  it('does not repeat a word across consecutive rounds', () => {
    let s = withPlayers(5);
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      s = deal(s);
      seen.push(s.round!.wordId);
      s = reducer(s, { type: 'NEXT_ROUND' });
    }
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe('fair deal', () => {
  const players = (counts: number[]): Player[] =>
    counts.map((c, i) => ({ id: `p${i}`, name: `P${i}`, icon: i, score: 0, ringerCount: c }));

  it('picks the player who has been the ringer least', () => {
    const chosen = chooseImposters(players([3, 3, 0, 3, 3]), 1, true, makeRng(1));
    expect(chosen).toEqual(['p2']);
  });

  it('ignores history when fair deal is off', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      results.add(chooseImposters(players([9, 0, 0, 0, 0]), 1, false, makeRng(seed))[0] as string);
    }
    expect(results.size).toBeGreaterThan(1); // p0 is still reachable
  });

  it('spreads the role around over a long session', () => {
    let s = withPlayers(5, 999);
    const tally = new Map<string, number>();
    for (let i = 0; i < 20; i++) {
      s = deal(s);
      for (const id of s.round!.imposterIds) tally.set(id, (tally.get(id) ?? 0) + 1);
      s = reducer(s, { type: 'NEXT_ROUND' });
    }
    const counts = [...tally.values()];
    expect(tally.size).toBe(5);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});
