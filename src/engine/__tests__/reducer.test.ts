import { describe, it } from 'node:test';
import { expect } from './expect';
import { initialState, reducer } from '../reducer';
import { revealFor } from '../selectors';
import { displayName } from '../roster';
import { deal, playClues, revealAll, withPlayers } from './helpers';

describe('setup', () => {
  it('auto-assigns a distinct icon per seat', () => {
    const s = withPlayers(6);
    expect(s.players.map((p) => p.icon)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('falls back to the icon name when a player is left unnamed', () => {
    let s = initialState(1);
    s = reducer(s, { type: 'ADD_PLAYER' });
    s = reducer(s, { type: 'ADD_PLAYER', name: '  ' });
    expect(displayName(s.players[0]!)).toBe('CIRCLE');
    expect(displayName(s.players[1]!)).toBe('TRIANGLE');
  });

  it('refuses to go below three players and caps at twenty', () => {
    let s = withPlayers(3);
    s = reducer(s, { type: 'REMOVE_PLAYER', id: s.players[0]!.id });
    expect(s.players).toHaveLength(3);

    let big = withPlayers(20);
    big = reducer(big, { type: 'ADD_PLAYER' });
    expect(big.players).toHaveLength(20);
  });

  it('re-indexes icons after a removal so the roster stays contiguous', () => {
    let s = withPlayers(5);
    s = reducer(s, { type: 'REMOVE_PLAYER', id: s.players[1]!.id });
    expect(s.players.map((p) => p.icon)).toEqual([0, 1, 2, 3]);
  });

  it('will not deal with fewer than three players', () => {
    const s = deal(withPlayers(2));
    expect(s.phase).toBe('setup');
    expect(s.round).toBeNull();
  });
});

describe('dealing and reveal', () => {
  it('is fully reproducible from the seed', () => {
    const a = deal(withPlayers(6, 777));
    const b = deal(withPlayers(6, 777));
    expect(a.round!.word).toBe(b.round!.word);
    expect(a.round!.imposterIds).toEqual(b.round!.imposterIds);
    expect(a.round!.startingPlayerId).toBe(b.round!.startingPlayerId);
  });

  it('shows exactly one player the ringer card in classic mode', () => {
    const s = deal(withPlayers(5));
    const faces = s.players.map((p) => revealFor(s, p));
    expect(faces.filter((f) => f.kind === 'ringer')).toHaveLength(1);
    expect(faces.filter((f) => f.word === s.round!.word)).toHaveLength(4);
  });

  it('tells nobody they are the ringer in decoy mode', () => {
    let s = withPlayers(5);
    s = reducer(s, { type: 'SET_CONFIG', patch: { mode: 'decoy' } });
    s = deal(s);
    const faces = s.players.map((p) => revealFor(s, p));
    expect(faces.every((f) => f.kind === 'word')).toBe(true);
    const words = new Set(faces.map((f) => f.word));
    expect(words.size).toBe(2); // the real word and its decoy
  });

  it('gives the classic ringer a hint word, and nobody else', () => {
    const s = deal(withPlayers(5, 31));
    const faces = s.players.map((p) => ({ p, face: revealFor(s, p) }));
    const ringer = faces.find(({ face }) => face.kind === 'ringer')!;
    const crew = faces.filter(({ face }) => face.kind !== 'ringer');

    expect(ringer.face.hintWord).toBe(s.round!.hintWord);
    expect(typeof ringer.face.hintWord).toBe('string');
    expect(crew.every(({ face }) => face.hintWord === null)).toBe(true);
  });

  it('never hands the ringer the answer as a hint', () => {
    // "Close but not obvious" is a content guarantee, not a hope: the decoy
    // pairs are validated so neither word contains the other and they share no
    // word. Sweep a spread of seeds and hold the deal to that.
    const stop = new Set(['THE', 'A', 'OF', 'AND']);
    let checked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = deal(withPlayers(5, seed));
      const hint = s.round!.hintWord;
      if (hint === null) continue; // a word that ships without a pair
      checked++;
      const word = s.round!.word;
      expect(hint).not.toBe(word);
      expect(word.includes(hint)).toBe(false);
      expect(hint.includes(word)).toBe(false);
      const shared = hint
        .split(' ')
        .filter((w) => !stop.has(w))
        .some((w) => word.split(' ').includes(w));
      expect(shared).toBe(false);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('withholds the hint in ghost and decoy modes, and when switched off', () => {
    for (const patch of [
      { mode: 'ghost' as const },
      { mode: 'decoy' as const },
      { imposterSeesHint: false },
    ]) {
      const s = deal(reducer(withPlayers(5, 31), { type: 'SET_CONFIG', patch }));
      expect(s.round!.hintWord).toBeNull();
      const ringer = s.players.find((p) => s.round!.imposterIds.includes(p.id))!;
      expect(revealFor(s, ringer).hintWord).toBeNull();
    }
  });

  it('withholds the category in ghost mode', () => {
    let s = withPlayers(5);
    s = reducer(s, { type: 'SET_CONFIG', patch: { mode: 'ghost' } });
    s = deal(s);
    const ringer = s.players.find((p) => s.round!.imposterIds.includes(p.id))!;
    expect(revealFor(s, ringer).category).toBeNull();
  });

  it('advances to the starting player only after everyone has looked', () => {
    let s = deal(withPlayers(5));
    for (let i = 0; i < 4; i++) {
      s = reducer(s, { type: 'REVEAL_NEXT' });
      expect(s.phase).toBe('reveal');
    }
    s = reducer(s, { type: 'REVEAL_NEXT' });
    expect(s.phase).toBe('startingPlayer');
  });
});

describe('clue phase', () => {
  it('runs laps x players turns, then moves to discussion', () => {
    let s = revealAll(deal(withPlayers(5)));
    s = reducer(s, { type: 'BEGIN_CLUES' });
    const total = s.config.clueLaps * s.players.length;
    for (let i = 0; i < total - 1; i++) {
      s = reducer(s, { type: 'NEXT_TURN' });
      expect(s.phase).toBe('clues');
    }
    s = reducer(s, { type: 'NEXT_TURN' });
    expect(s.phase).toBe('discussion');
  });

  it('gives every player the same number of turns', () => {
    let s = revealAll(deal(withPlayers(5)));
    s = reducer(s, { type: 'BEGIN_CLUES' });
    const seen = new Map<string, number>();
    const total = s.config.clueLaps * s.players.length;
    for (let i = 0; i < total; i++) {
      const idx = s.players.findIndex((p) => p.id === s.round!.startingPlayerId);
      const who = s.players[(idx + s.round!.clueTurnIndex) % s.players.length]!;
      seen.set(who.id, (seen.get(who.id) ?? 0) + 1);
      s = reducer(s, { type: 'NEXT_TURN' });
    }
    expect([...seen.values()]).toEqual([2, 2, 2, 2, 2]);
  });
});

describe('voting and resolution', () => {
  const toVote = (players = 5) => {
    let s = playClues(revealAll(deal(withPlayers(players))));
    return reducer(s, { type: 'GO_TO_VOTE' });
  };

  it('quick vote accuses whoever the host taps', () => {
    let s = toVote();
    const target = s.players[2]!;
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: target.id });
    expect(s.phase).toBe('voteResult');
    expect(s.round!.accusedId).toBe(target.id);
  });

  it('secret ballot accuses the player with the most votes', () => {
    let s = toVote();
    const [a, b, c, d, e] = s.players;
    s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: c!.id, accusedId: d!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: d!.id, accusedId: e!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: e!.id, accusedId: c!.id });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.phase).toBe('voteResult');
    expect(s.round!.accusedId).toBe(c!.id);
  });

  it('sends a tie back to a runoff between the tied players', () => {
    let s = toVote(4);
    const [a, b, c, d] = s.players;
    s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: c!.id, accusedId: d!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: d!.id, accusedId: c!.id });
    // 3-1, no tie
    expect(reducer(s, { type: 'RESOLVE_VOTE' }).phase).toBe('voteResult');
  });

  it('honours the imposterWins tie rule', () => {
    let s = toVote(4);
    s = reducer(s, { type: 'SET_CONFIG', patch: { tieRule: 'imposterWins' } });
    const [a, b, c, d] = s.players;
    s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: d!.id });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.phase).toBe('roundResult');
    expect(s.round!.outcome).toBe('imposter');
  });

  it('lets a deadlocked table finish the round instead of looping forever', () => {
    // Four players splitting 2-2 every time. Both re-vote tie rules send the
    // table back to a vote screen that has no way out, and the state is
    // persisted, so a force-quit used to restore the same deadlock.
    for (const tieRule of ['runoff', 'revote'] as const) {
      let s = reducer(toVote(4), { type: 'SET_CONFIG', patch: { tieRule } });
      const [a, b, c, d] = s.players;

      const deadlock = () => {
        s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
        s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: c!.id });
        s = reducer(s, { type: 'CAST_VOTE', voterId: c!.id, accusedId: d!.id });
        s = reducer(s, { type: 'CAST_VOTE', voterId: d!.id, accusedId: d!.id });
        s = reducer(s, { type: 'RESOLVE_VOTE' });
      };

      deadlock();
      expect(s.phase).toBe('vote');
      deadlock();
      expect(s.phase).toBe('vote');

      // Third deadlock: the tie stands and nobody is caught.
      deadlock();
      expect(s.phase).toBe('roundResult');
      expect(s.round!.outcome).toBe('imposter');
      expect(s.round!.accusedId).toBeNull();
    }
  });

  it('starts each round with a clean re-vote count', () => {
    let s = toVote(4);
    const [a, b, c, d] = s.players;
    s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: d!.id });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.round!.revoteCount).toBe(1);
    // Coming back through the discussion screen is a fresh vote.
    expect(reducer(s, { type: 'GO_TO_VOTE' }).round!.revoteCount).toBe(0);
  });

  it('a tie under runoff returns to the vote with the tied players recorded', () => {
    let s = toVote(4);
    const [a, b, c, d] = s.players;
    s = reducer(s, { type: 'CAST_VOTE', voterId: a!.id, accusedId: c!.id });
    s = reducer(s, { type: 'CAST_VOTE', voterId: b!.id, accusedId: d!.id });
    s = reducer(s, { type: 'RESOLVE_VOTE' });
    expect(s.phase).toBe('vote');
    expect(s.round!.tiedIds.sort()).toEqual([c!.id, d!.id].sort());
    expect(s.round!.votes).toEqual({});
  });
});

