import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { playersRouter } from './routes/players.js';
import { gamesRouter } from './routes/games.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { registerLobbyHandlers, pendingLobbies, activeGames } from './socket/lobbyHandler.js';
import { registerGameHandlers } from './socket/gameHandler.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const CLIENT_ORIGIN = process.env['CLIENT_ORIGIN'] ?? 'http://localhost:5173';

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Debug endpoint — lists open lobbies and active games
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
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`Yantra server listening on port ${PORT}`);
});
