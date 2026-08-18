/**
 * Auto-assigned player identities. Shape carries the identity, colour only
 * reinforces it — so a player is recognisable across the table, in a
 * screenshot, and to someone who can't distinguish the colours.
 *
 * Exactly 20 entries, matching the 20-player ceiling.
 */
export interface Identity {
  shape: string;
  color: string;
  /** Used as the player's name when they haven't typed one. */
  name: string;
}

export const ROSTER: readonly Identity[] = [
  { shape: 'circle', color: '#1F4BFF', name: 'CIRCLE' },
  { shape: 'triangle', color: '#FF3D9A', name: 'TRIANGLE' },
  { shape: 'square', color: '#FFC700', name: 'SQUARE' },
  { shape: 'diamond', color: '#00B865', name: 'DIAMOND' },
  { shape: 'star', color: '#7B4BFF', name: 'STAR' },
  { shape: 'cross', color: '#FF6B1F', name: 'CROSS' },
  { shape: 'ring', color: '#00B7C4', name: 'RING' },
  { shape: 'half', color: '#B8005E', name: 'HALF' },
  { shape: 'chevron', color: '#5B8C00', name: 'CHEVRON' },
  { shape: 'hex', color: '#8C4A00', name: 'HEX' },
  { shape: 'bolt', color: '#FFC700', name: 'BOLT' },
  { shape: 'drop', color: '#00B7C4', name: 'DROP' },
  { shape: 'arrow', color: '#FF3D9A', name: 'ARROW' },
  { shape: 'moon', color: '#7B4BFF', name: 'MOON' },
  { shape: 'plus', color: '#00B865', name: 'PLUS' },
  { shape: 'flag', color: '#FF6B1F', name: 'FLAG' },
  { shape: 'eye', color: '#1F4BFF', name: 'EYE' },
  { shape: 'wave', color: '#00B7C4', name: 'WAVE' },
  { shape: 'grid', color: '#B8005E', name: 'GRID' },
  { shape: 'key', color: '#5B8C00', name: 'KEY' },
];

export function identityFor(iconIndex: number): Identity {
  return ROSTER[iconIndex % ROSTER.length] as Identity;
}

/** The name to show. Empty name falls back to the icon's name. */
export function displayName(player: { name: string; icon: number }): string {
  const trimmed = player.name.trim();
  return trimmed.length > 0 ? trimmed : identityFor(player.icon).name;
}
