import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { playersRouter } from './routes/players.js';
import { gamesRouter } from './routes/games.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { registerLobbyHandlers, pendingLobbies, activeGames, joinCodeIndex } from './socket/lobbyHandler.js';
import { registerGameHandlers } from './socket/gameHandler.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const CLIENT_ORIGIN = process.env['CLIENT_ORIGIN'] ?? 'http://localhost:5173';

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Rate limit API routes: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Debug endpoint — lists open lobbies and active games (dev only)
if (process.env['NODE_ENV'] !== 'production') {
  app.get('/debug/lobbies', (_req, res) => {
    res.json({
      pending: [...pendingLobbies.values()].map((l) => ({
        joinCode: l.joinCode,
        players: l.players.map((p) => p.username),
        mode: l.mode,
      })),
      active: [...activeGames.keys()],
    });
  });
}

// ── Socket.io ─────────────────────────────────────────────────────────────────

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  registerLobbyHandlers(io, socket);
  registerGameHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    // Clean up pending lobbies — remove player from any lobby they were in
    for (const [gameId, lobby] of pendingLobbies) {
      let removedPlayer: string | null = null;
      for (const [playerId, sid] of lobby.socketIds) {
        if (sid === socket.id) {
          removedPlayer = playerId;
          lobby.socketIds.delete(playerId);
          break;
        }
      }
      if (removedPlayer) {
        lobby.players = lobby.players.filter((p) => p.playerId !== removedPlayer);
        if (lobby.players.length === 0) {
          // Empty lobby — clean up entirely
          pendingLobbies.delete(gameId);
          joinCodeIndex.delete(lobby.joinCode);
          activeGames.delete(gameId);
        } else {
          // Notify remaining players
          io.to(gameId).emit('lobby:playerJoined', {
            players: lobby.players.map((p) => ({
              username: p.username,
              seatIndex: lobby.players.indexOf(p),
            })),
          });
        }
      }
    }

    // Update active games — remove disconnected socket mapping
    for (const [_gameId, entry] of activeGames) {
      for (const [playerId, sid] of entry.playerSockets) {
        if (sid === socket.id) {
          entry.playerSockets.delete(playerId);
          break;
        }
      }
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`Yantra server listening on port ${PORT}`);
});
