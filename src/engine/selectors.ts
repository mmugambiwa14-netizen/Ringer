import type { GameState, Player } from './types';
import { displayName } from './roster';
import { playerAtTurn } from './reducer';

export function currentRevealPlayer(state: GameState): Player | null {
  const round = state.round;
  if (!round) return null;
  return state.players[round.revealIndex] ?? null;
}

export function isImposter(state: GameState, playerId: string): boolean {
  return state.round?.imposterIds.includes(playerId) ?? false;
}

/** What this specific player should see when they lift the shutter. */
export interface RevealFace {
  kind: 'word' | 'ringer';
  headline: string;
  word: string | null;
  category: string | null;
  /** A word near the secret one, shown to the ringer to bluff from. Never the answer. */
  hintWord: string | null;
  hint: string | null;
}

export function revealFor(state: GameState, player: Player): RevealFace {
  const round = state.round;
  if (!round) throw new Error('revealFor called outside a round');
  const imposter = round.imposterIds.includes(player.id);
  const { mode, imposterSeesCategory, impostersKnowEachOther } = state.config;

  if (mode === 'decoy') {
    // Nobody is told they're the ringer — that's the whole mode.
    return {
      kind: 'word',
      headline: 'THE SECRET WORD',
      word: imposter ? (round.decoyWord ?? round.word) : round.word,
      category: round.category,
      hintWord: null,
      hint: 'One of you has a different word. It might be you.',
    };
  }

  if (!imposter) {
    return {
      kind: 'word',
      headline: 'THE SECRET WORD',
      word: round.word,
      category: round.category,
      hintWord: null,
      hint: null,
    };
  }

  const others =
    impostersKnowEachOther && round.imposterIds.length > 1
      ? state.players
          .filter((p) => p.id !== player.id && round.imposterIds.includes(p.id))
          .map(displayName)
          .join(' · ')
      : null;

  return {
    kind: 'ringer',
    headline: "YOU'RE THE",
    word: 'RINGER',
    category: mode === 'ghost' || !imposterSeesCategory ? null : round.category,
    hintWord: round.hintWord,
    hint:
      mode === 'ghost'
        ? 'No word. No category. Blend in.'
        : others
          ? `With you: ${others}`
          : round.hintWord
            ? 'Near it. Not it. Bluff from there.'
            : "Work out the word. Don't get caught.",
  };
}

export function clueTurnInfo(state: GameState) {
  const round = state.round;
  if (!round) return null;
  const total = state.config.clueLaps * state.players.length;
  return {
    player: playerAtTurn(state, round.clueTurnIndex),
    turn: round.clueTurnIndex + 1,
    total,
    lap: round.clueLap + 1,
    laps: state.config.clueLaps,
  };
}

export function voteCounts(state: GameState): Map<string, number> {
  const counts = new Map<string, number>();
  const round = state.round;
  if (!round) return counts;
  for (const accused of Object.values(round.votes)) {
    counts.set(accused, (counts.get(accused) ?? 0) + 1);
  }
  return counts;
}
