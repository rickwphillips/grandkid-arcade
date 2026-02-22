import { describe, it, expect } from 'vitest';
import {
  generateBoard,
  tileFromValue,
  canMove,
  moveTile,
  isSolved,
  calcScore,
  solvePuzzle,
} from '@/app/games/slide-puzzle/puzzleLogic';

describe('generateBoard', () => {
  it('returns 9-element array for gridSize 3', () => {
    const board = generateBoard(3);
    expect(board).toHaveLength(9);
  });

  it('contains all values 0..N*N-1 exactly once', () => {
    const board = generateBoard(3);
    const sorted = [...board].sort((a, b) => a - b);
    expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('is never already solved', () => {
    // Run multiple times to account for randomness
    for (let i = 0; i < 10; i++) {
      const board = generateBoard(3);
      expect(isSolved(board)).toBe(false);
    }
  });
});

describe('tileFromValue', () => {
  it('returns correct homeRow and homeCol for value 5 in a 3x3 grid', () => {
    const tile = tileFromValue(5, 3);
    expect(tile.value).toBe(5);
    expect(tile.homeRow).toBe(1); // floor(5/3) = 1
    expect(tile.homeCol).toBe(2); // 5 % 3 = 2
  });

  it('returns homeRow 0 and homeCol 0 for value 0', () => {
    const tile = tileFromValue(0, 3);
    expect(tile.homeRow).toBe(0);
    expect(tile.homeCol).toBe(0);
  });
});

describe('isSolved', () => {
  it('returns true for solved board [0,1,2,3,4,5,6,7,8]', () => {
    expect(isSolved([0, 1, 2, 3, 4, 5, 6, 7, 8])).toBe(true);
  });

  it('returns false for a shuffled board', () => {
    expect(isSolved([1, 0, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
  });
});

describe('canMove', () => {
  // Solved board: 0 1 2 / 3 4 5 / 6 7 8(empty)
  // empty is at index 8 (row 2, col 2)
  const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const gridSize = 3;

  it('returns true for tile adjacent to empty (above)', () => {
    // tile at index 5 (row 1, col 2) is directly above empty (index 8)
    expect(canMove(board, gridSize, 5)).toBe(true);
  });

  it('returns true for tile adjacent to empty (left)', () => {
    // tile at index 7 (row 2, col 1) is to the left of empty (index 8)
    expect(canMove(board, gridSize, 7)).toBe(true);
  });

  it('returns false for non-adjacent tile', () => {
    // tile at index 0 is not adjacent to empty (index 8)
    expect(canMove(board, gridSize, 0)).toBe(false);
  });

  it('returns false for tile 2 positions away in same row', () => {
    // tile at index 6 (row 2, col 0) — 2 cols away from empty
    expect(canMove(board, gridSize, 6)).toBe(false);
  });
});

describe('moveTile', () => {
  // Solved board with empty at index 8
  const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const gridSize = 3;

  it('swaps tile with empty and returns new board', () => {
    const newBoard = moveTile(board, gridSize, 7)!;
    expect(newBoard).not.toBeNull();
    // index 7 should now have empty (8), index 8 should have 7
    expect(newBoard[7]).toBe(8);
    expect(newBoard[8]).toBe(7);
  });

  it('does not mutate the original board', () => {
    moveTile(board, gridSize, 7);
    expect(board[7]).toBe(7);
  });

  it('returns null for non-adjacent tile', () => {
    expect(moveTile(board, gridSize, 0)).toBeNull();
  });
});

describe('calcScore', () => {
  it('returns max score at par moves', () => {
    // gridSize 3: par=25, maxScore=100
    const score = calcScore(25, 3);
    expect(score).toBe(100);
  });

  it('returns roughly half max score at 2x par', () => {
    // gridSize 3: par=25, maxScore=100 → at moves=50: round(100*25/50)=50
    const score = calcScore(50, 3);
    expect(score).toBe(50);
  });

  it('floors at 10 for very high move count', () => {
    const score = calcScore(10000, 3);
    expect(score).toBe(10);
  });

  it('caps at maxScore even with very few moves', () => {
    // calcScore rounds down: min(100, max(10, round(100*25/1))) = min(100, 2500) = 100
    const score = calcScore(1, 3);
    expect(score).toBe(100);
  });
});

describe('solvePuzzle', () => {
  it('returns empty array for already-solved board', () => {
    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(solvePuzzle(board, 3)).toEqual([]);
  });

  it('returns valid solution path for a nearly-solved board (1 move away)', () => {
    // Board with tile 7 swapped with empty (8): [0,1,2,3,4,5,6,8,7]
    // empty is at index 7, tile 7 is at index 8 — swap to solve
    const board = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    const solution = solvePuzzle(board, 3);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBeGreaterThan(0);
    // Apply solution and verify board is solved
    let b = [...board];
    for (const idx of solution!) {
      b = moveTile(b, 3, idx)!;
    }
    expect(isSolved(b)).toBe(true);
  });

  it('returns null for gridSize > 5', () => {
    const board = Array.from({ length: 36 }, (_, i) => i);
    expect(solvePuzzle(board, 6)).toBeNull();
  });
});
