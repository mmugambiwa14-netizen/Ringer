import type { Phase } from '../engine/types';

/** Human wording for a saved phase, used by the resume prompt. */
export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'deal':
      return 'the deal';
    case 'reveal':
      return 'passing the phone round';
    case 'startingPlayer':
      return 'the first clue';
    case 'clues':
      return 'the clue round';
    case 'discussion':
      return 'the argument';
    case 'vote':
      return 'the vote';
    case 'voteResult':
      return 'the vote result';
    case 'imposterGuess':
      return "the ringer's guess";
    case 'roundResult':
      return 'the result';
    case 'scoreboard':
      return 'the scores';
    default:
      return 'setting up';
  }
}

/** Where to send the player when they choose to carry on. */
export function routeForPhase(phase: Phase): string {
  switch (phase) {
    case 'reveal':
      return '/game/reveal';
    case 'startingPlayer':
      return '/game/starting';
    case 'clues':
      return '/game/clues';
    case 'discussion':
      return '/game/discussion';
    case 'vote':
      return '/game/vote';
    case 'voteResult':
      return '/game/vote-result';
    case 'imposterGuess':
      return '/game/guess';
    case 'roundResult':
      return '/game/result';
    case 'scoreboard':
      return '/scoreboard';
    case 'gameOver':
      return '/podium';
    default:
      return '/';
  }
}
