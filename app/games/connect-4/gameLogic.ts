export const ROWS = 6;
export const COLS = 7;

export type Cell = 'red' | 'yellow' | null;
export type Board = Cell[][];

/** Create an empty 6x7 board */
export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

/** Drop a piece into a column. Returns { newBoard, row } or null if column is full. */
export function dropPiece(
  board: Board,
  col: number,
  player: 'red' | 'yellow',
): { newBoard: Board; row: number } | null {
  // Find lowest empty row in column
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = player;
      return { newBoard, row };
    }
  }
  return null;
}

/** Directions to check: [rowDelta, colDelta] */
const DIRECTIONS: [number, number][] = [
  [0, 1],  // horizontal
  [1, 0],  // vertical
  [1, 1],  // diagonal down-right
  [1, -1], // diagonal down-left
];

/**
 * Check if placing at (row, col) creates a win.
 * Returns the 4 winning positions, or null.
 */
export function checkWin(
  board: Board,
  row: number,
  col: number,
): [number, number][] | null {
  const player = board[row][col];
  if (!player) return null;

  for (const [dr, dc] of DIRECTIONS) {
    const line: [number, number][] = [[row, col]];

    // Check forward
    for (let step = 1; step <= 3; step++) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      line.push([r, c]);
    }

    // Check backward
    for (let step = 1; step <= 3; step++) {
      const r = row - dr * step;
      const c = col - dc * step;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      line.push([r, c]);
    }

    if (line.length >= 4) return line.slice(0, 4);
  }

  return null;
}

/** Check if the board is completely full */
export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

/**
 * Simple AI: pick the best column.
 * Priority: win > block opponent win > center > random valid column.
 */
export function getAIMove(
  board: Board,
  aiPlayer: 'red' | 'yellow',
  humanPlayer: 'red' | 'yellow',
): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  // 1. Can AI win immediately?
  for (const col of validCols) {
    const result = dropPiece(board, col, aiPlayer);
    if (result && checkWin(result.newBoard, result.row, col)) {
      return col;
    }
  }

  // 2. Must AI block human's winning move?
  for (const col of validCols) {
    const result = dropPiece(board, col, humanPlayer);
    if (result && checkWin(result.newBoard, result.row, col)) {
      return col;
    }
  }

  // 3. Prefer center column, then columns near center
  const centerOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const col of centerOrder) {
    if (validCols.includes(col)) return col;
  }

  // 4. Fallback: random valid column
  return validCols[Math.floor(Math.random() * validCols.length)];
}

function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

/** Calculate score: fewer moves = higher score. Only for AI wins. */
export function calcScore(moves: number): number {
  return Math.max(0, 100 - (moves - 7) * 4);
}
