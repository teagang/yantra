import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { getSocket } from './useSocket.js';
import type { Tile, TilePlacement, ScoreResult } from '@yantra/shared';

/**
 * Send a preview request and handle the response.
 * Removes any previously pending preview listener before registering a new one.
 */
function requestPreview(placements: TilePlacement[]) {
  const socket = getSocket();
  const { gameId } = useGameStore.getState();

  // Remove any stale listener before adding a new one
  socket.off('preview:result');

  if (placements.length === 0) {
    useGameStore.getState().setPreview(null, false, '');
    return;
  }

  socket.emit('preview:move', { gameId, placements });
  socket.once('preview:result', (data: { isValid: boolean; scoreResult?: ScoreResult; reason?: string }) => {
    useGameStore.getState().setPreview(data.scoreResult ?? null, data.isValid, data.reason);
  });
}

/**
 * Main game action hook — exposes callable actions that emit socket events.
 */
export function useGame() {
  const store = useGameStore();
  const socket = getSocket();

  const submitMove = useCallback(() => {
    const { pendingPlacements, gameId, playerId } = useGameStore.getState();
    if (pendingPlacements.length === 0) return;
    socket.emit('submit:move', {
      gameId,
      playerId,
      move: { type: 'place', placements: pendingPlacements },
    });
  }, [socket]);

  const skipTurn = useCallback(() => {
    const { gameId, playerId } = useGameStore.getState();
    socket.emit('submit:move', {
      gameId,
      playerId,
      move: { type: 'skip' },
    });
  }, [socket]);

  const swapTiles = useCallback(() => {
    const { selectedForSwap, gameId, playerId, setSwapMode } = useGameStore.getState();
    if (selectedForSwap.length === 0) return;
    socket.emit('submit:move', {
      gameId,
      playerId,
      move: { type: 'swap', tileIds: selectedForSwap },
    });
    setSwapMode(false);
  }, [socket]);

  const resign = useCallback(() => {
    const { gameId, playerId } = useGameStore.getState();
    socket.emit('submit:move', {
      gameId,
      playerId,
      move: { type: 'resign' },
    });
  }, [socket]);

  const placeTile = useCallback(
    (tile: Tile, row: number, col: number) => {
      const placement: TilePlacement = { tile, row, col };
      useGameStore.getState().addPendingPlacement(placement);

      // Read fresh state after the update
      const allPlacements = useGameStore.getState().pendingPlacements;
      requestPreview(allPlacements);
    },
    [socket]
  );

  const recallTile = useCallback(
    (tileId: string) => {
      useGameStore.getState().removePendingPlacement(tileId);

      // Read fresh state after the update
      const remaining = useGameStore.getState().pendingPlacements;
      requestPreview(remaining);
    },
    [socket]
  );

  const undoAll = useCallback(() => {
    useGameStore.getState().clearPendingPlacements();
    requestPreview([]);
  }, []);

  const isMyTurn = useCallback(() => {
    const { gameState, playerId } = useGameStore.getState();
    if (!gameState) return false;
    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    return currentPlayer?.playerId === playerId;
  }, []);

  return {
    submitMove,
    skipTurn,
    swapTiles,
    resign,
    placeTile,
    recallTile,
    undoAll,
    isMyTurn,
  };
}
