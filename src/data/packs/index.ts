import type { GameId, Pack } from '../../engine/types';
import party from './en/party.json';
import food from './en/food.json';
import animals from './en/animals.json';
import places from './en/places.json';
import screen from './en/screen.json';
import sport from './en/sport.json';
import objects from './en/objects.json';
import jobs from './en/jobs.json';
import tech from './en/tech.json';
import spicy from './en/spicy.json';
import charades from './en/charades.json';
import whoami from './en/whoami.json';

/**
 * Generated from content/en/*.tsv by `npm run content`. Do not hand-edit the
 * JSON — edit the TSV and rebuild, so the validator gets a look at every
 * change. The validator enforces the mechanical half of the five criteria in
 * the build plan; the half a machine can't judge is what playtesting is for.
 */
export const PACKS: Pack[] = [
  party,
  food,
  animals,
  places,
  screen,
  sport,
  objects,
  jobs,
  tech,
  spicy,
  charades,
  whoami,
] as Pack[];

/** Packs belonging to one game. RINGER is the default for packs without a game. */
export function packsForGame(game: GameId): Pack[] {
  return PACKS.filter((p) => (p.game ?? 'ringer') === game);
}

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}

/**
 * Age and payment are separate gates and behave differently on purpose.
 *
 * An adult pack that is switched off is *hidden* — the point of that gate is
 * what happens when the phone is handed to someone else, so it must not even
 * be advertised. A paid pack that has not been bought is *shown but locked* —
 * the point of that gate is to sell it.
 */

/** What the picker lists. Adult packs stay hidden until switched on. */
export function listablePacks(adultUnlocked: boolean): Pack[] {
  return packsForGame('ringer').filter((p) => adultUnlocked || !p.adult);
}

/** Whether a pack's words may actually be dealt. */
export function isPlayable(pack: Pack, opts: { adultUnlocked: boolean; purchased: boolean }): boolean {
  if (pack.adult && !opts.adultUnlocked) return false;
  return pack.isFree || opts.purchased;
}

/**
 * What the deal is allowed to draw from. Applying the gates here rather than in
 * the picker is deliberate: a selection made while a pack was available has to
 * stop working the moment it isn't, and the picker is not where that is
 * noticed.
 */
export function playablePacks(opts: { adultUnlocked: boolean; purchased: boolean }): Pack[] {
  return playablePacksForGame('ringer', opts);
}

/**
 * The same two gates, for any game. Charades and Who Am I ship free packs today,
 * so this changes nothing yet — but a paid pack added to either would otherwise
 * be dealt to everyone, which is the RINGER 18+ bug over again: a gate applied
 * where the packs are listed instead of where the words are chosen.
 */
export function playablePacksForGame(
  game: GameId,
  opts: { adultUnlocked: boolean; purchased: boolean },
): Pack[] {
  return packsForGame(game).filter((p) => isPlayable(p, opts));
}

/** Free-tier size, for the paywall copy. Derived so it can never go stale. */
export const FREE_WORDS = packsForGame('ringer')
  .filter((p) => p.isFree)
  .reduce((n, p) => n + p.words.length, 0);

/**
 * Decoy mode can only use words that ship with a pair, so the count shown on
 * a pack tile has to change with the mode or it's a lie.
 */
export function usableWordCount(pack: Pack, mode: string): number {
  return mode === 'decoy' ? pack.words.filter((w) => w.decoy).length : pack.words.length;
}

export const TOTAL_WORDS = packsForGame('ringer').reduce((n, p) => n + p.words.length, 0);
