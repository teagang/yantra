import { create } from 'zustand';
import type {
  GameState,
  Tile,
  TilePlacement,
  ScoreResult,
  RatingChange,
} from '@yantra/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppScreen =
  | 'menu'
  | 'lobby'
  | 'game'
  | 'stats'
  | 'rules';

export interface PopupState {
  type: 'win' | 'loss' | 'draw' | 'invalid' | 'speed-bonus' | null;
  newRating?: number;
  bonusPoints?: number;
  reason?: string;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface GameStore {
  // Player identity
  username: string;
  playerId: string;
  setIdentity: (username: string, playerId: string) => void;

  // Lobby
  gameId: string;
  joinCode: string;
  lobbyPlayers: { username: string; seatIndex: number }[];
  setLobby: (gameId: string, joinCode: string) => void;
  setLobbyPlayers: (players: { username: string; seatIndex: number }[]) => void;

  // In-game state (public, from server)
  gameState: (Omit<GameState, 'tilePool'> & { tilesRemaining: number }) | null;
  setGameState: (state: (Omit<GameState, 'tilePool'> & { tilesRemaining: number }) | null) => void;

  // Private hand
  hand: Tile[];
  tilesRemaining: number;
  setHand: (hand: Tile[], tilesRemaining: number) => void;

  // Pending placements (tiles placed on board but not yet submitted)
  pendingPlacements: TilePlacement[];
  addPendingPlacement: (p: TilePlacement) => void;
  removePendingPlacement: (tileId: string) => void;
  clearPendingPlacements: () => void;

  // Live score preview
  previewScore: ScoreResult | null;
  previewValid: boolean;
  previewReason: string;
  setPreview: (score: ScoreResult | null, valid: boolean, reason?: string) => void;

  // Swap mode
  swapMode: boolean;
  selectedForSwap: string[]; // tile ids
  setSwapMode: (on: boolean) => void;
  toggleSwapSelection: (tileId: string) => void;

  // Speed play
  speedPlaySecondsLeft: number;
  setSpeedPlayTick: (seconds: number) => void;

  // Popups
  popup: PopupState;
  setPopup: (p: PopupState) => void;
  dismissPopup: () => void;

  // Final results
  finalScores: { playerId: string; username: string; score: number }[];
  ratingChanges: RatingChange[];
  setGameFinished: (
    scores: { playerId: string; username: string; score: number }[],
    changes: RatingChange[]
  ) => void;

  // Reset everything
  reset: () => void;
}

// ── Initial values ────────────────────────────────────────────────────────────

const initial = {
  username: '',
  playerId: '',
  gameId: '',
  joinCode: '',
  lobbyPlayers: [] as { username: string; seatIndex: number }[],
  gameState: null,
  hand: [] as Tile[],
  tilesRemaining: 0,
  pendingPlacements: [] as TilePlacement[],
  previewScore: null,
  previewValid: false,
  previewReason: '',
  swapMode: false,
  selectedForSwap: [] as string[],
  speedPlaySecondsLeft: 60,
  popup: { type: null } as PopupState,
  finalScores: [] as { playerId: string; username: string; score: number }[],
  ratingChanges: [] as RatingChange[],
};

// ── Create store ──────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,

  setIdentity: (username, playerId) => set({ username, playerId }),
  setLobby: (gameId, joinCode) => set({ gameId, joinCode }),
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),

  setGameState: (gameState) => set({ gameState }),

  setHand: (hand, tilesRemaining) => set({ hand, tilesRemaining }),

  addPendingPlacement: (p) =>
    set((s) => ({ pendingPlacements: [...s.pendingPlacements, p] })),
  removePendingPlacement: (tileId) =>
    set((s) => ({
      pendingPlacements: s.pendingPlacements.filter((pp) => pp.tile.id !== tileId),
    })),
  clearPendingPlacements: () => set({ pendingPlacements: [], previewScore: null, previewValid: false, previewReason: '' }),

  setPreview: (previewScore, previewValid, previewReason = '') =>
    set({ previewScore, previewValid, previewReason }),

  setSwapMode: (swapMode) => set({ swapMode, selectedForSwap: [] }),
  toggleSwapSelection: (tileId) =>
    set((s) => ({
      selectedForSwap: s.selectedForSwap.includes(tileId)
        ? s.selectedForSwap.filter((id) => id !== tileId)
        : [...s.selectedForSwap, tileId],
    })),

  setSpeedPlayTick: (seconds) => set({ speedPlaySecondsLeft: seconds }),

  setPopup: (popup) => set({ popup }),
  dismissPopup: () => set({ popup: { type: null } }),

  setGameFinished: (finalScores, ratingChanges) =>
    set({ finalScores, ratingChanges }),

  reset: () => set({ ...initial }),
}));
