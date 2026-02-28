import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import { customAlphabet } from 'nanoid';
import { createInitialState } from '../engine/gameStateMachine.js';
import { createGame, upsertGamePlayers, upsertPlayer, getGameByJoinCode } from '../db/queries.js';
import type { GameState } from '@yantra/shared';
import type { CreateGamePayload, JoinGamePayload, StartGamePayload } from '@yantra/shared';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

// In-memory lobby: gameId → { state, playerSockets }
export const activeGames = new Map<
  string,
  { state: GameState; playerSockets: Map<string, string> } // socketId → playerId
>();

// joinCode → gameId
export const joinCodeIndex = new Map<string, string>();

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  // ── Create game ──────────────────────────────────────────────────────────
  socket.on('create:game', async (payload: CreateGamePayload) => {
    try {
      const player = await upsertPlayer(payload.username);
      const joinCode = nanoid();
      const gameId = randomUUID();

      const lobby = {
        state: null as unknown as GameState,
        playerSockets: new Map<string, string>([[socket.id, player.id]]),
        pendingPlayers: [{ playerId: player.id, username: player.username, rating: player.rating }],
        mode: payload.mode,
        speedPlay: payload.speedPlay,
        speedPlaySeconds: payload.speedPlaySeconds ?? 60,
        maxPlayers: payload.maxPlayers ?? 4,
      };

      // Store pre-game lobby info temporarily
      (socket as any)._lobby = { gameId, joinCode, ...lobby };
      activeGames.set(gameId, { state: null as unknown as GameState, playerSockets: lobby.playerSockets });
      joinCodeIndex.set(joinCode, gameId);

      // Keep the richer lobby object in a separate store
      pendingLobbies.set(gameId, {
        gameId,
        joinCode,
        mode: payload.mode,
        speedPlay: payload.speedPlay,
        speedPlaySeconds: payload.speedPlaySeconds ?? 60,
        maxPlayers: payload.maxPlayers ?? 4,
        players: [{ playerId: player.id, username: player.username, rating: player.rating }],
        socketIds: new Map([[player.id, socket.id]]),
      });

      socket.join(gameId);

      socket.emit('game:created', {
        gameId,
        joinCode,
        playerId: player.id,
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  // ── Join game ────────────────────────────────────────────────────────────
  socket.on('join:game', async (payload: JoinGamePayload) => {
    try {
      const gameId = joinCodeIndex.get(payload.joinCode.toUpperCase());
      if (!gameId) {
        socket.emit('error', { message: 'Game not found.' });
        return;
      }

      const lobby = pendingLobbies.get(gameId);
      if (!lobby) {
        socket.emit('error', { message: 'Game has already started.' });
        return;
      }

      if (lobby.players.length >= lobby.maxPlayers) {
        socket.emit('error', { message: 'Game is full.' });
        return;
      }

      const player = await upsertPlayer(payload.username);

      // Prevent duplicate joins
      if (lobby.players.some((p) => p.playerId === player.id)) {
        socket.emit('error', { message: 'Already in this game.' });
        return;
      }

      lobby.players.push({ playerId: player.id, username: player.username, rating: player.rating });
      lobby.socketIds.set(player.id, socket.id);

      socket.join(gameId);

      socket.emit('game:joined', {
        gameId,
        joinCode: lobby.joinCode,
        playerId: player.id,
        players: lobby.players.map((p) => ({ username: p.username, seatIndex: lobby.players.indexOf(p) })),
      });

      // Notify others in room
      socket.to(gameId).emit('lobby:playerJoined', {
        username: player.username,
        players: lobby.players.map((p) => ({ username: p.username, seatIndex: lobby.players.indexOf(p) })),
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  // ── Start game ───────────────────────────────────────────────────────────
  socket.on('start:game', async (payload: StartGamePayload) => {
    try {
      const lobby = pendingLobbies.get(payload.gameId);
      if (!lobby) {
        socket.emit('error', { message: 'Lobby not found.' });
        return;
      }

      if (lobby.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start.' });
        return;
      }

      const state = createInitialState(
        lobby.gameId,
        lobby.joinCode,
        lobby.players,
        lobby.mode,
        lobby.speedPlay,
        lobby.speedPlaySeconds
      );

      // Persist to DB
      await createGame(state);
      await upsertGamePlayers(state);

      // Move to active games
      activeGames.set(lobby.gameId, { state, playerSockets: lobby.socketIds });
      pendingLobbies.delete(lobby.gameId);

      // Broadcast game started — each player gets their private hand
      for (const gp of state.players) {
        const sid = lobby.socketIds.get(gp.playerId);
        if (sid) {
          const publicState = stripPrivate(state, gp.playerId);
          io.to(sid).emit('game:started', {
            state: publicState,
            yourHand: gp.hand,
          });
        }
      }
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });
}

// ── Pending lobbies (pre-start) ───────────────────────────────────────────────

interface LobbyEntry {
  gameId: string;
  joinCode: string;
  mode: GameState['mode'];
  speedPlay: boolean;
  speedPlaySeconds: number;
  maxPlayers: number;
  players: { playerId: string; username: string; rating: number }[];
  socketIds: Map<string, string>; // playerId → socketId
}

export const pendingLobbies = new Map<string, LobbyEntry>();

// ── Utility ───────────────────────────────────────────────────────────────────

/** Remove the tile pool and other players' hands before sending to a client */
export function stripPrivate(
  state: GameState,
  _forPlayerId: string
): Omit<GameState, 'tilePool'> & { tilesRemaining: number } {
  const { tilePool, ...rest } = state;
  return {
    ...rest,
    players: rest.players.map((p) => ({ ...p, hand: [] })), // strip hands
    tilesRemaining: tilePool.length,
  } as Omit<GameState, 'tilePool'> & { tilesRemaining: number };
}
