/**
 * RINGER game engine — types.
 *
 * HARD RULE: nothing in src/engine may import from src/ui, src/store, or any
 * React Native module. The engine is pure TypeScript over a seeded RNG so the
 * entire rule set is verifiable in milliseconds without a simulator.
 */

export type Mode = 'classic' | 'decoy' | 'ghost';
export type VoteStyle = 'quick' | 'secret';
export type TieRule = 'runoff' | 'imposterWins' | 'revote';
export type Outcome = 'crew' | 'imposter';

export type Phase =
  | 'setup'
  | 'deal'
  | 'reveal'
  | 'startingPlayer'
  | 'clues'
  | 'discussion'
  | 'vote'
  | 'voteResult'
  | 'imposterGuess'
  | 'roundResult'
  | 'scoreboard'
  | 'gameOver';

export interface Player {
  id: string;
  /** Empty string is legal — the UI falls back to the roster name for the icon. */
  name: string;
  /** Index into ROSTER. Auto-assigned on join, stable for the session. */
  icon: number;
  score: number;
  /** How many times this player has been a ringer this session (fair deal). */
  ringerCount: number;
}

export interface GameConfig {
  mode: Mode;
  /** 'auto' scales with table size: 1 for 3–6, 2 for 7–11, 3 for 12+. */
  imposterCount: 'auto' | 1 | 2 | 3;
  impostersKnowEachOther: boolean;
  imposterSeesCategory: boolean;
  packs: string[];
  clueLaps: 1 | 2 | 3;
  /** Seconds. 0 = off. */
  turnTimer: 0 | 15 | 30 | 60;
  discussionTimer: 0 | 60 | 120 | 180;
  voteStyle: VoteStyle;
  tieRule: TieRule;
  imposterCanGuess: boolean;
  fairDeal: boolean;
  scoring: boolean;
  winTarget: number;
}

export interface Word {
  id: string;
  text: string;
  /** Decoy mode pair. Absent words are skipped when mode === 'decoy'. */
  decoy?: string;
  difficulty?: 1 | 2 | 3;
}

export interface Pack {
  id: string;
  name: string;
  emoji: string;
  isFree: boolean;
  adult?: boolean;
  words: Word[];
}

export interface RoundState {
  /**
   * Epoch ms when the round was dealt. Passed in with the action rather than
   * read from a clock, because the engine has no access to one — that is what
   * keeps a round reproducible from its seed.
   */
  startedAt: number;
  wordId: string;
  word: string;
  decoyWord: string | null;
  category: string;
  imposterIds: string[];
  /** Index into players — whose turn it is to look at the phone. */
  revealIndex: number;
  startingPlayerId: string;
  clueLap: number;
  clueTurnIndex: number;
  /** voterId -> accusedId. In quick-vote only the host's single tap is recorded. */
  votes: Record<string, string>;
  accusedId: string | null;
  tiedIds: string[];
  /**
   * How many times this round's vote has been re-run after a tie. Capped, so a
   * table that keeps splitting evenly can't deadlock the round forever.
   */
  revoteCount: number;
  imposterGuess: string | null;
  guessWasCorrect: boolean;
  outcome: Outcome | null;
}

export interface RoundSummary {
  roundNumber: number;
  word: string;
  imposterIds: string[];
  accusedId: string | null;
  outcome: Outcome;
  stolen: boolean;
}

export interface GameState {
  phase: Phase;
  seed: number;
  config: GameConfig;
  players: Player[];
  round: RoundState | null;
  roundNumber: number;
  history: RoundSummary[];
  /** Word ids used recently, so the same word doesn't repeat in one night. */
  recentWordIds: string[];
  /**
   * Monotonic id source for players. Lives in state rather than in a module
   * counter so that the same sequence of actions always produces the same
   * ids — which is what makes a game reproducible from its seed, and what
   * keeps ids stable across a persisted-and-reloaded session.
   */
  nextPlayerId: number;
}

export type Action =
  | { type: 'ADD_PLAYER'; name?: string }
  | { type: 'RENAME_PLAYER'; id: string; name: string }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'SET_CONFIG'; patch: Partial<GameConfig> }
  | { type: 'DEAL'; at: number }
  | { type: 'REVEAL_NEXT' }
  | { type: 'BEGIN_CLUES' }
  | { type: 'NEXT_TURN' }
  | { type: 'GO_TO_DISCUSSION' }
  | { type: 'GO_TO_VOTE' }
  | { type: 'CAST_VOTE'; voterId: string; accusedId: string }
  | { type: 'QUICK_VOTE'; accusedId: string }
  | { type: 'RESOLVE_VOTE' }
  | { type: 'SUBMIT_GUESS'; guess: string }
  | { type: 'SKIP_GUESS' }
  | { type: 'GO_TO_SCOREBOARD' }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_SESSION' };
