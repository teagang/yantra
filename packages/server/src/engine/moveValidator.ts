import { VALID_SQUARES, CENTER, squareKey } from '@yantra/shared';
import type {
  BoardSquare,
  PlaceMove,
  TilePlacement,
  TileColour,
} from '@yantra/shared';
import { effectiveValue } from './scorer.js';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  /** Entire main-sequence placements (placed + existing), sorted by position */
  mainSequenceAll?: TilePlacement[];
  /** Cross-sequences { placed, all } */
  crossSequences?: Array<{ placed: TilePlacement[]; all: TilePlacement[] }>;
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Validate a PlaceMove against the current board state.
 *
 * @param move         The move to validate.
 * @param board        Current board state (plain object).
 * @param isFirstMove  True if no tiles have been placed on the board yet.
 */
export function validateMove(
  move: PlaceMove,
  board: Record<string, BoardSquare>,
  isFirstMove: boolean
): ValidationResult {
  const { placements } = move;

  if (placements.length === 0) {
    return { valid: false, reason: 'No tiles placed.' };
  }

  // 1. All squares must be valid board squares
  for (const p of placements) {
    if (!VALID_SQUARES.has(squareKey(p.row, p.col))) {
      return { valid: false, reason: `(${p.row},${p.col}) is not a valid board square.` };
    }
  }

  // 2. All squares must be empty
  for (const p of placements) {
    const sq = board[squareKey(p.row, p.col)];
    if (sq?.placedTile) {
      return { valid: false, reason: `Square (${p.row},${p.col}) is already occupied.` };
    }
  }

  // 3. All tiles in one row OR one column
  const rows = new Set(placements.map((p) => p.row));
  const cols = new Set(placements.map((p) => p.col));
  const horizontal = rows.size === 1;
  const vertical = cols.size === 1;

  if (!horizontal && !vertical) {
    return { valid: false, reason: 'Tiles must all be in the same row or the same column.' };
  }

  // 4. No duplicate positions
  const keys = placements.map((p) => squareKey(p.row, p.col));
  if (new Set(keys).size !== keys.length) {
    return { valid: false, reason: 'Two tiles placed on the same square.' };
  }

  // 5. Determine orientation and fetch the full sequence (placed + existing)
  const mainAll = buildMainSequence(placements, board, horizontal);
  if (!mainAll) {
    return { valid: false, reason: 'Tiles do not form a contiguous sequence.' };
  }

  // 6. First move must cover the centre star
  if (isFirstMove) {
    const coversCenter = mainAll.some(
      (p) => p.row === CENTER && p.col === CENTER
    );
    if (!coversCenter) {
      return { valid: false, reason: 'First move must cover the centre star.' };
    }
  } else {
    // 7. Must connect to an existing tile on the board
    const connected = placements.some((p) => touchesExisting(p, board));
    if (!connected) {
      return { valid: false, reason: 'Tiles must connect to an existing tile on the board.' };
    }
  }

  // 8. Main sequence must be valid
  const mainSeqResult = isValidSequence(mainAll);
  if (!mainSeqResult.valid) {
    return { valid: false, reason: mainSeqResult.reason };
  }

  // 9. Cross-sequences
  const crossSequences: Array<{ placed: TilePlacement[]; all: TilePlacement[] }> = [];
  for (const p of placements) {
    const crossAll = buildCrossSequence(p, board, horizontal);
    if (crossAll && crossAll.length >= 2) {
      const crossResult = isValidSequence(crossAll);
      if (!crossResult.valid) {
        return {
          valid: false,
          reason: `Cross-sequence at (${p.row},${p.col}) is invalid: ${crossResult.reason}`,
        };
      }
      crossSequences.push({ placed: [p], all: crossAll });
    }
  }

  return {
    valid: true,
    mainSequenceAll: mainAll,
    crossSequences,
  };
}

// ── Sequence builder ──────────────────────────────────────────────────────────

/**
 * Build the full contiguous list of tiles in the main axis direction.
 * Returns null if there is a gap in the placed tiles that isn't filled by
 * an existing board tile.
 */
function buildMainSequence(
  placements: TilePlacement[],
  board: Record<string, BoardSquare>,
  horizontal: boolean
): TilePlacement[] | null {
  if (placements.length === 1) {
    // Single-tile play; no gap check needed
    const p = placements[0];
    return [p];
  }

  const fixed = horizontal ? placements[0].row : placements[0].col;
  const positions = placements.map((p) => (horizontal ? p.col : p.row)).sort((a, b) => a - b);
  const min = positions[0];
  const max = positions[positions.length - 1];

  const result: TilePlacement[] = [];
  for (let pos = min; pos <= max; pos++) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const k = squareKey(row, col);

    const newTile = placements.find((p) => p.row === row && p.col === col);
    if (newTile) {
      result.push(newTile);
    } else {
      const sq = board[k];
      if (!sq?.placedTile) return null; // gap not filled by existing tile
      result.push({ tile: sq.placedTile, row, col });
    }
  }

  // Also extend outward to include adjacent existing tiles
  return extendSequence(result, board, horizontal, fixed, min, max);
}

/**
 * Extend the sequence outward in both directions by picking up locked tiles.
 */
