import type { Action, GameConfig, GameState, Pack, Player, RoundState } from './types';
import { dealRound } from './deal';
import { applyAwards, awardsForRound, isGameOver } from './scoring';
import { guessMatches } from './guess';
import { deriveSeed } from './rng';

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'classic',
  imposterCount: 'auto',
  impostersKnowEachOther: false,
  imposterSeesCategory: true,
  packs: ['party', 'food', 'animals'],
  clueLaps: 2,
  turnTimer: 30,
  discussionTimer: 120,
  voteStyle: 'quick',
  tieRule: 'runoff',
  imposterCanGuess: true,
  fairDeal: true,
  scoring: true,
  winTarget: 10,
};

const RECENT_MEMORY = 60;

/**
 * Salt for advancing the seed when a session ends. Round seeds are derived as
 * (seed, roundNumber), so a large constant can never collide with one.
 */
const NEXT_SESSION_SALT = 0x5e5510e;

/**
 * How many times a tied vote may be re-run before the tie simply stands.
 *
 * Both 'runoff' and 'revote' send a tie back to the vote screen, and that
 * screen has no way out — so a table that splits evenly twice in a row used to
 * loop forever. Worse, every transition is persisted, so force-quitting
 * restored them straight back into the deadlock. After this many attempts the
 * tie resolves the way the 'imposterWins' rule already does: nobody agreed,
 * so nobody is caught.
 */
const MAX_TIE_REVOTES = 2;

export function initialState(seed: number, config: Partial<GameConfig> = {}): GameState {
  return {
    phase: 'setup',
    seed: seed >>> 0,
    config: { ...DEFAULT_CONFIG, ...config },
    players: [],
    round: null,
    roundNumber: 0,
    history: [],
    recentWordIds: [],
    nextPlayerId: 1,
  };
}

export function makePlayer(id: string, name: string, icon: number): Player {
  return { id, name, icon, score: 0, ringerCount: 0 };
}

function turnsPerRound(state: GameState): number {
  return state.config.clueLaps * state.players.length;
}

/** Order of play starts at the dealt starting player and wraps. */
export function playerAtTurn(state: GameState, turn: number): Player {
  const round = state.round;
  if (!round) throw new Error('playerAtTurn called outside a round');
  const startIndex = state.players.findIndex((p) => p.id === round.startingPlayerId);
  const idx = (Math.max(startIndex, 0) + turn) % state.players.length;
  return state.players[idx] as Player;
}

function tallyVotes(round: RoundState): { accusedId: string | null; tiedIds: string[] } {
  const counts = new Map<string, number>();
  for (const accused of Object.values(round.votes)) {
    counts.set(accused, (counts.get(accused) ?? 0) + 1);
  }
  let best = -1;
  let tied: string[] = [];
  for (const [id, n] of counts) {
    if (n > best) {
      best = n;
      tied = [id];
    } else if (n === best) {
      tied.push(id);
    }
  }
  if (tied.length === 1) return { accusedId: tied[0] as string, tiedIds: [] };
  return { accusedId: null, tiedIds: tied };
}

function resolveOutcome(state: GameState, round: RoundState): GameState {
  const caught = round.accusedId !== null && round.imposterIds.includes(round.accusedId);

  // Caught, and allowed a steal attempt — pause here for the guess screen.
  if (caught && state.config.imposterCanGuess && state.config.mode !== 'ghost') {
    return { ...state, phase: 'imposterGuess', round };
  }
  return finishRound(state, { ...round, outcome: caught ? 'crew' : 'imposter' });
}

function finishRound(state: GameState, round: RoundState): GameState {
  const outcome = round.outcome ?? 'imposter';
  const stolen = round.guessWasCorrect;
  const awards = awardsForRound(state.players, round, outcome, stolen);
  const scored = applyAwards(state.players, awards);

  const next: GameState = {
    ...state,
    players: scored,
    round,
    phase: 'roundResult',
    history: [
      ...state.history,
      {
        roundNumber: state.roundNumber,
        word: round.word,
        imposterIds: round.imposterIds,
        accusedId: round.accusedId,
        outcome,
        stolen,
      },
    ],
  };
  return next;
}

