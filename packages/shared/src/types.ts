// ── Tile ────────────────────────────────────────────────────────────────────

export type TileColour = 'red' | 'blue' | 'yellow' | 'purple';

export interface Tile {
  id: string;               // unique, e.g. "red-1-0" (colour-value-index)
  colour: TileColour | null; // null for blank/eight
  value: number;             // 1-7 for coloured; 8 for eight; 0 for blank
  isBlank: boolean;
  isEight: boolean;
  // Set when a blank is played
  assignedValue?: number;
  assignedColour?: TileColour;
}

// ── Board ────────────────────────────────────────────────────────────────────

export type SquareType =
  | 'normal'
  | 'star'          // center; doubles entire sequence value (first play only)
  | 'double-tile'   // 2× this tile's value
  | 'triple-tile'   // 3× this tile's value
  | 'double-seq'    // 2× sequence total
  | 'triple-seq';   // 3× sequence total

export interface BoardSquare {
  row: number;
  col: number;
  type: SquareType;
  placedTile?: Tile;
  isLocked: boolean; // true once a tile has been placed
}

export type BoardState = Map<string, BoardSquare>; // key = "row,col"

// ── Players ──────────────────────────────────────────────────────────────────

export type GameMode = 'ranked' | 'unranked' | 'local';
export type GameStatus = 'waiting' | 'active' | 'finished';
export type MoveType = 'place' | 'skip' | 'swap' | 'resign';

export interface Player {
  id: string;
  username: string;
  rating: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface GamePlayer {
  playerId: string;
  username: string;
  seatIndex: number;
  score: number;
  hand: Tile[];
  rating: number;
}

// ── Moves ────────────────────────────────────────────────────────────────────

export interface TilePlacement {
  tile: Tile;
  row: number;
  col: number;
}

export interface PlaceMove {
  type: 'place';
  placements: TilePlacement[];
}

export interface SwapMove {
  type: 'swap';
  tileIds: string[]; // tiles from hand to return to pool
}

export interface SkipMove {
  type: 'skip';
}

export interface ResignMove {
  type: 'resign';
}

export type Move = PlaceMove | SwapMove | SkipMove | ResignMove;

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface SequenceScore {
  tiles: TilePlacement[];
  tileAdjustedSum: number;  // sum after applying tile multipliers
  seqMultiplier: number;    // product of all sequence multipliers hit
  sequenceScore: number;    // tileAdjustedSum × seqMultiplier
}

export interface ScoreResult {
  sequences: SequenceScore[];
  subtotal: number;          // sum of all sequence scores
  bonusAllSeven: number;     // +20 if all 7 tiles used
  bonusSevenSeq: number;     // +20 if all 7 tiles are a numerical sequence
  finalScore: number;        // subtotal + bonuses
}

// ── Game State ────────────────────────────────────────────────────────────────

export interface GameState {
  gameId: string;
  joinCode: string;
  status: GameStatus;
  mode: GameMode;
  speedPlay: boolean;
  speedPlaySeconds: number;
  players: GamePlayer[];
  currentTurnIndex: number;
  tilePool: Tile[];
  board: Record<string, BoardSquare>; // serialisable version (not a Map)
  consecutiveSkips: number;
  createdAt: string;
  expiresAt: string | null;
  winnerId: string | null;
}

// ── Socket Events ─────────────────────────────────────────────────────────────

// Client → Server payloads
export interface CreateGamePayload {
  username: string;
  mode: GameMode;
  speedPlay: boolean;
  speedPlaySeconds?: number;
  maxPlayers?: number;
}

export interface JoinGamePayload {
  username: string;
  joinCode: string;
}

export interface StartGamePayload {
  gameId: string;
}

export interface SubmitMovePayload {
  gameId: string;
  playerId: string;
  move: Move;
}

export interface PreviewMovePayload {
  gameId: string;
  placements: TilePlacement[];
}

export interface RequestStatePayload {
  gameId: string;
  playerId: string;
}

// Server → Client payloads
export interface GameCreatedPayload {
  gameId: string;
  joinCode: string;
  playerId: string;
}

export interface GameJoinedPayload {
  gameId: string;
  playerId: string;
  players: { username: string; seatIndex: number }[];
}

export interface GameStartedPayload {
  state: GameState;
  yourHand: Tile[];
}

export interface GameStateUpdatePayload {
  state: Omit<GameState, 'tilePool'>; // pool stays server-side
}

export interface GameHandUpdatePayload {
  hand: Tile[];
  tilesRemaining: number;
}

export interface GameMoveResultPayload {
  playerId: string;
  username: string;
  moveType: MoveType;
  scoreResult?: ScoreResult;
  newScore: number;
}

export interface GameInvalidMovePayload {
  reason: string;
}

export interface GameSpeedPlayTickPayload {
  playerId: string;
  secondsLeft: number;
}

export interface RatingChange {
  playerId: string;
  username: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
}

export interface GameFinishedPayload {
  finalScores: { playerId: string; username: string; score: number }[];
  winnerId: string | null;
  ratingChanges: RatingChange[];
}

export interface PreviewResultPayload {
  scoreResult: ScoreResult;
  isValid: boolean;
  reason?: string;
}
