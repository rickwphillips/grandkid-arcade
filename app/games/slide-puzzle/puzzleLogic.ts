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

// --------------- IDA* Solver ---------------

/** Manhattan distance + linear conflict heuristic (admissible) */
function solverHeuristic(b: number[], gridSize: number): number {
  const n = gridSize * gridSize;
  const emptyVal = n - 1;
  let manhattan = 0;

  for (let i = 0; i < n; i++) {
    const v = b[i];
    if (v === emptyVal) continue;
    manhattan +=
      Math.abs(Math.floor(v / gridSize) - Math.floor(i / gridSize)) +
      Math.abs((v % gridSize) - (i % gridSize));
  }

  return manhattan + linearConflict(b, gridSize);
}

/** Count linear conflicts: tiles in their goal row/col but needing to pass each other */
function linearConflict(b: number[], gridSize: number): number {
  const n = gridSize * gridSize;
  const emptyVal = n - 1;
  let lc = 0;

  // Row conflicts
  for (let row = 0; row < gridSize; row++) {
    const cols: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      const v = b[row * gridSize + c];
      if (v !== emptyVal && Math.floor(v / gridSize) === row) {
        cols.push(v % gridSize);
      }
    }
    lc += lcCount(cols);
  }

  // Column conflicts
  for (let col = 0; col < gridSize; col++) {
    const rows: number[] = [];
    for (let r = 0; r < gridSize; r++) {
      const v = b[r * gridSize + col];
      if (v !== emptyVal && (v % gridSize) === col) {
        rows.push(Math.floor(v / gridSize));
      }
    }
    lc += lcCount(rows);
  }

  return lc;
}

/** Minimum removals to make sequence non-decreasing, × 2 */
function lcCount(seq: number[]): number {
  if (seq.length <= 1) return 0;
  // Longest non-decreasing subsequence via patience sorting
  const tails: number[] = [];
  for (const x of seq) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
  }
  return (seq.length - tails.length) * 2;
}

/**
 * IDA* solver for the slide puzzle.
 * Returns an array of board positions (indices) to click in order, or null if
 * the puzzle cannot be solved within the node budget.
 * Only supports gridSize <= 4.
 */
export function solvePuzzle(
  board: number[],
  gridSize: number,
): number[] | null {
  if (gridSize > 5) return null;

  const n = gridSize * gridSize;
  const emptyVal = n - 1;
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Weight > 1 trades optimality for speed (needed for 5×5)
  const weight = gridSize <= 4 ? 1 : 2.5;

  const h0 = solverHeuristic(board, gridSize);
  if (h0 === 0) return [];

  let solution: number[] | null = null;
  let nodeCount = 0;
  const NODE_LIMIT = 15_000_000;

  function search(
    b: number[],
    emptyIdx: number,
    g: number,
    threshold: number,
    path: number[],
    lastDir: number,
  ): number {
    const h = solverHeuristic(b, gridSize);
    const f = g + weight * h;
    if (f > threshold) return f;
    if (h === 0) {
      solution = [...path];
      return -1;
    }
    if (++nodeCount > NODE_LIMIT) return Infinity;

    let minT = Infinity;
    const eRow = Math.floor(emptyIdx / gridSize);
    const eCol = emptyIdx % gridSize;

    for (let d = 0; d < 4; d++) {
      // Don't reverse last move (opposite dirs: 0↔1, 2↔3)
      if (lastDir >= 0 && d === (lastDir ^ 1)) continue;

      const nRow = eRow + dirs[d][0];
      const nCol = eCol + dirs[d][1];
      if (nRow < 0 || nRow >= gridSize || nCol < 0 || nCol >= gridSize)
        continue;

      const nIdx = nRow * gridSize + nCol;

      // Swap empty with tile at nIdx
      b[emptyIdx] = b[nIdx];
      b[nIdx] = emptyVal;
      path.push(nIdx);

      const t = search(b, nIdx, g + 1, threshold, path, d);

      // Undo swap
      path.pop();
      b[nIdx] = b[emptyIdx];
      b[emptyIdx] = emptyVal;

      if (t === -1) return -1;
      if (t < minT) minT = t;
    }

    return minT;
  }

  const work = [...board];
  const emptyIdx = work.indexOf(emptyVal);
  let threshold = weight * h0;

  while (threshold < Infinity) {
    const t = search(work, emptyIdx, 0, threshold, [], -1);
    if (t === -1) return solution;
    if (t === Infinity) return null;
    threshold = t;
  }

  return null;
}
