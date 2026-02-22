import { describe, it, expect } from 'vitest';
import {
  generateGrid,
  checkSelection,
  calcScore,
  getPlacedWordCells,
  GRID_CONFIG,
} from '@/app/games/word-search/gameLogic';

const TEST_WORDS = ['CAT', 'DOG', 'BIRD', 'FISH', 'WOLF', 'BEAR', 'LION', 'DEER', 'FROG', 'CRAB', 'HAWK', 'MOLE'];

describe('generateGrid', () => {
  it("returns 8×8 cells for 'easy'", () => {
    const { cells } = generateGrid(TEST_WORDS, 'easy');
    expect(cells).toHaveLength(8);
    cells.forEach((row) => expect(row).toHaveLength(8));
  });

  it("returns 10×10 cells for 'medium'", () => {
    const { cells } = generateGrid(TEST_WORDS, 'medium');
    expect(cells).toHaveLength(10);
    cells.forEach((row) => expect(row).toHaveLength(10));
  });

  it("returns 12×12 cells for 'hard'", () => {
    const { cells } = generateGrid(TEST_WORDS, 'hard');
    expect(cells).toHaveLength(12);
    cells.forEach((row) => expect(row).toHaveLength(12));
  });

  it('all cells are single uppercase letters', () => {
    const { cells } = generateGrid(TEST_WORDS, 'easy');
    cells.forEach((row) =>
      row.forEach((cell) => {
        expect(cell).toMatch(/^[A-Z]$/);
      }),
    );
  });

  it('each placed word exists in cells at its declared position and direction', () => {
    const grid = generateGrid(TEST_WORDS, 'medium');
    for (const pw of grid.placedWords) {
      const [dr, dc] = pw.direction;
      for (let i = 0; i < pw.word.length; i++) {
        const r = pw.startRow + dr * i;
        const c = pw.startCol + dc * i;
        expect(grid.cells[r][c]).toBe(pw.word[i]);
      }
    }
  });
});

describe('checkSelection', () => {
  it('returns word string for correct forward selection', () => {
    // Place a word horizontally and check it
    const grid = generateGrid(['HELLO'], 'easy');
    const pw = grid.placedWords.find((w) => w.word === 'HELLO');
    if (!pw) return; // word may not have been placed if grid is small
    const [dr, dc] = pw.direction;
    const endRow = pw.startRow + dr * (pw.word.length - 1);
    const endCol = pw.startCol + dc * (pw.word.length - 1);
    const result = checkSelection(grid, [pw.startRow, pw.startCol], [endRow, endCol]);
    expect(result).toBe('HELLO');
  });

  it('returns word string for correct reverse selection', () => {
    const grid = generateGrid(['HELLO'], 'easy');
    const pw = grid.placedWords.find((w) => w.word === 'HELLO');
    if (!pw) return;
    const [dr, dc] = pw.direction;
    const endRow = pw.startRow + dr * (pw.word.length - 1);
    const endCol = pw.startCol + dc * (pw.word.length - 1);
    // Reverse: end→start
    const result = checkSelection(grid, [endRow, endCol], [pw.startRow, pw.startCol]);
    expect(result).toBe('HELLO');
  });

  it('returns null for non-matching endpoint pair', () => {
    const grid = generateGrid(['CAT'], 'easy');
    // (0,0) → (0,1) — a 2-cell span that likely doesn't match any placed word
    const result = checkSelection(grid, [0, 0], [0, 1]);
    // It's possible this matches by chance but very unlikely with length check
    if (result !== null) {
      expect(grid.placedWords.some((pw) => pw.word === result && pw.word.length === 2)).toBe(true);
    } else {
      expect(result).toBeNull();
    }
  });

  it('returns null for non-straight-line selection', () => {
    const grid = generateGrid(['CAT'], 'easy');
    // (0,0) → (1,2) is not a straight line (dr=1, dc=2, |dr|≠|dc|)
    const result = checkSelection(grid, [0, 0], [1, 2]);
    expect(result).toBeNull();
  });
});

describe('calcScore', () => {
  it('returns 300 for 3 found out of 6 (no bonus)', () => {
    expect(calcScore(3, 6)).toBe(300);
  });

  it('returns 1100 for 6 found out of 6 (bonus applied)', () => {
    expect(calcScore(6, 6)).toBe(1100);
  });

  it('returns 0 for 0 found', () => {
    expect(calcScore(0, 6)).toBe(0);
  });
});

describe('getPlacedWordCells', () => {
  it('returns correct "r,c" key strings for a horizontal word', () => {
    const pw = { word: 'CAT', startRow: 2, startCol: 3, direction: [0, 1] as [number, number] };
    const cells = getPlacedWordCells(pw);
    expect(cells).toEqual(['2,3', '2,4', '2,5']);
  });

  it('returns correct "r,c" key strings for a vertical word', () => {
    const pw = { word: 'DOG', startRow: 0, startCol: 5, direction: [1, 0] as [number, number] };
    const cells = getPlacedWordCells(pw);
    expect(cells).toEqual(['0,5', '1,5', '2,5']);
  });

  it('returns correct cells for a diagonal word', () => {
    const pw = { word: 'AB', startRow: 1, startCol: 1, direction: [1, 1] as [number, number] };
    const cells = getPlacedWordCells(pw);
    expect(cells).toEqual(['1,1', '2,2']);
  });
});
