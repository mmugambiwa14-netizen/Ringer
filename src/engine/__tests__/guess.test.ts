import { describe, it } from 'node:test';
import { expect } from './expect';
import { guessIsNearMiss, guessMatches, levenshtein } from '../guess';

describe('guess matching', () => {
  it('is case and whitespace insensitive', () => {
    expect(guessMatches('  pizza ', 'PIZZA')).toBe(true);
    expect(guessMatches('dance  floor', 'DANCE FLOOR')).toBe(true);
  });

  it('ignores punctuation', () => {
    expect(guessMatches('stand-up!', 'STAND UP')).toBe(true);
  });

  it('forgives one typo in longer words', () => {
    expect(guessMatches('AIRPORT', 'AIRPORT')).toBe(true);
    expect(guessMatches('AIRPORTT', 'AIRPORT')).toBe(true);
    expect(guessMatches('ARPORT', 'AIRPORT')).toBe(true);
  });

  it('does not forgive typos in short words, where they change the answer', () => {
    expect(guessMatches('CAR', 'CAT')).toBe(false);
    expect(guessMatches('BAT', 'CAT')).toBe(false);
  });

  it('rejects an empty guess', () => {
    expect(guessMatches('', 'PIZZA')).toBe(false);
    expect(guessMatches('   ', 'PIZZA')).toBe(false);
  });

  it('rejects a wrong answer', () => {
    expect(guessMatches('HELICOPTER', 'AIRPORT')).toBe(false);
  });

  it('flags a near miss for the host to call', () => {
    expect(guessIsNearMiss('AIRPRTS', 'AIRPORT')).toBe(true);
    expect(guessIsNearMiss('HELICOPTER', 'AIRPORT')).toBe(false);
    expect(guessIsNearMiss('AIRPORT', 'AIRPORT')).toBe(false); // exact is not a near miss
  });

  it('levenshtein is symmetric and zero for equal strings', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('sitting', 'kitten')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
