import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import { PACKS, TOTAL_WORDS, packById, usableWordCount, visiblePacks } from '../packs';
import { DEFAULT_CONFIG } from '../../engine/reducer';
import { candidateWords } from '../../engine/deal';

/**
 * The content contract. These run against the generated JSON, so they catch a
 * pack that was hand-edited or a build that wasn't re-run — the validator only
 * sees the TSV.
 */
describe('word packs', () => {
  it('ships ten packs with a healthy word count', () => {
    expect(PACKS).toHaveLength(10);
    expect(TOTAL_WORDS).toBeGreaterThan(700);
    for (const pack of PACKS) {
      expect(pack.words.length).toBeGreaterThanOrEqual(40);
    }
  });

  it('gives every word a decoy, so Decoy mode never runs dry', () => {
    for (const pack of PACKS) {
      for (const word of pack.words) {
        expect(typeof word.decoy).toBe('string');
        expect(word.decoy !== word.text).toBe(true);
      }
    }
  });

  it('keeps every word short enough to set at display size', () => {
    for (const pack of PACKS) {
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
    const texts = PACKS.flatMap((p) => p.words.map((w) => w.text));
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
    const free = PACKS.filter((p) => p.isFree).map((p) => p.id);
    expect(free).toEqual(['party', 'food', 'animals']);
    expect(PACKS.filter((p) => p.adult).map((p) => p.id)).toEqual(['spicy']);
  });

  it('hides the adult pack until it is unlocked', () => {
    expect(visiblePacks(false)).toHaveLength(9);
    expect(visiblePacks(true)).toHaveLength(10);
    expect(visiblePacks(false).some((p) => p.adult)).toBe(false);
  });

  it('reports the same count in decoy mode, because every word is paired', () => {
    for (const pack of PACKS) {
      expect(usableWordCount(pack, 'decoy')).toBe(pack.words.length);
      expect(usableWordCount(pack, 'classic')).toBe(pack.words.length);
    }
  });

  it('the default pack selection actually resolves to playable words', () => {
    const candidates = candidateWords(PACKS, DEFAULT_CONFIG, []);
    expect(candidates.length).toBeGreaterThan(200);
    expect(candidates.every((c) => c.category.length > 0)).toBe(true);
  });

  it('every default pack exists', () => {
    for (const id of DEFAULT_CONFIG.packs) {
      expect(packById(id) !== undefined).toBe(true);
    }
  });

  it('a full session of 60 rounds never repeats a word', () => {
    // recentWordIds holds 60, so the pool must comfortably exceed that.
    const pool = candidateWords(PACKS, { ...DEFAULT_CONFIG, packs: ['party'] }, []);
    expect(pool.length).toBeGreaterThan(60);
  });
});
