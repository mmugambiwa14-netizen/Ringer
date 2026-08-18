import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import { buildShareText } from '../shareText';
import { APP_LINK } from '../../config';
import type { Player } from '../../engine/types';

const make = (name: string, icon: number, score: number): Player => ({
  id: name || `p${icon}`,
  name,
  icon,
  score,
  ringerCount: 0,
});

describe('share text', () => {
  const table = [make('MAYA', 0, 11), make('JAY', 1, 8), make('SAM', 2, 6), make('NIA', 3, 2)];

  it('leads with the winner', () => {
    const { text } = buildShareText(table, 7);
    expect(text.startsWith('MAYA won RINGER tonight.')).toBe(true);
  });

  it('shows a podium, not the whole table', () => {
    const { text } = buildShareText(table, 7);
    expect(text.includes('1. MAYA 11')).toBe(true);
    expect(text.includes('3. SAM 6')).toBe(true);
    expect(text.includes('NIA')).toBe(false); // fourth place is not a brag
  });

  it('always carries the link in the message body', () => {
    // Android's share sheet ignores the url field, so the link has to be in
    // the text or half the shares go out pointing at nothing.
    const { text, url } = buildShareText(table, 7);
    expect(text.includes(APP_LINK)).toBe(true);
    expect(url).toBe(APP_LINK);
  });

  it('uses the icon name for players who never typed one', () => {
    const anon = [make('', 1, 5), make('', 0, 3)];
    const { text } = buildShareText(anon, 2);
    expect(text.startsWith('TRIANGLE won')).toBe(true);
    expect(text.includes('2. CIRCLE 3')).toBe(true);
  });

  it('gets the round plural right', () => {
    expect(buildShareText(table, 1).text.includes('1 round,')).toBe(true);
    expect(buildShareText(table, 5).text.includes('5 rounds,')).toBe(true);
  });

  it('survives an empty table without throwing', () => {
    const { text } = buildShareText([], 0);
    expect(text.includes('RINGER night.')).toBe(true);
    expect(text.includes(APP_LINK)).toBe(true);
  });

  it('reports the real player count, not the podium size', () => {
    expect(buildShareText(table, 7).text.includes('4 players')).toBe(true);
  });
});
