import { Router } from 'express';
import { getGameByJoinCode, getGameById } from '../db/queries.js';
import { activeGames } from '../socket/lobbyHandler.js';

export const gamesRouter = Router();

// GET /api/games/:joinCode — check game exists (pre-join check)
gamesRouter.get('/join/:joinCode', async (req, res) => {
  try {
    const game = await getGameByJoinCode(req.params['joinCode']!.toUpperCase());
    if (!game) {
      res.status(404).json({ error: 'Game not found.' });
      return;
    }
    res.json({ gameId: game.id, status: game.status, mode: game.mode });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/games/:gameId/state — full state (for reconnect / async check)
gamesRouter.get('/:gameId/state', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check in-memory first (live game)
    const live = activeGames.get(gameId!);
    if (live) {
      const { tilePool, ...pub } = live.state;
      res.json({ ...pub, tilesRemaining: tilePool.length });
      return;
    }

    // Fallback to DB
    const game = await getGameById(gameId!);
    if (!game) {
      res.status(404).json({ error: 'Game not found.' });
      return;
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
