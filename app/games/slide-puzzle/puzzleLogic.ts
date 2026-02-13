export interface Tile {
  /** 0-based index in the solved puzzle (0 = top-left, N*N-1 = empty) */
  value: number;
  /** Tile's solved row */
  homeRow: number;
  /** Tile's solved column */
  homeCol: number;
}

/** Create an initial solved board (empty tile = last position) */
function solvedBoard(gridSize: number): number[] {
  return Array.from({ length: gridSize * gridSize }, (_, i) => i);
}

/** Count inversions in a flat board array (ignoring the empty tile) */
function countInversions(board: number[], emptyValue: number): number {
  let inversions = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === emptyValue) continue;
    for (let j = i + 1; j < board.length; j++) {
      if (board[j] === emptyValue) continue;
      if (board[i] > board[j]) inversions++;
    }
  }
  return inversions;
}

/** Check if a board configuration is solvable */
function isSolvable(board: number[], gridSize: number): boolean {
  const emptyValue = gridSize * gridSize - 1;
  const inversions = countInversions(board, emptyValue);
  const emptyIndex = board.indexOf(emptyValue);
  const emptyRowFromBottom = gridSize - Math.floor(emptyIndex / gridSize);

  if (gridSize % 2 === 1) {
    // Odd grid: solvable iff inversions is even
    return inversions % 2 === 0;
  } else {
    // Even grid: solvable iff (inversions + emptyRowFromBottom) is odd
    return (inversions + emptyRowFromBottom) % 2 === 1;
  }
}

/** Check if board is in solved state */
function isSolvedState(board: number[]): boolean {
  return board.every((v, i) => v === i);
}

/** Generate a solvable shuffled board */
export function generateBoard(gridSize: number): number[] {
  const n = gridSize * gridSize;
  const board = solvedBoard(gridSize);

  // Fisher-Yates shuffle
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }

  // Ensure solvable
  if (!isSolvable(board, gridSize)) {
    // Swap two non-empty tiles to flip parity
    const nonEmpty = board.reduce<number[]>((acc, v, i) => {
      if (v !== n - 1) acc.push(i);
      return acc;
    }, []);
    [board[nonEmpty[0]], board[nonEmpty[1]]] = [board[nonEmpty[1]], board[nonEmpty[0]]];
  }

  // If accidentally solved, re-shuffle
  if (isSolvedState(board)) {
    return generateBoard(gridSize);
  }

  return board;
}

/** Get tile metadata from a board value */
export function tileFromValue(value: number, gridSize: number): Tile {
  return {
    value,
    homeRow: Math.floor(value / gridSize),
    homeCol: value % gridSize,
  };
}

/** Check if a tile at the given position can move (is adjacent to empty) */
export function canMove(
  board: number[],
  gridSize: number,
  tileIndex: number,
): boolean {
  const emptyValue = gridSize * gridSize - 1;
  const emptyIndex = board.indexOf(emptyValue);

  const tileRow = Math.floor(tileIndex / gridSize);
  const tileCol = tileIndex % gridSize;
  const emptyRow = Math.floor(emptyIndex / gridSize);
  const emptyCol = emptyIndex % gridSize;

  const rowDiff = Math.abs(tileRow - emptyRow);
  const colDiff = Math.abs(tileCol - emptyCol);

  // Adjacent means exactly one step in one direction
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/** Move a tile into the empty space. Returns new board or null if invalid. */
export function moveTile(
  board: number[],
  gridSize: number,
  tileIndex: number,
): number[] | null {
  if (!canMove(board, gridSize, tileIndex)) return null;

  const emptyValue = gridSize * gridSize - 1;
  const emptyIndex = board.indexOf(emptyValue);
  const newBoard = [...board];
  [newBoard[tileIndex], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[tileIndex]];
  return newBoard;
}

/** Check if the puzzle is solved */
export function isSolved(board: number[]): boolean {
  return isSolvedState(board);
}

/** Calculate score based on moves and grid size */
export function calcScore(moves: number, gridSize: number): number {
  const par: Record<number, number> = { 3: 25, 4: 80, 5: 150, 6: 250 };
  const maxScore: Record<number, number> = { 3: 100, 4: 150, 5: 200, 6: 300 };

  const p = par[gridSize] ?? 80;
  const m = maxScore[gridSize] ?? 150;

  return Math.min(m, Math.max(10, Math.round(m * p / moves)));
}
