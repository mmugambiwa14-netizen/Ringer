import { describe, it } from 'node:test';
import type { Pack } from '../../engine/types';
import { expect } from '../../engine/__tests__/expect';
import {
  FREE_WORDS,
  PACKS,
  TOTAL_WORDS,
  listablePacks,
  packById,
  packsForGame,
  playablePacks,
  usableWordCount,
} from '../packs';
import { DEFAULT_CONFIG } from '../../engine/reducer';
import { candidateWords } from '../../engine/deal';

/**
 * The content contract. These run against the generated JSON, so they catch a
 * pack that was hand-edited or a build that wasn't re-run — the validator only
 * sees the TSV.
 */
describe('word packs', () => {
  // The RINGER packs. Charades and Who Am I have their own contract below —
  // they carry no decoy pairs, so holding them to this one would be wrong.
  const RINGER = packsForGame('ringer');

  it('ships ten packs with a healthy word count', () => {
    expect(RINGER).toHaveLength(10);
    expect(TOTAL_WORDS).toBeGreaterThan(700);
    for (const pack of RINGER) {
      expect(pack.words.length).toBeGreaterThanOrEqual(40);
    }
  });

  it('gives every word a decoy, so Decoy mode never runs dry', () => {
    for (const pack of RINGER) {
      for (const word of pack.words) {
        expect(typeof word.decoy).toBe('string');
        expect(word.decoy !== word.text).toBe(true);
      }
    }
  });

  it('keeps every word short enough to set at display size', () => {
    for (const pack of RINGER) {
      for (const word of pack.words) {
        expect(word.text.length).toBeLessThanOrEqual(16);
        expect((word.decoy ?? '').length).toBeLessThanOrEqual(16);
      }
    }
  });

  it('uses globally unique ids — recent-word tracking depends on it', () => {
    const ids = PACKS.flatMap((p) => p.words.map((w) => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never repeats a word across packs, so one session cannot deal it twice', () => {
    const texts = RINGER.flatMap((p) => p.words.map((w) => w.text));
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('tags every word with a difficulty in range', () => {
    for (const pack of PACKS) {
      for (const word of pack.words) {
        expect([1, 2, 3].includes(word.difficulty ?? 0)).toBe(true);
      }
    }
  });

  it('keeps the three free packs free and the adult pack marked', () => {
    const free = RINGER.filter((p) => p.isFree).map((p) => p.id);
    expect(free).toEqual(['party', 'food', 'animals']);
    expect(RINGER.filter((p) => p.adult).map((p) => p.id)).toEqual(['spicy']);
  });

  it('hides the adult pack until it is unlocked', () => {
    expect(listablePacks(false)).toHaveLength(9);
    expect(listablePacks(true)).toHaveLength(10);
    expect(listablePacks(false).some((p: Pack) => p.adult)).toBe(false);
  });

  it('deals only from packs that are both age-cleared and paid for', () => {
    const free = playablePacks({ adultUnlocked: false, purchased: false });
    expect(free.every((p: Pack) => p.isFree && !p.adult)).toBe(true);
    expect(free.length).toBeGreaterThan(0);
    expect(FREE_WORDS).toBe(free.reduce((n: number, p: Pack) => n + p.words.length, 0));

    // Paying does not open the 18+ pack; that is a separate switch.
    const paid = playablePacks({ adultUnlocked: false, purchased: true });
    expect(paid.some((p: Pack) => p.adult)).toBe(false);
    expect(paid.length).toBeGreaterThan(free.length);

    // ...and switching 18+ on does not hand over the paid packs either.
    const adultOnly = playablePacks({ adultUnlocked: true, purchased: false });
    expect(adultOnly.every((p: Pack) => p.isFree)).toBe(true);

    // Both gates open: everything.
    expect(playablePacks({ adultUnlocked: true, purchased: true })).toHaveLength(RINGER.length);
  });

  it('reports the same count in decoy mode, because every word is paired', () => {
    for (const pack of RINGER) {
      expect(usableWordCount(pack, 'decoy')).toBe(pack.words.length);
      expect(usableWordCount(pack, 'classic')).toBe(pack.words.length);
    }
  });

  it('the default pack selection actually resolves to playable words', () => {
    const candidates = candidateWords(RINGER, DEFAULT_CONFIG, []);
    expect(candidates.length).toBeGreaterThan(200);
    expect(candidates.every((c) => c.category.length > 0)).toBe(true);
  });

  it('every default pack exists', () => {
    for (const id of DEFAULT_CONFIG.packs) {
      expect(packById(id) !== undefined).toBe(true);
    }
  });

  it('gives the new games their own packs, free and decoy-free', () => {
    for (const game of ['charades', 'whoami'] as const) {
      const packs = packsForGame(game);
      expect(packs.length).toBeGreaterThan(0);
      for (const pack of packs) {
        // Every mode is playable without paying — the unlock adds RINGER words.
        expect(pack.isFree).toBe(true);
        expect(pack.adult ?? false).toBe(false);
        expect(pack.words.length).toBeGreaterThanOrEqual(40);
        for (const word of pack.words) {
          expect(word.decoy).toBe(undefined);
          expect([1, 2, 3].includes(word.difficulty ?? 0)).toBe(true);
          expect(word.text.length).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it('keeps the new packs out of the RINGER flow entirely', () => {
    // A charade in the deal would be unclueable and have no decoy to fall back
    // on, so the picker and the deal must never see one.
    const everything = playablePacks({ adultUnlocked: true, purchased: true });
    expect(everything.every((p: Pack) => (p.game ?? 'ringer') === 'ringer')).toBe(true);
    expect(listablePacks(true).every((p: Pack) => (p.game ?? 'ringer') === 'ringer')).toBe(true);

    // The store only ever hands the reducer playablePacks(), so even a config
    // naming a charades pack cannot reach one: the selection resolves to
    // nothing and falls back to the permitted RINGER packs.
    const dealt = candidateWords(everything, { ...DEFAULT_CONFIG, packs: ['charades'] }, []);
    expect(dealt.length).toBeGreaterThan(0);
    expect(dealt.some((c) => c.category === 'CHARADES')).toBe(false);
  });

  it('a full session of 60 rounds never repeats a word', () => {
    // recentWordIds holds 60, so the pool must comfortably exceed that.
    const pool = candidateWords(RINGER, { ...DEFAULT_CONFIG, packs: ['party'] }, []);
    expect(pool.length).toBeGreaterThan(60);
  });
});
