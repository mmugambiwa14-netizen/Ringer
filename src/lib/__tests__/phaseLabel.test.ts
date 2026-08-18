import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import { phaseLabel, routeForPhase } from '../phaseLabel';
import type { Phase } from '../../engine/types';

const ALL: Phase[] = [
  'setup', 'deal', 'reveal', 'startingPlayer', 'clues', 'discussion',
  'vote', 'voteResult', 'imposterGuess', 'roundResult', 'scoreboard', 'gameOver',
];

describe('resume routing', () => {
  it('has a label for every phase', () => {
    for (const phase of ALL) {
      expect(phaseLabel(phase).length).toBeGreaterThan(0);
    }
  });

  it('routes every in-flight phase to a real screen, never back to setup', () => {
    const inFlight = ALL.filter((p) => p !== 'setup' && p !== 'deal');
    for (const phase of inFlight) {
      expect(routeForPhase(phase).startsWith('/')).toBe(true);
      expect(routeForPhase(phase)).not.toBe('/');
    }
  });

  it('sends setup back to the home screen', () => {
    expect(routeForPhase('setup')).toBe('/');
  });

  it('sends a finished session to the podium, not the scoreboard', () => {
    // The podium owns the share moment; dropping a finished session on the
    // scoreboard would skip the only place the app asks for anything.
    expect(routeForPhase('gameOver')).toBe('/podium');
  });
});