function extendSequence(
  core: TilePlacement[],
  board: Record<string, BoardSquare>,
  horizontal: boolean,
  fixed: number,
  min: number,
  max: number
): TilePlacement[] {
  const before: TilePlacement[] = [];
  let pos = min - 1;
  while (pos >= 0) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const k = squareKey(row, col);
    const sq = board[k];
    if (!sq?.placedTile) break;
    before.unshift({ tile: sq.placedTile, row, col });
    pos--;
  }

  const after: TilePlacement[] = [];
  pos = max + 1;
  const limit = 14;
  while (pos <= limit) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const k = squareKey(row, col);
    const sq = board[k];
    if (!sq?.placedTile) break;
    after.push({ tile: sq.placedTile, row, col });
    pos++;
  }

  return [...before, ...core, ...after];
}

/**
 * Build the cross-sequence for a single newly-placed tile.
 * Returns null if the tile is isolated in the perpendicular direction.
 */
function buildCrossSequence(
  placement: TilePlacement,
  board: Record<string, BoardSquare>,
  mainHorizontal: boolean
): TilePlacement[] | null {
  const crossHorizontal = !mainHorizontal;
  const fixed = crossHorizontal ? placement.row : placement.col;
  const pos = crossHorizontal ? placement.col : placement.row;

  // Look in both directions along the cross axis
  const before: TilePlacement[] = [];
  let p = pos - 1;
  while (p >= 0) {
    const row = crossHorizontal ? fixed : p;
    const col = crossHorizontal ? p : fixed;
    const k = squareKey(row, col);
    const sq = board[k];
    if (!sq?.placedTile) break;
    before.unshift({ tile: sq.placedTile, row, col });
    p--;
  }

  const after: TilePlacement[] = [];
  p = pos + 1;
  while (p <= 14) {
    const row = crossHorizontal ? fixed : p;
    const col = crossHorizontal ? p : fixed;
    const k = squareKey(row, col);
    const sq = board[k];
    if (!sq?.placedTile) break;
    after.push({ tile: sq.placedTile, row, col });
    p++;
  }

  if (before.length === 0 && after.length === 0) return null; // isolated

  return [...before, placement, ...after];
}

// ── Sequence validation ───────────────────────────────────────────────────────

interface SeqValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate that a list of TilePlacements forms a legal Yantra sequence:
 *   (a) ascending/descending consecutive numbers in one colour, OR
 *   (b) all same number in any colour(s)
 *
 * Blank tiles fill missing numbers.  The eight-tile may extend a 7.
 */
function isValidSequence(placements: TilePlacement[]): SeqValidation {
  if (placements.length === 0) return { valid: false, reason: 'Empty sequence.' };

  const blanks = placements.filter((p) => p.tile.isBlank);
  const eights = placements.filter((p) => p.tile.isEight);
  const numbered = placements.filter((p) => !p.tile.isBlank && !p.tile.isEight);

  // Build assigned values (blanks already have assignedValue set)
  const allValues = placements.map((p) => effectiveValue(p));
  const allColours = numbered.map((p) => p.tile.colour as TileColour);

  // ── Case (b): all same number ──────────────────────────────────────────────
  if (eights.length === 0 && blanks.length === 0) {
    const v0 = allValues[0];
    if (allValues.every((v) => v === v0)) {
      if (new Set(allColours).size !== allColours.length) {
        return { valid: false, reason: 'Duplicate colours in a same-number sequence.' };
      }
      return { valid: true };
    }
  }

  // ── Case (a): ascending/descending consecutive in one colour ───────────────
  const nonEight = placements.filter((p) => !p.tile.isEight);
  const nonEightValues = nonEight.map((p) => effectiveValue(p));
  const nonEightColours = nonEight
    .filter((p) => !p.tile.isBlank)
    .map((p) => p.tile.colour as TileColour);

  // All same colour (ignoring blanks which are colourless)
  if (nonEightColours.length > 0 && !nonEightColours.every((c) => c === nonEightColours[0])) {
    // Mixed colour: only valid as same-number sequence
    const v0 = nonEightValues[0];
    if (nonEightValues.every((v) => v === v0)) {
      if (new Set(nonEightColours).size !== nonEightColours.length) {
        return { valid: false, reason: 'Duplicate colours in a same-number sequence.' };
      }
      return { valid: true };
    }
    return { valid: false, reason: 'Mixed-colour tiles must all share the same number.' };
  }

  // Check consecutive
  const sorted = [...nonEightValues].sort((a, b) => a - b);
  const uniqueSorted = [...new Set(sorted)];
  if (uniqueSorted.length !== nonEightValues.length) {
    return { valid: false, reason: 'Duplicate values in ascending sequence.' };
  }

  const span = sorted[sorted.length - 1] - sorted[0];
  const expected = sorted.length - 1;
  if (span !== expected) {
    return { valid: false, reason: `Sequence is not consecutive (span ${span} ≠ expected ${expected}).` };
  }

  // Validate the eight-tile: may only appear adjacent to a 7
  if (eights.length > 0) {
    if (!sorted.includes(7)) {
      return { valid: false, reason: 'The eight-tile can only extend a sequence containing 7.' };
    }
    // The 8 must be at the end (max value = 7, 8 comes after)
  }

  return { valid: true };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function touchesExisting(
  p: TilePlacement,
  board: Record<string, BoardSquare>
): boolean {
  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
  ];
  for (const [dr, dc] of dirs) {
    const k = squareKey(p.row + dr, p.col + dc);
    if (board[k]?.placedTile) return true;
  }
  return false;
}
