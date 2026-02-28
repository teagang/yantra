import type { TileColour } from './types.js';

// ── Tile Pool ─────────────────────────────────────────────────────────────────

export const COLOURS: TileColour[] = ['red', 'blue', 'yellow', 'purple'];

/** How many tiles of each face value exist per colour */
export const TILE_DISTRIBUTION: Record<number, number> = {
  1: 6,
  2: 4,
  3: 3,
  4: 2,
  5: 2,
  6: 2,
  7: 1,
};
// Total per colour: 6+4+3+2+2+2+1 = 20

export const BLANK_COUNT = 4;
export const EIGHT_COUNT = 2;
// Grand total: 4 × 20 + 4 + 2 = 86 tiles

export const HAND_SIZE = 7;

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Bonus for using all 7 tiles in one turn */
export const BONUS_ALL_SEVEN = 20;

/** Bonus for a 7-tile numerical sequence in one turn */
export const BONUS_SEVEN_SEQ = 20;

/** Effective star multiplier (doubles the sequence total) */
export const STAR_MULTIPLIER = 2;

// ── Game Rules ────────────────────────────────────────────────────────────────

/** Maximum players per game */
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

/** Number of consecutive passes (all players) before game ends */
export const MAX_CONSECUTIVE_SKIPS_PER_PLAYER = 2;

/** Days before an async game is auto-expired */
export const GAME_EXPIRY_DAYS = 5;

/** Default speed play timer (seconds) */
export const DEFAULT_SPEED_PLAY_SECONDS = 60;

/** +5 speed play reward when opponent timer runs out */
export const SPEED_PLAY_TIMEOUT_BONUS = 5;

// ── ELO ───────────────────────────────────────────────────────────────────────

export const ELO_K_FACTOR = 32;
export const ELO_STARTING_RATING = 1000;

// ── Join Codes ────────────────────────────────────────────────────────────────

export const JOIN_CODE_LENGTH = 6;
