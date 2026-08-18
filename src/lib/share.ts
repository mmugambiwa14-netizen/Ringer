import { Share } from 'react-native';
import { APP_NAME } from '../config';
import { buildShareText } from './shareText';
import type { Player } from '../engine/types';

/**
 * The share loop.
 *
 * Six people play on one phone; five of them don't have the app. That is free,
 * already-converted demand sitting at the table, and capturing it beats any
 * amount of content marketing. The moment to ask is when the session ENDS —
 * never mid-round, where it would interrupt the actual game.
 *
 * Uses the OS share sheet rather than a QR code on purpose: it lands the link
 * in WhatsApp or Messages, which is where the table already is, and it needs
 * no dependency. A scannable QR would be a nice addition on the podium, but it
 * needs a QR encoder — see README.
 */
export async function shareSession(players: Player[], roundsPlayed: number): Promise<boolean> {
  const { text, url } = buildShareText(players, roundsPlayed);
  try {
    const result = await Share.share(
      // iOS reads message and url separately; Android only reads message, so
      // the link has to be inside the text too or half the shares go out bare.
      { message: text, url, title: APP_NAME },
      { dialogTitle: 'Send this to the table' },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export { buildShareText };
