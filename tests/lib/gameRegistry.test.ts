import { describe, it, expect } from 'vitest';
import { games, getGame, getGamesForAge } from '@/app/lib/gameRegistry';

describe('getGame', () => {
  it('returns correct definition for connect-4', () => {
    const game = getGame('connect-4');
    expect(game).toBeDefined();
    expect(game!.slug).toBe('connect-4');
    expect(game!.title).toBe('Connect 4');
  });

  it('returns correct definition for jigsaw-puzzle', () => {
    const game = getGame('jigsaw-puzzle');
    expect(game).toBeDefined();
    expect(game!.slug).toBe('jigsaw-puzzle');
    expect(game!.emoji).toBe('🧩');
    expect(game!.ageRange[0]).toBe(3);
  });

  it('returns undefined for nonexistent slug', () => {
    expect(getGame('nonexistent')).toBeUndefined();
  });
});

describe('getGamesForAge', () => {
  it('includes color-match (min age 3) for age 3', () => {
    const result = getGamesForAge(3);
    const slugs = result.map((g) => g.slug);
    expect(slugs).toContain('color-match');
  });

  it('excludes hangman (min age 5) for age 3', () => {
    const result = getGamesForAge(3);
    const slugs = result.map((g) => g.slug);
    expect(slugs).not.toContain('hangman');
  });

  it('returns all 7 games for age 5', () => {
    const result = getGamesForAge(5);
    expect(result).toHaveLength(7);
  });

  it('returns empty array for age 0', () => {
    expect(getGamesForAge(0)).toHaveLength(0);
  });
});

describe('games registry', () => {
  it('has exactly 7 entries', () => {
    expect(games).toHaveLength(7);
  });

  it('all entries have required fields', () => {
    for (const g of games) {
      expect(g.slug).toBeTruthy();
      expect(g.title).toBeTruthy();
      expect(g.emoji).toBeTruthy();
      expect(g.ageRange).toHaveLength(2);
      expect(['puzzle', 'action', 'creative', 'educational']).toContain(g.category);
    }
  });

  it('all ageRange tuples have min <= max', () => {
    for (const g of games) {
      expect(g.ageRange[0]).toBeLessThanOrEqual(g.ageRange[1]);
    }
  });
});
