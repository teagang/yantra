import {
  COLOURS,
  TILE_DISTRIBUTION,
  BLANK_COUNT,
  EIGHT_COUNT,
  HAND_SIZE,
} from '@yantra/shared';
import type { Tile, TileColour } from '@yantra/shared';

// ── Pool generation ───────────────────────────────────────────────────────────

export function generateTilePool(): Tile[] {
  const tiles: Tile[] = [];

  // Coloured tiles
  for (const colour of COLOURS) {
    for (const [valueStr, count] of Object.entries(TILE_DISTRIBUTION)) {
      const value = Number(valueStr);
      for (let i = 0; i < count; i++) {
        tiles.push({
          id: `${colour}-${value}-${i}`,
          colour,
          value,
          isBlank: false,
          isEight: false,
        });
      }
    }
  }

  // Blank tiles
  for (let i = 0; i < BLANK_COUNT; i++) {
    tiles.push({
      id: `blank-${i}`,
      colour: null,
      value: 0,
      isBlank: true,
      isEight: false,
    });
  }

  // Eight tiles
  for (let i = 0; i < EIGHT_COUNT; i++) {
    tiles.push({
      id: `eight-${i}`,
      colour: null,
      value: 8,
      isBlank: false,
      isEight: true,
    });
  }

  return tiles;
}

// ── Fisher-Yates shuffle ──────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Hand management ───────────────────────────────────────────────────────────

/**
 * Deal `count` tiles from the pool.  Mutates the pool array in-place.
 * Returns the dealt tiles.
 */
export function dealTiles(pool: Tile[], count: number): Tile[] {
  const dealt: Tile[] = [];
  const actual = Math.min(count, pool.length);
  for (let i = 0; i < actual; i++) {
    dealt.push(pool.pop()!);
  }
  return dealt;
}

/**
 * Refill a player's hand up to HAND_SIZE from the pool.
 * Mutates pool in-place; returns the new hand.
 */
export function refillHand(hand: Tile[], pool: Tile[]): Tile[] {
  const needed = HAND_SIZE - hand.length;
  if (needed <= 0 || pool.length === 0) return hand;
  const newTiles = dealTiles(pool, needed);
  return [...hand, ...newTiles];
}

/**
 * Swap tiles: remove specified tiles from hand, return them to pool (reshuffled),
 * then deal the same number back.  Player misses their scoring turn.
 *
 * Returns { newHand, newPool } or null if not enough tiles remain.
 */
export function swapTiles(
  hand: Tile[],
  pool: Tile[],
  tileIds: string[]
): { newHand: Tile[]; newPool: Tile[] } | null {
  const toSwap = hand.filter((t) => tileIds.includes(t.id));
  if (toSwap.length !== tileIds.length) return null; // invalid ids

  const remaining = hand.filter((t) => !tileIds.includes(t.id));
  const newPool = shuffle([...pool, ...toSwap]);
  const dealt = dealTiles(newPool, toSwap.length);
  return {
    newHand: [...remaining, ...dealt],
    newPool,
  };
}

/**
 * Remove specific tiles from a hand by id.
 */
export function removeTilesFromHand(hand: Tile[], tileIds: string[]): Tile[] {
  return hand.filter((t) => !tileIds.includes(t.id));
}

/**
 * Sum of face values of tiles in a hand (used for end-game score adjustment).
 */
export function handValue(hand: Tile[]): number {
  return hand.reduce((sum, t) => {
    if (t.isBlank) return sum;
    return sum + t.value;
  }, 0);
}
