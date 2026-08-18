import type { Pack } from '../../engine/types';
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

/**
 * Generated from content/en/*.tsv by `npm run content`. Do not hand-edit the
 * JSON — edit the TSV and rebuild, so the validator gets a look at every
 * change. The validator enforces the mechanical half of the five criteria in
 * the build plan; the half a machine can't judge is what playtesting is for.
 */
export const PACKS: Pack[] = [
  party, food, animals, places, screen, sport, objects, jobs, tech, spicy,
] as Pack[];

export function packById(id: string): Pack | undefined {
  return PACKS.find((p) => p.id === id);
}

/** Packs a table can pick from. The 18+ pack stays hidden until switched on. */
export function visiblePacks(adultUnlocked: boolean): Pack[] {
  return PACKS.filter((p) => adultUnlocked || !p.adult);
}

/**
 * Decoy mode can only use words that ship with a pair, so the count shown on
 * a pack tile has to change with the mode or it's a lie.
 */
export function usableWordCount(pack: Pack, mode: string): number {
  return mode === 'decoy' ? pack.words.filter((w) => w.decoy).length : pack.words.length;
}

export const TOTAL_WORDS = PACKS.reduce((n, p) => n + p.words.length, 0);