describe('the four endings', () => {
  const upToVote = (seed = 4242) => playClues(revealAll(deal(withPlayers(5, seed))));

  it('accusing an innocent hands the round to the ringer', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    const innocent = s.players.find((p) => !s.round!.imposterIds.includes(p.id))!;
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: innocent.id });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.phase).toBe('roundResult');
    expect(s.round!.outcome).toBe('imposter');
    const ringer = s.players.find((p) => s.round!.imposterIds.includes(p.id))!;
    expect(ringer.score).toBe(3);
  });

  it('catching the ringer opens the steal attempt', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: s.round!.imposterIds[0]! });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.phase).toBe('imposterGuess');
  });

  it('a wrong steal is a crew win', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: s.round!.imposterIds[0]! });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    s = reducer(s, { type: 'SUBMIT_GUESS', guess: 'DEFINITELY NOT IT' });
    expect(s.round!.outcome).toBe('crew');
    expect(s.round!.guessWasCorrect).toBe(false);
    const crew = s.players.filter((p) => !s.round!.imposterIds.includes(p.id));
    expect(crew.every((p) => p.score >= 1)).toBe(true);
  });

  it('a correct steal flips the round back to the ringer', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: s.round!.imposterIds[0]! });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    const word = s.round!.word;
    s = reducer(s, { type: 'SUBMIT_GUESS', guess: word.toLowerCase() });
    expect(s.round!.outcome).toBe('imposter');
    expect(s.round!.guessWasCorrect).toBe(true);
    const ringer = s.players.find((p) => s.round!.imposterIds.includes(p.id))!;
    expect(ringer.score).toBe(2);
  });

  it('skipping the steal is a crew win', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: s.round!.imposterIds[0]! });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    s = reducer(s, { type: 'SKIP_GUESS' });
    expect(s.round!.outcome).toBe('crew');
  });

  it('ghost mode skips the steal entirely', () => {
    let s = withPlayers(5, 31);
    s = reducer(s, { type: 'SET_CONFIG', patch: { mode: 'ghost' } });
    s = reducer(playClues(revealAll(deal(s))), { type: 'GO_TO_VOTE' });
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: s.round!.imposterIds[0]! });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.phase).toBe('roundResult');
    expect(s.round!.outcome).toBe('crew');
  });

  it('settles a round exactly once, however many times the guess is sent', () => {
    // The guess screen can fire SUBMIT_GUESS twice — the keyboard's return key
    // settles the round without navigating away, leaving the button there to
    // press again. That used to score the round a second time.
    let s = upToVote();
    const ringer = s.round!.imposterIds[0]!;
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: ringer });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.phase).toBe('imposterGuess');

    const word = s.round!.word;
    s = reducer(s, { type: 'SUBMIT_GUESS', guess: word });
    const scoreAfterOne = s.players.find((p) => p.id === ringer)!.score;
    expect(s.history).toHaveLength(1);
    expect(scoreAfterOne).toBe(2);

    // Every further attempt to settle it is a no-op.
    s = reducer(s, { type: 'SUBMIT_GUESS', guess: word });
    s = reducer(s, { type: 'SKIP_GUESS' });
    expect(s.history).toHaveLength(1);
    expect(s.players.find((p) => p.id === ringer)!.score).toBe(scoreAfterOne);
  });

  it('records every round in history', () => {
    let s = reducer(upToVote(), { type: 'GO_TO_VOTE' });
    const innocent = s.players.find((p) => !s.round!.imposterIds.includes(p.id))!;
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: innocent.id });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.history).toHaveLength(1);
    expect(s.history[0]!.outcome).toBe('imposter');
  });
});

