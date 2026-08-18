import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import { displayFontSize } from '../fitText';
import { packsForGame } from '../../data/packs';

describe('display font sizing', () => {
  it('keeps short words at full size', () => {
    expect(displayFontSize('KING')).toBe(52);
    expect(displayFontSize('DOCTOR')).toBe(52);
  });

  it('shrinks a long single word instead of letting it break mid-word', () => {
    // The bug this exists for: ACCOUNTANT rendered as "ACCOUNTA / NT".
    expect(displayFontSize('ACCOUNTANT')).toBeLessThan(52);
    expect(displayFontSize('PHOTOGRAPHER')).toBeLessThan(displayFontSize('ACCOUNTANT'));
  });

  it('sizes on the longest token, because that is what cannot wrap', () => {
    // Same character count, but one has a token that must fit on one line.
    expect(displayFontSize('POLICE OFFICER')).toBeGreaterThan(
      displayFontSize('ELECTRICIANS!'.replace('!', '')),
    );
  });

  it('never goes below the floor or above the ceiling', () => {
    expect(displayFontSize('A'.repeat(40))).toBeGreaterThanOrEqual(22);
    expect(displayFontSize('')).toBe(52);
    expect(displayFontSize('HI')).toBeLessThanOrEqual(52);
  });

  it('gives every shipped charade and identity a workable size', () => {
    for (const game of ['charades', 'whoami'] as const) {
      for (const pack of packsForGame(game)) {
        for (const word of pack.words) {
          const size = displayFontSize(word.text);
          expect(size).toBeGreaterThanOrEqual(22);
          expect(size).toBeLessThanOrEqual(52);
        }
      }
    }
  });
});
