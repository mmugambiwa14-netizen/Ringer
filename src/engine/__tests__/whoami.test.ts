import { describe, it } from 'node:test';
import { expect } from './expect';
import { currentTurn, isOver, markPassed, markSolved, results, startWhoAmI } from '../whoami';
import { packsForGame } from '../../data/packs';
import { withPlayers } from './helpers';

const DECK = packsForGame('whoami').flatMap((p) => p.words);
const table = (n: number) => withPlayers(n).players;

describe('who am i', () => {
  it('gives everyone exactly one identity, and no two the same', () => {
    const s = startWhoAmI(table(6), DECK, 4242);
    expect(s.turns).toHaveLength(6);
    expect(new Set(s.turns.map((t) => t.playerId)).size).toBe(6);
    expect(new Set(s.turns.map((t) => t.word.id)).size).toBe(6);
  });

  it('is reproducible from its seed', () => {
    const a = startWhoAmI(table(5), DECK, 77);
    const b = startWhoAmI(table(5), DECK, 77);
    expect(a.turns.map((t) => t.word.id)).toEqual(b.turns.map((t) => t.word.id));
  });

  it('walks one player at a time and then ends', () => {
    let s = startWhoAmI(table(3), DECK, 5);
    expect(isOver(s)).toBe(false);
    const order = [currentTurn(s)!.playerId];
    s = markSolved(s);
    order.push(currentTurn(s)!.playerId);
    s = markPassed(s);
    order.push(currentTurn(s)!.playerId);
    s = markSolved(s);

    expect(isOver(s)).toBe(true);
    expect(currentTurn(s)).toBeNull();
    expect(new Set(order).size).toBe(3);
    expect(results(s).map((r) => r.solved)).toEqual([true, false, true]);
  });

  it('deals no more turns than the deck can cover', () => {
    const s = startWhoAmI(table(6), DECK.slice(0, 2), 1);
    expect(s.turns).toHaveLength(2);
  });

  it('does nothing when there is no turn left to mark', () => {
    let s = startWhoAmI(table(2), DECK, 3);
    s = markSolved(markSolved(s));
    expect(markSolved(s)).toEqual(s);
    expect(results(s)).toHaveLength(2);
  });
});
