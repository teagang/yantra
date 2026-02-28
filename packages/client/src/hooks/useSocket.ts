import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore.js';
import type { GameState, Tile, RatingChange } from '@yantra/shared';

const SERVER_URL = import.meta.env['VITE_SERVER_URL'] ?? 'http://localhost:3001';

let socketInstance: Socket | null = null;

/** Shared socket singleton. */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, { autoConnect: false });
  }
  return socketInstance;
}

/**
 * Wire up all server→client events. Call this ONCE, at the App root.
 * Uses specific handler references so cleanup never clobbers other listeners.
 * Reads fresh state from the Zustand store inside handlers to avoid stale closures.
 */
export function useSocketEvents() {
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    // ── Lobby ─────────────────────────────────────────────────────────────────

    function onCreated(data: { gameId: string; joinCode: string; playerId: string }) {
      const { username } = useGameStore.getState();
      useGameStore.getState().setIdentity(username, data.playerId);
      useGameStore.getState().setLobby(data.gameId, data.joinCode);
      useGameStore.getState().setLobbyPlayers([{ username, seatIndex: 0 }]);
    }

    function onJoined(data: { gameId: string; joinCode: string; playerId: string; players: { username: string; seatIndex: number }[] }) {
      useGameStore.getState().setIdentity(useGameStore.getState().username, data.playerId);
      useGameStore.getState().setLobby(data.gameId, data.joinCode);
      useGameStore.getState().setLobbyPlayers(data.players);
    }

    function onLobbyPlayerJoined(data: { players: { username: string; seatIndex: number }[] }) {
      useGameStore.getState().setLobbyPlayers(data.players);
    }

    // ── Game ──────────────────────────────────────────────────────────────────

    function onStarted(data: { state: Omit<GameState, 'tilePool'> & { tilesRemaining: number }; yourHand: Tile[] }) {
      useGameStore.getState().setGameState(data.state);
      useGameStore.getState().setHand(data.yourHand, (data.state as any)?.tilesRemaining ?? 0);
    }

    function onStateUpdate(data: { state: Omit<GameState, 'tilePool'> & { tilesRemaining: number } }) {
      useGameStore.getState().setGameState(data.state);
    }

    function onHandUpdate(data: { hand: Tile[]; tilesRemaining: number }) {
      useGameStore.getState().setHand(data.hand, data.tilesRemaining);
      useGameStore.getState().clearPendingPlacements();
    }

    function onInvalidMove(data: { reason: string }) {
      useGameStore.getState().setPopup({ type: 'invalid', reason: data.reason });
    }

    function onSpeedPlayTick(data: { secondsLeft: number }) {
      useGameStore.getState().setSpeedPlayTick(data.secondsLeft);
    }

    function onFinished(data: {
      finalScores: { playerId: string; username: string; score: number }[];
      winnerId: string | null;
      ratingChanges: RatingChange[];
    }) {
      const { playerId, setGameFinished, setPopup } = useGameStore.getState();
      setGameFinished(data.finalScores, data.ratingChanges);
      const me = data.finalScores.find((s) => s.playerId === playerId);
      if (!me) return;
      const myRating = data.ratingChanges.find((r) => r.playerId === playerId);
      if (data.winnerId === playerId) {
        setPopup({ type: 'win', newRating: myRating?.ratingAfter });
      } else if (data.winnerId === null) {
        setPopup({ type: 'draw', newRating: myRating?.ratingAfter });
      } else {
        setPopup({ type: 'loss', newRating: myRating?.ratingAfter });
      }
    }

    function onError(data: { message: string }) {
      console.error('Server error:', data.message);
    }

    socket.on('game:created', onCreated);
    socket.on('game:joined', onJoined);
    socket.on('lobby:playerJoined', onLobbyPlayerJoined);
    socket.on('game:started', onStarted);
    socket.on('game:stateUpdate', onStateUpdate);
    socket.on('game:handUpdate', onHandUpdate);
    socket.on('game:invalidMove', onInvalidMove);
    socket.on('game:speedPlayTick', onSpeedPlayTick);
    socket.on('game:finished', onFinished);
    socket.on('error', onError);

    return () => {
      // Use specific references — never wipes other components' handlers
      socket.off('game:created', onCreated);
      socket.off('game:joined', onJoined);
      socket.off('lobby:playerJoined', onLobbyPlayerJoined);
      socket.off('game:started', onStarted);
      socket.off('game:stateUpdate', onStateUpdate);
      socket.off('game:handUpdate', onHandUpdate);
      socket.off('game:invalidMove', onInvalidMove);
      socket.off('game:speedPlayTick', onSpeedPlayTick);
      socket.off('game:finished', onFinished);
      socket.off('error', onError);
    };
  }, []); // runs once for the lifetime of the app
}

/** Convenience hook that just returns the socket (no event setup). */
export function useSocket(): Socket {
  return getSocket();
}
