import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { getSocket } from './useSocket.js';
import type { Tile, TilePlacement } from '@yantra/shared';

/**
 * Main game action hook — exposes callable actions that emit socket events.
 */
export function useGame() {
  const store = useGameStore();
  const socket = getSocket();

  const submitMove = useCallback(() => {
    if (store.pendingPlacements.length === 0) return;
    socket.emit('submit:move', {
      gameId: store.gameId,
      playerId: store.playerId,
      move: { type: 'place', placements: store.pendingPlacements },
    });
  }, [store.pendingPlacements, store.gameId, store.playerId]);

  const skipTurn = useCallback(() => {
    socket.emit('submit:move', {
      gameId: store.gameId,
      playerId: store.playerId,
      move: { type: 'skip' },
    });
  }, [store.gameId, store.playerId]);

  const swapTiles = useCallback(() => {
    if (store.selectedForSwap.length === 0) return;
    socket.emit('submit:move', {
      gameId: store.gameId,
      playerId: store.playerId,
      move: { type: 'swap', tileIds: store.selectedForSwap },
    });
    store.setSwapMode(false);
  }, [store.gameId, store.playerId, store.selectedForSwap]);

  const resign = useCallback(() => {
    socket.emit('submit:move', {
      gameId: store.gameId,
      playerId: store.playerId,
      move: { type: 'resign' },
    });
  }, [store.gameId, store.playerId]);

  const placeTile = useCallback(
    (tile: Tile, row: number, col: number) => {
      // Move tile from hand to pending placements
      const placement: TilePlacement = { tile, row, col };
      store.addPendingPlacement(placement);

      // Ask server for live score preview
      const allPlacements = [...store.pendingPlacements, placement];
      socket.emit('preview:move', {
        gameId: store.gameId,
        placements: allPlacements,
      });

      // Listen to preview result once
      socket.once('preview:result', (data: { isValid: boolean; scoreResult?: import('@yantra/shared').ScoreResult; reason?: string }) => {
        store.setPreview(data.scoreResult ?? null, data.isValid, data.reason);
      });
    },
    [store, socket]
  );

  const recallTile = useCallback(
    (tileId: string) => {
      store.removePendingPlacement(tileId);
      const remaining = store.pendingPlacements.filter((p) => p.tile.id !== tileId);
      if (remaining.length === 0) {
        store.setPreview(null, false, '');
      } else {
        socket.emit('preview:move', { gameId: store.gameId, placements: remaining });
        socket.once('preview:result', (data: { isValid: boolean; scoreResult?: import('@yantra/shared').ScoreResult; reason?: string }) => {
          store.setPreview(data.scoreResult ?? null, data.isValid, data.reason);
        });
      }
    },
    [store, socket]
  );

  const undoAll = useCallback(() => {
    store.clearPendingPlacements();
  }, [store]);

  const isMyTurn = useCallback(() => {
    if (!store.gameState) return false;
    const currentPlayer = store.gameState.players[store.gameState.currentTurnIndex];
    return currentPlayer?.playerId === store.playerId;
  }, [store.gameState, store.playerId]);

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
