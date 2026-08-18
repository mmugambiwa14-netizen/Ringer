import { describe, it } from 'node:test';
import { expect } from './expect';
import { deriveSeed, makeRng, pick, shuffle } from '../rng';

describe('seeded rng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });

  it('stays inside [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 5000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('shuffle keeps every element exactly once', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffle(input, makeRng(9));
    expect(out.slice().sort((x, y) => x - y)).toEqual(input);
  });

  it('shuffle is not the identity', () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(input, makeRng(3))).not.toEqual(input);
  });

  it('derived seeds differ from the parent and from each other', () => {
    const parent = 12345;
    const seeds = new Set([deriveSeed(parent, 0), deriveSeed(parent, 1), deriveSeed(parent, 2)]);
    expect(seeds.size).toBe(3);
    expect(seeds.has(parent)).toBe(false);
  });

  it('pick throws on an empty list rather than returning undefined', () => {
    expect(() => pick([], makeRng(1))).toThrow();
  });
});
