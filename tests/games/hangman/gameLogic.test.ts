import { describe, it, expect } from 'vitest';
import {
  guessLetter,
  getWrongCount,
  isWon,
  isLost,
  getMaskedWord,
  calcScore,
  MAX_WRONG,
} from '@/app/games/hangman/gameLogic';

describe('guessLetter', () => {
  it('adds uppercase version of letter to the set', () => {
    const guessed = new Set<string>();
    const next = guessLetter(guessed, 'a');
    expect(next.has('A')).toBe(true);
  });

  it('does not mutate the original set', () => {
    const guessed = new Set<string>();
    guessLetter(guessed, 'b');
    expect(guessed.size).toBe(0);
  });

  it('uppercases lowercase input', () => {
    const next = guessLetter(new Set(), 'z');
    expect(next.has('Z')).toBe(true);
    expect(next.has('z')).toBe(false);
  });
});

describe('getWrongCount', () => {
  it('counts letters not in word', () => {
    const guessed = new Set(['A', 'B', 'X', 'Y']);
    // APPLE has A (correct), B/X/Y not in APPLE = 3 wrong
    expect(getWrongCount('APPLE', guessed)).toBe(3);
  });

  it('returns 0 when all guesses are in word', () => {
    const guessed = new Set(['A', 'P', 'L', 'E']);
    expect(getWrongCount('APPLE', guessed)).toBe(0);
  });

  it('ignores non-alpha chars in word (spaces, hyphens)', () => {
    // Word: "ICE CREAM" — spaces are not letters, should not count as wrong
    const guessed = new Set(['Z']); // Z is wrong
    expect(getWrongCount('ICE CREAM', guessed)).toBe(1);
  });

  it('ignores hyphens in word', () => {
    const guessed = new Set(['Z']);
    expect(getWrongCount('T-REX', guessed)).toBe(1);
  });
});

describe('isWon', () => {
  it('returns true when all alpha chars are guessed', () => {
    const guessed = new Set(['A', 'P', 'L', 'E']);
    expect(isWon('APPLE', guessed)).toBe(true);
  });

  it('returns false when letters remain unguessed', () => {
    const guessed = new Set(['A', 'P']);
    expect(isWon('APPLE', guessed)).toBe(false);
  });

  it('ignores non-alpha chars in word', () => {
    const guessed = new Set(['I', 'C', 'E', 'R', 'A', 'M']);
    expect(isWon('ICE CREAM', guessed)).toBe(true);
  });
});

describe('isLost', () => {
  it(`returns true at MAX_WRONG (${MAX_WRONG})`, () => {
    expect(isLost(MAX_WRONG)).toBe(true);
  });

  it('returns false below MAX_WRONG', () => {
    expect(isLost(MAX_WRONG - 1)).toBe(false);
  });

  it('returns false at 0', () => {
    expect(isLost(0)).toBe(false);
  });
});

describe('getMaskedWord', () => {
  it('reveals guessed letters and underscores for unguessed', () => {
    const guessed = new Set(['A', 'P']);
    expect(getMaskedWord('APPLE', guessed)).toBe('APP__');
  });

  it('preserves spaces as-is', () => {
    // ICE CREAM with I,C,E guessed: I→I, C→C, E→E, space→space, C→C, R→_, E→E, A→_, M→_
    const guessed = new Set(['I', 'C', 'E']);
    expect(getMaskedWord('ICE CREAM', guessed)).toBe('ICE C_E__');
  });

  it('preserves spaces exactly', () => {
    const guessed = new Set<string>();
    const masked = getMaskedWord('HOT DOG', guessed);
    expect(masked).toBe('___ ___');
  });

  it('preserves hyphens as-is', () => {
    const guessed = new Set(['T', 'R', 'E', 'X']);
    expect(getMaskedWord('T-REX', guessed)).toBe('T-REX');
  });
});

describe('calcScore', () => {
  it('returns wordLength * 100 - wrongCount * 15', () => {
    expect(calcScore(0, 5)).toBe(500);
    expect(calcScore(2, 5)).toBe(470);
  });

  it('floors at 10 when penalty exceeds base', () => {
    // 1 * 100 - 6 * 15 = 100 - 90 = 10
    expect(calcScore(6, 1)).toBe(10);
    // Worse: 1 * 100 - 10 * 15 would be negative
    expect(calcScore(10, 1)).toBe(10);
  });
});