export function reducer(state: GameState, action: Action, packs: Pack[] = []): GameState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      if (state.players.length >= 20) return state;
      const icon = state.players.length; // auto-assigned by seat, stable all session
      const player = makePlayer(`p${state.nextPlayerId}`, action.name ?? '', icon);
      return {
        ...state,
        players: [...state.players, player],
        nextPlayerId: state.nextPlayerId + 1,
      };
    }

    case 'RENAME_PLAYER':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, name: action.name.slice(0, 12) } : p,
        ),
      };

    case 'REMOVE_PLAYER': {
      if (state.players.length <= 3) return state;
      // Re-index icons so the roster stays contiguous after a removal.
      const players = state.players
        .filter((p) => p.id !== action.id)
        .map((p, i) => ({ ...p, icon: i }));
      return { ...state, players };
    }

    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.patch } };

    case 'DEAL': {
      if (state.players.length < 3) return state;
      const roundNumber = state.roundNumber + 1;
      const base: GameState = { ...state, roundNumber };
      const round = dealRound(base, packs, action.at);
      const players = state.players.map((p) =>
        round.imposterIds.includes(p.id) ? { ...p, ringerCount: p.ringerCount + 1 } : p,
      );
      return {
        ...base,
        players,
        round,
        phase: 'reveal',
        recentWordIds: [round.wordId, ...state.recentWordIds].slice(0, RECENT_MEMORY),
      };
    }

    case 'REVEAL_NEXT': {
      const round = state.round;
      if (!round) return state;
      const nextIndex = round.revealIndex + 1;
      if (nextIndex >= state.players.length) {
        return { ...state, phase: 'startingPlayer', round: { ...round, revealIndex: nextIndex } };
      }
      return { ...state, round: { ...round, revealIndex: nextIndex } };
    }

    case 'BEGIN_CLUES':
      if (!state.round) return state;
      return { ...state, phase: 'clues', round: { ...state.round, clueTurnIndex: 0, clueLap: 0 } };

    case 'NEXT_TURN': {
      const round = state.round;
      if (!round) return state;
      const next = round.clueTurnIndex + 1;
      if (next >= turnsPerRound(state)) {
        return { ...state, phase: 'discussion' };
      }
      return {
        ...state,
        round: {
          ...round,
          clueTurnIndex: next,
          clueLap: Math.floor(next / state.players.length),
        },
      };
    }

    case 'GO_TO_DISCUSSION':
      return { ...state, phase: 'discussion' };

    case 'GO_TO_VOTE':
      if (!state.round) return state;
      return {
        ...state,
        phase: 'vote',
        round: { ...state.round, votes: {}, tiedIds: [], revoteCount: 0 },
      };

    case 'CAST_VOTE': {
      const round = state.round;
      if (!round) return state;
      return {
        ...state,
        round: { ...round, votes: { ...round.votes, [action.voterId]: action.accusedId } },
      };
    }

    case 'QUICK_VOTE': {
      const round = state.round;
      if (!round) return state;
      return {
        ...state,
        phase: 'voteResult',
        round: { ...round, accusedId: action.accusedId, tiedIds: [] },
      };
    }

    case 'RESOLVE_VOTE': {
      const round = state.round;
      if (!round) return state;
      const { accusedId, tiedIds } = tallyVotes(round);

      if (accusedId === null) {
        // A tie. House rules decide, and the difference is real.
        if (state.config.tieRule === 'imposterWins' || round.revoteCount >= MAX_TIE_REVOTES) {
          return finishRound(state, { ...round, accusedId: null, tiedIds, outcome: 'imposter' });
        }
        // runoff / revote both send the table back to the vote screen,
        // narrowed to the tied players in the runoff case.
        return {
          ...state,
          phase: 'vote',
          round: { ...round, votes: {}, tiedIds, revoteCount: round.revoteCount + 1 },
        };
      }
      return { ...state, phase: 'voteResult', round: { ...round, accusedId, tiedIds: [] } };
    }

    case 'SUBMIT_GUESS': {
      const round = state.round;
      if (!round) return state;
      if (state.phase === 'voteResult') return resolveOutcome(state, round);
      // A round may only be settled once. The guess screen can fire this twice
      // — the keyboard's return key, then the button — and without this guard
      // the second one scores the round again and files it in history again.
      if (state.phase !== 'imposterGuess') return state;
      const correct = guessMatches(action.guess, round.word);
      return finishRound(state, {
        ...round,
        imposterGuess: action.guess,
        guessWasCorrect: correct,
        outcome: correct ? 'imposter' : 'crew',
      });
    }

    case 'SKIP_GUESS': {
      const round = state.round;
      if (!round) return state;
      if (state.phase !== 'imposterGuess') return state;
      return finishRound(state, { ...round, guessWasCorrect: false, outcome: 'crew' });
    }

    case 'GO_TO_SCOREBOARD': {
      if (!state.round) return state;
      // voteResult -> either the guess screen or straight to the result
      if (state.phase === 'voteResult') return resolveOutcome(state, state.round);
      return { ...state, phase: isGameOver(state) ? 'gameOver' : 'scoreboard' };
    }

    case 'NEXT_ROUND':
      return { ...state, phase: 'setup', round: null };

    case 'END_SESSION':
      return {
        // Advance the seed. Keeping it would replay the session just finished
        // word for word — same word, same ringer, same starting player — because
        // the round seed is derived from (seed, roundNumber) and roundNumber
        // restarts at 0. "Play again" is the most common thing a table does.
        ...initialState(deriveSeed(state.seed, NEXT_SESSION_SALT), state.config),
        players: state.players.map((p) => ({ ...p, score: 0, ringerCount: 0 })),
        nextPlayerId: state.nextPlayerId,
        // Same table, same night: a word used in the last session should still
        // feel used up.
        recentWordIds: state.recentWordIds,
      };

    default:
      return state;
  }
}
