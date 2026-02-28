import { squareKey, buildEmptyBoard, ELO_K_FACTOR, ELO_STARTING_RATING } from '@yantra/shared';
import type {
  GameState,
  GamePlayer,
  Move,
  PlaceMove,
  SwapMove,
  BoardSquare,
  RatingChange,
} from '@yantra/shared';
import {
  generateTilePool,
  shuffle,
  dealTiles,
  refillHand,
  swapTiles,
  handValue,
  removeTilesFromHand,
} from './tileManager.js';
import { validateMove } from './moveValidator.js';
import { calculateScore } from './scorer.js';

export interface MoveResult {
  success: boolean;
  reason?: string;
  updatedState: GameState;
  scoreGained?: number;
  tilesUsed?: number;
}

export interface GameEndResult {
  winnerId: string | null;
  finalScores: { playerId: string; username: string; score: number }[];
  ratingChanges: RatingChange[];
}

// ── Game creation ─────────────────────────────────────────────────────────────

export function createInitialState(
  gameId: string,
  joinCode: string,
  players: { playerId: string; username: string; rating: number }[],
  mode: GameState['mode'],
  speedPlay: boolean,
  speedPlaySeconds: number
): GameState {
  const pool = shuffle(generateTilePool());
  const board = buildEmptyBoard();
  const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const gamePlayers: GamePlayer[] = players.map((p, idx) => ({
    playerId: p.playerId,
    username: p.username,
    seatIndex: idx,
    score: 0,
    hand: [],
    rating: p.rating ?? ELO_STARTING_RATING,
  }));

  // Deal initial hands (mutates pool)
  for (const gp of gamePlayers) {
    gp.hand = dealTiles(pool, 7);
  }

  return {
    gameId,
    joinCode,
    status: 'active',
    mode,
    speedPlay,
    speedPlaySeconds,
    players: gamePlayers,
    currentTurnIndex: 0,
    tilePool: pool,
    board,
    consecutiveSkips: 0,
    createdAt: new Date().toISOString(),
    expiresAt,
    winnerId: null,
  };
}

// ── Apply a move ──────────────────────────────────────────────────────────────

export function applyMove(
  state: GameState,
  playerId: string,
  move: Move
): MoveResult {
  const playerIdx = state.players.findIndex((p) => p.playerId === playerId);
  if (playerIdx === -1) {
    return { success: false, reason: 'Player not in game.', updatedState: state };
  }
  if (playerIdx !== state.currentTurnIndex) {
    return { success: false, reason: 'It is not your turn.', updatedState: state };
  }
  if (state.status !== 'active') {
    return { success: false, reason: 'Game is not active.', updatedState: state };
  }

  // Deep-clone state to avoid mutation
  let newState = deepCloneState(state);
  const player = newState.players[playerIdx];

  switch (move.type) {
    case 'place':
      return applyPlaceMove(newState, player, playerIdx, move);
    case 'swap':
      return applySwapMove(newState, player, playerIdx, move);
    case 'skip':
      return applySkip(newState, player, playerIdx);
    case 'resign':
      return applyResign(newState, player, playerIdx);
    default:
      return { success: false, reason: 'Unknown move type.', updatedState: state };
  }
}

// ── Place move ────────────────────────────────────────────────────────────────

function applyPlaceMove(
  state: GameState,
  player: GamePlayer,
  playerIdx: number,
  move: PlaceMove
): MoveResult {
  const isFirstMove = Object.values(state.board).every((sq) => !sq.placedTile);

  const validation = validateMove(move, state.board, isFirstMove);
  if (!validation.valid) {
    return { success: false, reason: validation.reason, updatedState: state };
  }

  // Verify the player holds all placed tiles
  const placedIds = move.placements.map((p) => p.tile.id);
  const hasAll = placedIds.every((id) => player.hand.some((t) => t.id === id));
  if (!hasAll) {
    return { success: false, reason: 'You do not hold all the placed tiles.', updatedState: state };
  }

  // Calculate score
  const scoreResult = calculateScore(
    move.placements,
    validation.mainSequenceAll!,
    validation.crossSequences!,
    state.board,
    move.placements.length
  );

  // Apply tiles to board
  for (const p of move.placements) {
    const k = squareKey(p.row, p.col);
    state.board[k] = {
      ...state.board[k],
      placedTile: p.tile,
      isLocked: true,
    };
  }

  // Update player score and hand
  player.score += scoreResult.finalScore;
  player.hand = removeTilesFromHand(player.hand, placedIds);
  const poolBefore = state.tilePool.length;
  player.hand = refillHand(player.hand, state.tilePool);
  const tilesUsed = move.placements.length;

  // Reset consecutive skips
  state.consecutiveSkips = 0;

  // Check end conditions
  const handEmpty = player.hand.length === 0;
  const poolEmpty = state.tilePool.length === 0;

  if (handEmpty && poolEmpty) {
    state = finaliseGame(state, player.playerId);
  } else if (handEmpty) {
    // Player used last tile; game ends (pool may still have tiles but player is done)
    state = finaliseGame(state, player.playerId);
  } else {
    state.currentTurnIndex = nextTurnIndex(state);
  }

  return {
    success: true,
    updatedState: state,
    scoreGained: scoreResult.finalScore,
    tilesUsed,
  };
}

