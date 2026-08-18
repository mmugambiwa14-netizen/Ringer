import type { GameState, Outcome, Player, RoundState } from './types';

export interface Award {
  playerId: string;
  points: number;
  reason: string;
}

/**
 * Session scoring.
 *   Crew win                        +1 to every non-ringer
 *   ...and you voted for a ringer   +1 bonus (secret ballot only)
 *   Ringer survives the vote        +3
 *   Ringer caught but guesses word  +2
 *   Ringer caught, guess wrong       0
 */
export function awardsForRound(
  players: Player[],
  round: RoundState,
  outcome: Outcome,
  stolen: boolean,
): Award[] {
  const awards: Award[] = [];
  const isImposter = (id: string) => round.imposterIds.includes(id);

  if (outcome === 'crew') {
    for (const p of players) {
      if (isImposter(p.id)) continue;
      awards.push({ playerId: p.id, points: 1, reason: 'crew win' });
      const theirVote = round.votes[p.id];
      if (theirVote && isImposter(theirVote)) {
        awards.push({ playerId: p.id, points: 1, reason: 'voted correctly' });
      }
    }
    return awards;
  }

  const points = stolen ? 2 : 3;
  const reason = stolen ? 'stole the round' : 'survived the vote';
  for (const id of round.imposterIds) awards.push({ playerId: id, points, reason });
  return awards;
}

export function applyAwards(players: Player[], awards: Award[]): Player[] {
  const byId = new Map(players.map((p) => [p.id, { ...p }]));
  for (const a of awards) {
    const p = byId.get(a.playerId);
    if (p) p.score += a.points;
  }
  return players.map((p) => byId.get(p.id) ?? p);
}

export function isGameOver(state: GameState): boolean {
  if (!state.config.scoring) return false;
  return state.players.some((p) => p.score >= state.config.winTarget);
}

export function standings(players: Player[]): Player[] {
  return players.slice().sort((a, b) => b.score - a.score);
}
