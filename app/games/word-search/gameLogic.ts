export const GRID_CONFIG = {
  easy:   { size: 8,  maxWords: 6  },
  medium: { size: 10, maxWords: 8  },
  hard:   { size: 12, maxWords: 12 },
};

// [rowDelta, colDelta]
export type Direction = [number, number];

const DIRECTIONS: Direction[] = [
  [0,  1],  // right
  [0, -1],  // left
  [1,  0],  // down
  [-1, 0],  // up
  [1,  1],  // down-right
  [1, -1],  // down-left
  [-1, 1],  // up-right
  [-1,-1],  // up-left
];

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

export interface Grid {
  cells: string[][];
  placedWords: PlacedWord[];
}

export function generateGrid(words: string[], difficulty: 'easy' | 'medium' | 'hard'): Grid {
  const { size, maxWords } = GRID_CONFIG[difficulty];

  // Only use single words (no spaces), minimum 3 chars, uppercased
  const valid = words
    .map(w => w.toUpperCase().trim())
    .filter(w => !w.includes(' ') && w.length >= 3);

  // Shorter words first (easier to place, preferred for easy difficulty)
  const sorted = [...valid].sort((a, b) => a.length - b.length);
  const selected = sorted.slice(0, maxWords);

  const cells: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords: PlacedWord[] = [];

  for (const word of selected) {
    let placed = false;

    // Shuffle directions for variety
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      const dir = dirs[attempt % dirs.length];
      const [dr, dc] = dir;

      // Calculate valid start range so word fits in grid
      const rowMin = dr < 0 ? word.length - 1 : 0;
      const rowMax = dr > 0 ? size - word.length : size - 1;
      const colMin = dc < 0 ? word.length - 1 : 0;
      const colMax = dc > 0 ? size - word.length : size - 1;

      if (rowMin > rowMax || colMin > colMax) continue;

      const startRow = rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1));
      const startCol = colMin + Math.floor(Math.random() * (colMax - colMin + 1));

      // Check for collision (allow overlap only if same letter)
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = startRow + dr * i;
        const c = startCol + dc * i;
        if (cells[r][c] !== '' && cells[r][c] !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          cells[startRow + dr * i][startCol + dc * i] = word[i];
        }
        placedWords.push({ word, startRow, startCol, direction: dir });
        placed = true;
      }
    }
  }

  // Fill remaining empty cells with random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === '') {
        cells[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { cells, placedWords };
}

/**
 * Check if start → end is a straight line matching any placed word.
 * Supports both forward (start→end) and reverse (end→start) selection.
 * Returns the matched word string, or null if no match.
 */
export function checkSelection(
  grid: Grid,
  start: [number, number],
  end: [number, number],
): string | null {
  const [r1, c1] = start;
  const [r2, c2] = end;

  const dr = r2 - r1;
  const dc = c2 - c1;

  // Must be on a straight line (horizontal, vertical, or 45° diagonal)
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

  const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  if (len < 2) return null;

  const normDr = dr === 0 ? 0 : dr / Math.abs(dr);
  const normDc = dc === 0 ? 0 : dc / Math.abs(dc);

  for (const pw of grid.placedWords) {
    if (pw.word.length !== len) continue;
    const [pdr, pdc] = pw.direction;
    const endRow = pw.startRow + pdr * (pw.word.length - 1);
    const endCol = pw.startCol + pdc * (pw.word.length - 1);

    // Forward match: user clicked word-start → word-end
    if (
      pw.startRow === r1 && pw.startCol === c1 &&
      pdr === normDr && pdc === normDc
    ) {
      return pw.word;
    }

    // Reverse match: user clicked word-end → word-start
    if (
      endRow === r1 && endCol === c1 &&
      pdr === -normDr && pdc === -normDc
    ) {
      return pw.word;
    }
  }

  return null;
}

/** 100 points per found word + 500 completion bonus */
export function calcScore(foundCount: number, totalWords: number): number {
  const base = foundCount * 100;
  const bonus = foundCount === totalWords ? 500 : 0;
  return base + bonus;
}

/** Get all cell keys "r,c" that a placed word occupies */
export function getPlacedWordCells(pw: PlacedWord): string[] {
  const result: string[] = [];
  for (let i = 0; i < pw.word.length; i++) {
    result.push(`${pw.startRow + pw.direction[0] * i},${pw.startCol + pw.direction[1] * i}`);
  }
  return result;
}
