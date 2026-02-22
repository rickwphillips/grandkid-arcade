import { describe, it, expect } from 'vitest';
import {
  createBoard,
  dropPiece,
  checkWin,
  isBoardFull,
  getAIMove,
  calcScore,
  ROWS,
  COLS,
} from '@/app/games/connect-4/gameLogic';

describe('createBoard', () => {
  it('returns a 6x7 grid of nulls', () => {
    const board = createBoard();
    expect(board).toHaveLength(ROWS);
    board.forEach((row) => {
      expect(row).toHaveLength(COLS);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });
});

describe('dropPiece', () => {
  it('places piece in the lowest empty row of a column', () => {
    const board = createBoard();
    const result = dropPiece(board, 3, 'red');
    expect(result).not.toBeNull();
    expect(result!.row).toBe(ROWS - 1);
    expect(result!.newBoard[ROWS - 1][3]).toBe('red');
  });

  it('stacks pieces on top of each other', () => {
    let board = createBoard();
    const r1 = dropPiece(board, 3, 'red')!;
    board = r1.newBoard;
    const r2 = dropPiece(board, 3, 'yellow')!;
    expect(r2.row).toBe(ROWS - 2);
    expect(r2.newBoard[ROWS - 2][3]).toBe('yellow');
  });

  it('returns null when column is full', () => {
    let board = createBoard();
    for (let i = 0; i < ROWS; i++) {
      const result = dropPiece(board, 0, 'red');
      expect(result).not.toBeNull();
      board = result!.newBoard;
    }
    expect(dropPiece(board, 0, 'yellow')).toBeNull();
  });
});

describe('checkWin', () => {
  it('detects horizontal 4-in-a-row', () => {
    let board = createBoard();
    for (let c = 0; c < 4; c++) {
      const r = dropPiece(board, c, 'red')!;
      board = r.newBoard;
    }
    const win = checkWin(board, ROWS - 1, 3);
    expect(win).not.toBeNull();
    expect(win).toHaveLength(4);
  });

  it('detects vertical 4-in-a-row', () => {
    let board = createBoard();
    for (let i = 0; i < 4; i++) {
      const r = dropPiece(board, 2, 'yellow')!;
      board = r.newBoard;
    }
    const lastRow = ROWS - 4;
    const win = checkWin(board, lastRow, 2);
    expect(win).not.toBeNull();
    expect(win).toHaveLength(4);
  });

  it('detects diagonal down-right 4-in-a-row', () => {
    // Target: red at (ROWS-4,0), (ROWS-3,1), (ROWS-2,2), (ROWS-1,3) — dr=1,dc=1
    // dropPiece puts pieces at the lowest empty row, so we need blockers to lift the red pieces
    let board = createBoard();
    // Col 0: 3 yellow blockers → red lands at ROWS-4
    for (let i = 0; i < 3; i++) board = dropPiece(board, 0, 'yellow')!.newBoard;
    board = dropPiece(board, 0, 'red')!.newBoard;
    // Col 1: 2 yellow blockers → red lands at ROWS-3
    for (let i = 0; i < 2; i++) board = dropPiece(board, 1, 'yellow')!.newBoard;
    board = dropPiece(board, 1, 'red')!.newBoard;
    // Col 2: 1 yellow blocker → red lands at ROWS-2
    board = dropPiece(board, 2, 'yellow')!.newBoard;
    board = dropPiece(board, 2, 'red')!.newBoard;
    // Col 3: no blockers → red lands at ROWS-1
    const lastDrop = dropPiece(board, 3, 'red')!;
    board = lastDrop.newBoard;
    const win = checkWin(board, lastDrop.row, 3);
    expect(win).not.toBeNull();
  });

  it('detects diagonal down-left 4-in-a-row', () => {
    // Target: red at (ROWS-4,6), (ROWS-3,5), (ROWS-2,4), (ROWS-1,3) — dr=1,dc=-1
    let board = createBoard();
    // Col 6: 3 yellow → red at ROWS-4
    for (let i = 0; i < 3; i++) board = dropPiece(board, 6, 'yellow')!.newBoard;
    board = dropPiece(board, 6, 'red')!.newBoard;
    // Col 5: 2 yellow → red at ROWS-3
    for (let i = 0; i < 2; i++) board = dropPiece(board, 5, 'yellow')!.newBoard;
    board = dropPiece(board, 5, 'red')!.newBoard;
    // Col 4: 1 yellow → red at ROWS-2
    board = dropPiece(board, 4, 'yellow')!.newBoard;
    board = dropPiece(board, 4, 'red')!.newBoard;
    // Col 3: no blockers → red at ROWS-1
    const lastDrop = dropPiece(board, 3, 'red')!;
    board = lastDrop.newBoard;
    const win = checkWin(board, lastDrop.row, 3);
    expect(win).not.toBeNull();
  });

  it('returns null when no win', () => {
    const board = createBoard();
    expect(checkWin(board, 0, 0)).toBeNull();
  });

  it('returns null for 3-in-a-row', () => {
    let board = createBoard();
    for (let c = 0; c < 3; c++) {
      const r = dropPiece(board, c, 'red')!;
      board = r.newBoard;
    }
    expect(checkWin(board, ROWS - 1, 2)).toBeNull();
  });
});

describe('isBoardFull', () => {
  it('returns false on empty board', () => {
    expect(isBoardFull(createBoard())).toBe(false);
  });

  it('returns true when all cells are filled', () => {
    let board = createBoard();
    for (let c = 0; c < COLS; c++) {
      const player = c % 2 === 0 ? 'red' : 'yellow';
      for (let r = 0; r < ROWS; r++) {
        board = dropPiece(board, c, player)!.newBoard;
      }
    }
    expect(isBoardFull(board)).toBe(true);
  });
});

describe('getAIMove', () => {
  it('picks winning column when AI can win immediately', () => {
    // Place 3 yellow in a row, AI should pick 4th
    let board = createBoard();
    board = dropPiece(board, 0, 'yellow')!.newBoard;
    board = dropPiece(board, 1, 'yellow')!.newBoard;
    board = dropPiece(board, 2, 'yellow')!.newBoard;
    const move = getAIMove(board, 'yellow', 'red');
    expect(move).toBe(3);
  });

  it('blocks opponent winning move', () => {
    // Human (red) has 3 in a row, AI should block
    let board = createBoard();
    board = dropPiece(board, 0, 'red')!.newBoard;
    board = dropPiece(board, 1, 'red')!.newBoard;
    board = dropPiece(board, 2, 'red')!.newBoard;
    const move = getAIMove(board, 'yellow', 'red');
    expect(move).toBe(3);
  });

  it('prefers center column (3) on empty board', () => {
    const board = createBoard();
    const move = getAIMove(board, 'yellow', 'red');
    expect(move).toBe(3);
  });
});

describe('calcScore', () => {
  it('returns 100 at 7 moves (minimum)', () => {
    expect(calcScore(7)).toBe(100);
  });

  it('decreases with more moves', () => {
    expect(calcScore(14)).toBeLessThan(calcScore(7));
  });

  it('floors at 0', () => {
    expect(calcScore(1000)).toBe(0);
  });
});