describe('session', () => {
  it('ends the session when someone hits the win target', () => {
    let s = withPlayers(5, 5150);
    s = reducer(s, { type: 'SET_CONFIG', patch: { winTarget: 3 } });
    s = reducer(playClues(revealAll(deal(s))), { type: 'GO_TO_VOTE' });
    const innocent = s.players.find((p) => !s.round!.imposterIds.includes(p.id))!;
    s = reducer(s, { type: 'QUICK_VOTE', accusedId: innocent.id });
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' }); // ringer takes 3
    s = reducer(s, { type: 'GO_TO_SCOREBOARD' });
    expect(s.phase).toBe('gameOver');
  });

  it('END_SESSION keeps the table but clears the scores', () => {
    let s = deal(withPlayers(5));
    s = reducer(s, { type: 'END_SESSION' });
    expect(s.players).toHaveLength(5);
    expect(s.players.every((p) => p.score === 0 && p.ringerCount === 0)).toBe(true);
    expect(s.round).toBeNull();
    expect(s.phase).toBe('setup');
  });

  it('does not replay the same session after END_SESSION', () => {
    // The round seed is derived from (seed, roundNumber) and roundNumber
    // restarts at 0, so holding the seed would deal the identical word, ringer
    // and starting player to a table that just tapped "play again".
    const first = deal(withPlayers(5, 4242));
    const second = deal(reducer(first, { type: 'END_SESSION' }));

    expect(second.seed).not.toBe(first.seed);
    expect([
      second.round!.word,
      second.round!.imposterIds,
      second.round!.startingPlayerId,
    ]).not.toEqual([first.round!.word, first.round!.imposterIds, first.round!.startingPlayerId]);
  });

  it('keeps the recently-used words across a session boundary', () => {
    // Same table, same night — a word from the last session is still stale.
    const first = deal(withPlayers(5, 4242));
    const next = reducer(first, { type: 'END_SESSION' });
    expect(next.recentWordIds).toEqual(first.recentWordIds);
    expect(next.recentWordIds.length).toBeGreaterThan(0);
  });

  it('keeps advancing the seed over repeated sessions', () => {
    let s = deal(withPlayers(5, 4242));
    const seen = new Set<number>([s.seed]);
    for (let i = 0; i < 5; i++) {
      s = deal(reducer(s, { type: 'END_SESSION' }));
      seen.add(s.seed);
    }
    expect(seen.size).toBe(6);
  });
});

describe('round timing', () => {
  it('stamps the deal time from the action, never from a clock', () => {
    const s = deal(withPlayers(5));
    expect(s.round!.startedAt).toBe(1_700_000_000_000);
  });

  it('two identical deals produce identical rounds, timestamp included', () => {
    const a = deal(withPlayers(5, 99));
    const b = deal(withPlayers(5, 99));
    expect(a.round).toEqual(b.round);
  });
});