// ── Swap move ─────────────────────────────────────────────────────────────────

function applySwapMove(
  state: GameState,
  player: GamePlayer,
  playerIdx: number,
  move: SwapMove
): MoveResult {
  if (state.tilePool.length === 0) {
    return { success: false, reason: 'Cannot swap — tile pool is empty.', updatedState: state };
  }

  const result = swapTiles(player.hand, state.tilePool, move.tileIds);
  if (!result) {
    return { success: false, reason: 'One or more tile IDs not in your hand.', updatedState: state };
  }

  player.hand = result.newHand;
  state.tilePool = result.newPool;
  state.consecutiveSkips = 0; // swap is an active move — reset the pass counter
  state.currentTurnIndex = nextTurnIndex(state);

  const allSkipped =
    state.consecutiveSkips >= state.players.length * 2;
  if (allSkipped) {
    state = finaliseGame(state, null);
  }

  return { success: true, updatedState: state, scoreGained: 0 };
}

// ── Skip ──────────────────────────────────────────────────────────────────────

function applySkip(
  state: GameState,
  player: GamePlayer,
  _playerIdx: number
): MoveResult {
  state.consecutiveSkips++;
  state.currentTurnIndex = nextTurnIndex(state);

  const allSkipped =
    state.consecutiveSkips >= state.players.length * 2;
  if (allSkipped) {
    state = finaliseGame(state, null);
  }

  return { success: true, updatedState: state, scoreGained: 0 };
}

// ── Resign ────────────────────────────────────────────────────────────────────

function applyResign(
  state: GameState,
  player: GamePlayer,
  _playerIdx: number
): MoveResult {
  // Resigning player is eliminated; if only one remains, they win
  player.score = -9999; // effectively removes them
  state = finaliseGame(state, null);
  return { success: true, updatedState: state, scoreGained: 0 };
}

// ── End game ──────────────────────────────────────────────────────────────────

/**
 * Finalise the game.  If `finisherId` is set, that player used their last tile.
 * Otherwise the game ended by mutual passing / resignation.
 */
function finaliseGame(state: GameState, finisherId: string | null): GameState {
  state.status = 'finished';

  if (finisherId) {
    // Finisher gets other players' hand values added; others lose hand values
    let bonus = 0;
    for (const p of state.players) {
      if (p.playerId !== finisherId) {
        const hv = handValue(p.hand);
        p.score -= hv;
        bonus += hv;
      }
    }
    const finisher = state.players.find((p) => p.playerId === finisherId)!;
    finisher.score += bonus;
  } else {
    // All players lose their hand values
    for (const p of state.players) {
      p.score -= handValue(p.hand);
    }
  }

  // Determine winner
  const best = state.players.reduce((a, b) => (b.score > a.score ? b : a));
  const tied = state.players.filter((p) => p.score === best.score);
  state.winnerId = tied.length === 1 ? best.playerId : null;

  return state;
}

// ── ELO ──────────────────────────────────────────────────────────────────────

export function computeRatingChanges(state: GameState): RatingChange[] {
  if (state.mode !== 'ranked') return [];

  const players = state.players;
  const n = players.length;
  const changes: RatingChange[] = players.map((p) => ({
    playerId: p.playerId,
    username: p.username,
    ratingBefore: p.rating,
    ratingAfter: p.rating,
    delta: 0,
  }));

  // Compare each pair
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = players[i];
      const b = players[j];
      const eA = 1 / (1 + 10 ** ((b.rating - a.rating) / 400));
      const eB = 1 - eA;
      let sA: number, sB: number;
      if (a.score > b.score) { sA = 1; sB = 0; }
      else if (b.score > a.score) { sA = 0; sB = 1; }
      else { sA = 0.5; sB = 0.5; }

      changes[i].delta += Math.round(ELO_K_FACTOR * (sA - eA));
      changes[j].delta += Math.round(ELO_K_FACTOR * (sB - eB));
    }
  }

  // Average delta across pairs (for multi-player fairness)
  for (const c of changes) {
    c.delta = Math.round(c.delta / (n - 1));
    c.ratingAfter = c.ratingBefore + c.delta;
  }

  return changes;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextTurnIndex(state: GameState): number {
  return (state.currentTurnIndex + 1) % state.players.length;
}

function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}
