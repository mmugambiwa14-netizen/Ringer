import { describe, it } from 'node:test';
import { expect } from './expect';
import {
  charadesScore,
  currentWord,
  isDeckSpent,
  markGot,
  markSkipped,
  playedWords,
  startCharades,
} from '../charades';
import { packsForGame } from '../../data/packs';

const DECK = packsForGame('charades').flatMap((p) => p.words);

describe('charades', () => {
  it('is reproducible from its seed, like every other deal in the engine', () => {
    const a = startCharades(DECK, 4242);
    const b = startCharades(DECK, 4242);
    expect(a.deck.map((w) => w.id)).toEqual(b.deck.map((w) => w.id));
    expect(startCharades(DECK, 99).deck[0]!.id !== a.deck[0]!.id).toBe(true);
  });

  it('never shows the same phrase twice in a round', () => {
    let s = startCharades(DECK, 7);
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      seen.push(currentWord(s)!.id);
      s = i % 3 === 0 ? markSkipped(s) : markGot(s);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('counts what was got and what was skipped', () => {
    let s = startCharades(DECK, 11);
    s = markGot(s);
    s = markGot(s);
    s = markSkipped(s);
    expect(charadesScore(s)).toEqual({ got: 2, skipped: 1 });
    expect(playedWords(s).map((p) => p.got)).toEqual([true, true, false]);
  });

  it('runs out rather than looping when a round outlasts the deck', () => {
    const tiny = DECK.slice(0, 2);
    let s = startCharades(tiny, 1);
    expect(isDeckSpent(s)).toBe(false);
    s = markGot(markGot(s));
    expect(isDeckSpent(s)).toBe(true);
    expect(currentWord(s)).toBeNull();
    // Tapping again on a spent deck must not invent a score.
    expect(charadesScore(markGot(s))).toEqual({ got: 2, skipped: 0 });
  });
});
