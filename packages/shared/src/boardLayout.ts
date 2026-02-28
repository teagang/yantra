import type { BoardSquare, SquareType } from './types.js';

// ── Board shape ────────────────────────────────────────────────────────────────
//
// The Yantra board is a 15×15 grid where only squares within a circular
// boundary are valid playing squares.  Centre star is at (7, 7).
//
// Valid square condition:  (row − 7)² + (col − 7)² ≤ 72
// This gives ≈ 205 squares, matching the 167 playing + 37 booster = 204 rule.
//
// NOTE: Booster square positions below are estimated from the hand-drawn board
// scans and should be verified against the physical board / PDF.

const BOARD_SIZE = 15;
const CENTER = 7;
const RADIUS_SQ = 72; // (row-7)² + (col-7)² ≤ 72

export function isValidSquare(row: number, col: number): boolean {
  return (row - CENTER) ** 2 + (col - CENTER) ** 2 <= RADIUS_SQ;
}

function key(row: number, col: number): string {
  return `${row},${col}`;
}

// ── Booster positions (37 total) ──────────────────────────────────────────────
// 1 star + 4 triple-seq + 8 double-seq + 12 double-tile + 12 triple-tile

const BOOSTERS: Array<[number, number, SquareType]> = [
  // Star — centre square (1)
  [7, 7, 'star'],

  // Triple-seq (4) — on the cardinal axes, mid-range
  [4, 7, 'triple-seq'],
  [7, 4, 'triple-seq'],
  [10, 7, 'triple-seq'],
  [7, 10, 'triple-seq'],

  // Double-seq (8) — far cardinal axes + upper/lower inner diagonal
  [0, 7, 'double-seq'],
  [7, 0, 'double-seq'],
  [14, 7, 'double-seq'],
  [7, 14, 'double-seq'],
  [3, 4, 'double-seq'],
  [3, 10, 'double-seq'],
  [11, 4, 'double-seq'],
  [11, 10, 'double-seq'],

  // Double-tile (12) — near-corner and edge positions
  [1, 5,  'double-tile'],
  [1, 9,  'double-tile'],
  [13, 5, 'double-tile'],
  [13, 9, 'double-tile'],
  [5, 1,  'double-tile'],
  [9, 1,  'double-tile'],
  [5, 13, 'double-tile'],
  [9, 13, 'double-tile'],
  [3, 3,  'double-tile'],
  [3, 11, 'double-tile'],
  [11, 3, 'double-tile'],
  [11, 11,'double-tile'],

  // Triple-tile (12) — inner ring and outer extremes
  [5, 5,  'triple-tile'],
  [5, 9,  'triple-tile'],
  [9, 5,  'triple-tile'],
  [9, 9,  'triple-tile'],
  [2, 7,  'triple-tile'],
  [7, 2,  'triple-tile'],
  [12, 7, 'triple-tile'],
  [7, 12, 'triple-tile'],
  [5, 0,  'triple-tile'],
  [9, 0,  'triple-tile'],
  [5, 14, 'triple-tile'],
  [9, 14, 'triple-tile'],
];

// ── Build the board map ───────────────────────────────────────────────────────

/** Set of "row,col" strings for all valid playing squares */
export const VALID_SQUARES = new Set<string>();

/** Map of "row,col" → SquareType for all booster squares */
export const BOOSTER_SQUARES = new Map<string, SquareType>();

// Register boosters
for (const [r, c, type] of BOOSTERS) {
  if (!isValidSquare(r, c)) {
    throw new Error(`Booster at (${r},${c}) is outside valid board area`);
  }
  BOOSTER_SQUARES.set(key(r, c), type);
}

// Register all valid squares
for (let r = 0; r < BOARD_SIZE; r++) {
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (isValidSquare(r, c)) {
      VALID_SQUARES.add(key(r, c));
    }
  }
}

/**
 * Build a fresh empty board state (plain object, suitable for serialisation).
 */
export function buildEmptyBoard(): Record<string, BoardSquare> {
  const board: Record<string, BoardSquare> = {};
  for (const k of VALID_SQUARES) {
    const [r, c] = k.split(',').map(Number);
    board[k] = {
      row: r,
      col: c,
      type: BOOSTER_SQUARES.get(k) ?? 'normal',
      isLocked: false,
    };
  }
  return board;
}

export { key as squareKey, BOARD_SIZE, CENTER };
