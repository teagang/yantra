import type { Server, Socket } from 'socket.io';
import type { SubmitMovePayload, PreviewMovePayload, RequestStatePayload, PlaceMove } from '@yantra/shared';
import { applyMove, computeRatingChanges } from '../engine/gameStateMachine.js';
import { validateMove } from '../engine/moveValidator.js';
import { calculateScore } from '../engine/scorer.js';
import { updateGame, upsertGamePlayers, recordMove, applyRatingChanges } from '../db/queries.js';
import { activeGames, stripPrivate, joinCodeIndex } from './lobbyHandler.js';
import { submitMoveSchema, previewMoveSchema, requestStateSchema } from './validation.js';

export function registerGameHandlers(io: Server, socket: Socket): void {
  // ── Submit move ──────────────────────────────────────────────────────────
  socket.on('submit:move', async (raw: unknown) => {
    const parsed = submitMoveSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('game:invalidMove', { reason: 'Invalid payload.' });
      return;
    }
    const payload = parsed.data as SubmitMovePayload;
    const entry = activeGames.get(payload.gameId);
    if (!entry) {
      socket.emit('game:invalidMove', { reason: 'Game not found.' });
      return;
    }

    // Verify the socket belongs to the claimed player
    const registeredSocket = entry.playerSockets.get(payload.playerId);
    if (registeredSocket !== socket.id) {
      socket.emit('game:invalidMove', { reason: 'Not authorized for this player.' });
      return;
    }

    const result = applyMove(entry.state, payload.playerId, payload.move);

    if (!result.success) {
      socket.emit('game:invalidMove', { reason: result.reason ?? 'Invalid move.' });
      return;
    }

    // Update in-memory state
    entry.state = result.updatedState;

    // Persist
    try {
      await updateGame(entry.state);
      await upsertGamePlayers(entry.state);
      await recordMove(
        payload.gameId,
        payload.playerId,
        payload.move.type,
        payload.move.type === 'place' ? (payload.move as PlaceMove).placements : null,
        result.scoreGained ?? 0
      );
    } catch (err) {
      console.error('DB error persisting move:', err);
    }

    // Find the player who just moved
    const player = entry.state.players.find((p) => p.playerId === payload.playerId);

    // Broadcast move result to all players in the room
    io.to(payload.gameId).emit('game:moveResult', {
      playerId: payload.playerId,
      username: player?.username ?? '',
      moveType: payload.move.type,
      newScore: player?.score ?? 0,
    });

    // Broadcast updated public state (no hands, no pool)
    const publicState = stripPrivate(entry.state, '');
    io.to(payload.gameId).emit('game:stateUpdate', { state: publicState });

    // Send private hand update to the player who just moved
    if (player) {
      const sid = entry.playerSockets.get(payload.playerId);
      if (sid) {
        io.to(sid).emit('game:handUpdate', {
          hand: player.hand,
          tilesRemaining: entry.state.tilePool.length,
        });
      }
    }

    // Handle game finish
    if (entry.state.status === 'finished') {
      const ratingChanges = computeRatingChanges(entry.state);

      // Persist rating changes
      try {
        if (ratingChanges.length > 0) {
          await applyRatingChanges(ratingChanges, payload.gameId);
        }
      } catch (err) {
        console.error('DB error applying ratings:', err);
      }

      io.to(payload.gameId).emit('game:finished', {
        finalScores: entry.state.players.map((p) => ({
          playerId: p.playerId,
          username: p.username,
          score: p.score,
        })),
        winnerId: entry.state.winnerId,
        ratingChanges,
      });

      // Clean up join code index
      joinCodeIndex.delete(entry.state.joinCode);
      activeGames.delete(payload.gameId);
    }
  });

  // ── Preview move ─────────────────────────────────────────────────────────
  socket.on('preview:move', (raw: unknown) => {
    const parsed = previewMoveSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('preview:result', { isValid: false, reason: 'Invalid payload.' });
      return;
    }
    const payload = parsed.data as PreviewMovePayload;
    const entry = activeGames.get(payload.gameId);
    if (!entry) {
      socket.emit('preview:result', { isValid: false, reason: 'Game not found.' });
      return;
    }

    // Verify this socket belongs to a player in the game
    const isPlayer = [...entry.playerSockets.values()].includes(socket.id);
    if (!isPlayer) {
      socket.emit('preview:result', { isValid: false, reason: 'Not authorized.' });
      return;
    }

    const isFirstMove = Object.values(entry.state.board).every((sq) => !sq.placedTile);
    const fakeMove: PlaceMove = { type: 'place', placements: payload.placements };
    const validation = validateMove(fakeMove, entry.state.board, isFirstMove);

    if (!validation.valid) {
      socket.emit('preview:result', { isValid: false, reason: validation.reason });
      return;
    }

    const scoreResult = calculateScore(
      payload.placements,
      validation.mainSequenceAll!,
      validation.crossSequences!,
      entry.state.board,
      payload.placements.length
    );

    socket.emit('preview:result', { isValid: true, scoreResult });
  });

  // ── Request full state (reconnect) ───────────────────────────────────────
  socket.on('request:state', (raw: unknown) => {
    const parsed = requestStateSchema.safeParse(raw);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid payload.' });
      return;
    }
    const payload = parsed.data as RequestStatePayload;
    const entry = activeGames.get(payload.gameId);
    if (!entry) {
      socket.emit('error', { message: 'Game not found.' });
      return;
    }

    const player = entry.state.players.find((p) => p.playerId === payload.playerId);
    if (!player) {
      socket.emit('error', { message: 'Player not in game.' });
      return;
    }

    // Only allow reconnect if this socket is already registered OR the
    // player's previous socket has disconnected (no longer in the map).
    const existingSocket = entry.playerSockets.get(payload.playerId);
    if (existingSocket && existingSocket !== socket.id) {
      socket.emit('error', { message: 'Another session is active for this player.' });
      return;
    }

    // Re-register socket mapping
    entry.playerSockets.set(payload.playerId, socket.id);
    socket.join(payload.gameId);

    const publicState = stripPrivate(entry.state, payload.playerId);
    socket.emit('game:stateUpdate', { state: publicState });
    socket.emit('game:handUpdate', {
      hand: player.hand,
      tilesRemaining: entry.state.tilePool.length,
    });
  });
}
