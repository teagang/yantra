import {
  BONUS_ALL_SEVEN,
  BONUS_SEVEN_SEQ,
  STAR_MULTIPLIER,
  HAND_SIZE,
} from '@yantra/shared';
import type {
  BoardSquare,
  ScoreResult,
  SequenceScore,
  TilePlacement,
} from '@yantra/shared';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Effective numeric value of a tile (blank uses assignedValue, eight = 8) */
export function effectiveValue(placement: TilePlacement): number {
  const { tile } = placement;
  if (tile.isBlank) return tile.assignedValue ?? 0;
  return tile.value;
}

/** Get the tile multiplier for a square (1, 2, or 3) */
function tileMultiplier(square: BoardSquare): number {
  if (square.type === 'double-tile') return 2;
  if (square.type === 'triple-tile') return 3;
  return 1;
}

/** Get the sequence multiplier for a square (1, 2, or 3) */
function seqMultiplierOf(square: BoardSquare): number {
  if (square.type === 'triple-seq') return 3;
  if (square.type === 'double-seq') return 2;
  if (square.type === 'star') return STAR_MULTIPLIER;
  return 1;
}

// ── Score a single sequence ───────────────────────────────────────────────────

/**
 * Score one sequence on the board.
 *
 * `placements` = only the newly-placed tiles in this sequence (not existing ones).
 * `allTiles`   = all tiles in the sequence (placed + existing), used to determine
 *                whether the sequence qualifies for the 7-tile bonuses.
 * `board`      = current board state (plain object).
 *
 * Booster squares are only activated by the NEW tiles placed on them this turn.
 * Existing tiles sitting on boosters do not re-activate the bonus.
 */
export function scoreSequence(
  placements: TilePlacement[],
  allPlacements: TilePlacement[], // entire sequence (new + existing positions)
  board: Record<string, BoardSquare>
): SequenceScore {
  // Sum tile values for the whole sequence, applying tile multipliers only where
  // new tiles were placed this turn.
  const newKeys = new Set(placements.map((p) => `${p.row},${p.col}`));

  let tileAdjustedSum = 0;
  let seqMul = 1;

  for (const p of allPlacements) {
    const k = `${p.row},${p.col}`;
    const square = board[k];
    const val = effectiveValue(p);

    if (newKeys.has(k) && square) {
      // New tile — apply tile multiplier
      tileAdjustedSum += val * tileMultiplier(square);
      // Accumulate sequence multiplier
      seqMul *= seqMultiplierOf(square);
    } else {
      // Existing tile — no bonus re-activation
      tileAdjustedSum += val;
    }
  }

  return {
    tiles: placements,
    tileAdjustedSum,
    seqMultiplier: seqMul,
    sequenceScore: tileAdjustedSum * seqMul,
  };
}

// ── Main scoring entry point ──────────────────────────────────────────────────

/**
 * Calculate the full score for a turn.
 *
 * @param mainSequencePlacements  All new placements (must be in one row or col).
 * @param mainSequenceAll         Entire sequence (new + existing tiles) for the main line.
 * @param crossSequences          Each cross-sequence: { placed, all } for the perpendicular
 *                                sequences formed by individual tiles touching existing tiles.
 * @param board                   Current board state BEFORE the move is applied.
 * @param tilesUsed               Number of tiles the player played this turn.
 */
export function calculateScore(
  mainSequencePlacements: TilePlacement[],
  mainSequenceAll: TilePlacement[],
  crossSequences: Array<{ placed: TilePlacement[]; all: TilePlacement[] }>,
  board: Record<string, BoardSquare>,
  tilesUsed: number
): ScoreResult {
  const sequences: SequenceScore[] = [];

  // Main sequence (only score if it has ≥ 2 tiles total, or is a fresh 1-tile play
  // extending an existing tile — but single-tile plays that form no cross are invalid)
  if (mainSequenceAll.length >= 2) {
    sequences.push(
      scoreSequence(mainSequencePlacements, mainSequenceAll, board)
    );
  } else if (mainSequenceAll.length === 1) {
    // Single tile touching nothing — valid only on first move; score as-is
    sequences.push(
      scoreSequence(mainSequencePlacements, mainSequenceAll, board)
    );
  }

  // Cross-sequences (each must be ≥ 2 tiles to count)
  for (const cs of crossSequences) {
    if (cs.all.length >= 2) {
      sequences.push(scoreSequence(cs.placed, cs.all, board));
    }
  }

  const subtotal = sequences.reduce((s, seq) => s + seq.sequenceScore, 0);

  // Bonuses
  const bonusAllSeven = tilesUsed === HAND_SIZE ? BONUS_ALL_SEVEN : 0;

  // Check if the MAIN sequence is a 7-tile numerical sequence
  const isNumericalSeq =
    tilesUsed === HAND_SIZE &&
    mainSequenceAll.length === HAND_SIZE &&
    isAscendingOrDescending(mainSequenceAll);
  const bonusSevenSeq = isNumericalSeq ? BONUS_SEVEN_SEQ : 0;

  return {
    sequences,
    subtotal,
    bonusAllSeven,
    bonusSevenSeq,
    finalScore: subtotal + bonusAllSeven + bonusSevenSeq,
  };
}

// ── Sequence type checks ──────────────────────────────────────────────────────

/**
 * Returns true if a list of tile placements forms an ascending or descending
 * consecutive-number sequence in a single colour.
 * Blanks are already assigned values before this check.
 */
export function isAscendingOrDescending(placements: TilePlacement[]): boolean {
  if (placements.length < 2) return false;

  const nonEight = placements.filter((p) => !p.tile.isEight);
  const values = nonEight.map((p) => effectiveValue(p));
  const colours = nonEight
    .filter((p) => !p.tile.isBlank)
    .map((p) => p.tile.colour);

  // All same colour
  if (colours.length > 0 && !colours.every((c) => c === colours[0])) {
    return false;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0];
  if (span !== values.length - 1) return false;

  // No duplicates
  return new Set(sorted).size === sorted.length;
}
