import { APP_LINK, APP_NAME } from '../config';
import { displayName } from '../engine/roster';
import type { Player } from '../engine/types';

/**
 * The share copy, kept pure and free of React Native imports so it can be
 * tested without a simulator — same rule the engine follows. share.ts is the
 * thin native wrapper around it.
 */

export interface ShareSummary {
  text: string;
  url: string;
}

export function buildShareText(players: Player[], roundsPlayed: number): ShareSummary {
  const ranked = players.slice().sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  const podium = ranked
    .slice(0, 3)
    .map((p, i) => `${i + 1}. ${displayName(p)} ${p.score}`)
    .join('   ');

  const roundWord = roundsPlayed === 1 ? 'round' : 'rounds';
  const headline = winner
    ? `${displayName(winner)} won ${APP_NAME} tonight.`
    : `${APP_NAME} night.`;

  const text = [
    headline,
    podium,
    `${roundsPlayed} ${roundWord}, ${players.length} players, one phone.`,
    '',
    `Get it and host next time: ${APP_LINK}`,
  ]
    .filter((line) => line.length > 0 || line === '')
    .join('\n');

  return { text, url: APP_LINK };
}
