import type { GameConfig, GameState, Pack, Player, RoundState, Word } from './types';
import { deriveSeed, makeRng, pick, shuffle } from './rng';

/** Auto scaling: keep ringers under a third of the table. */
export function resolveImposterCount(config: GameConfig, playerCount: number): number {
  const wanted =
    config.imposterCount === 'auto'
      ? playerCount <= 6
        ? 1
        : playerCount <= 11
          ? 2
          : 3
      : config.imposterCount;
  // Never let ringers reach half the table — the game stops working.
  const ceiling = Math.max(1, Math.ceil(playerCount / 2) - 1);
  return Math.min(wanted, ceiling);
}

interface Candidate {
  word: Word;
  category: string;
}

export function candidateWords(packs: Pack[], config: GameConfig, recent: string[]): Candidate[] {
  const selected = packs.filter((p) => config.packs.includes(p.id));
  const all: Candidate[] = [];
  for (const pack of selected) {
    for (const word of pack.words) {
      // Decoy mode can only use words that ship with a pair.
      if (config.mode === 'decoy' && !word.decoy) continue;
      all.push({ word, category: pack.name });
    }
  }
  const fresh = all.filter((c) => !recent.includes(c.word.id));
  return fresh.length > 0 ? fresh : all;
}

/**
 * Fair deal: sort by how often each player has already been the ringer, with a
 * shuffle first so ties break randomly. Purely random dealing reliably produces
 * "I've been the ringer three times in a row" and players conclude it's broken.
 */
export function chooseImposters(
  players: Player[],
  count: number,
  fairDeal: boolean,
  rng: () => number,
): string[] {
  const shuffled = shuffle(players, rng);
  const ordered = fairDeal
    ? shuffled.slice().sort((a, b) => a.ringerCount - b.ringerCount)
    : shuffled;
  return ordered.slice(0, count).map((p) => p.id);
}

export function dealRound(state: GameState, packs: Pack[], startedAt: number): RoundState {
  const roundSeed = deriveSeed(state.seed, state.roundNumber);
  const rng = makeRng(roundSeed);

  const candidates = candidateWords(packs, state.config, state.recentWordIds);
  if (candidates.length === 0) throw new Error('No words available for the selected packs');
  const chosen = pick(candidates, rng);

  const imposterCount = resolveImposterCount(state.config, state.players.length);
  const imposterIds = chooseImposters(state.players, imposterCount, state.config.fairDeal, rng);

  const startingPlayer = pick(state.players, makeRng(deriveSeed(roundSeed, 977)));

  return {
    startedAt,
    wordId: chosen.word.id,
    word: chosen.word.text,
    decoyWord: state.config.mode === 'decoy' ? (chosen.word.decoy ?? null) : null,
    // The decoy pair doubles as the classic-mode hint. It is already validated
    // to be close but not overlapping — no shared word, neither containing the
    // other, no near-identical spelling — which is exactly the bar a hint has
    // to clear to be useful without being a giveaway.
    hintWord:
      state.config.mode === 'classic' && state.config.imposterSeesHint
        ? (chosen.word.decoy ?? null)
        : null,
    category: chosen.category,
    imposterIds,
    revealIndex: 0,
    startingPlayerId: startingPlayer.id,
    clueLap: 0,
    clueTurnIndex: 0,
    votes: {},
    accusedId: null,
    tiedIds: [],
    revoteCount: 0,
    imposterGuess: null,
    guessWasCorrect: false,
    outcome: null,
  };
}
