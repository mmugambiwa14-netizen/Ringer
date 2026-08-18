import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import {
  READABLE_AT,
  isReadable,
  shutterOffset,
  shutterProgress,
  travelFor,
} from '../reveal';

describe('slide-up reveal', () => {
  const travel = travelFor(400); // 288px

  it('stays shut until the finger moves up', () => {
    expect(shutterProgress(0, travel)).toBe(0);
    expect(shutterProgress(50, travel)).toBe(0); // dragging down does nothing
    expect(shutterProgress(999, travel)).toBe(0);
  });

  it('tracks the finger one-to-one through the travel', () => {
    expect(shutterProgress(-travel / 2, travel)).toBe(0.5);
    expect(shutterProgress(-travel / 4, travel)).toBe(0.25);
  });

  it('clamps at fully open so overshooting cannot break the layout', () => {
    expect(shutterProgress(-travel, travel)).toBe(1);
    expect(shutterProgress(-travel * 4, travel)).toBe(1);
  });

  it('needs a real drag before the word counts as read', () => {
    expect(isReadable(0)).toBe(false);
    expect(isReadable(0.3)).toBe(false); // a peek is not a read
    expect(isReadable(READABLE_AT)).toBe(true);
    expect(isReadable(1)).toBe(true);
  });

  it('asks for most of the card height, so a flick cannot expose the word', () => {
    expect(travelFor(400)).toBe(288);
    expect(travelFor(0)).toBe(1); // never divide by zero before layout
  });

  it('draws the shutter up and off the card', () => {
    expect(shutterOffset(0, 400)).toBe(0);
    expect(shutterOffset(0.5, 400)).toBe(-200);
    expect(shutterOffset(1, 400)).toBe(-400);
  });
});
