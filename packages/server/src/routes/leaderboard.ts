import { Router } from 'express';
import { getLeaderboard } from '../db/queries.js';

export const leaderboardRouter = Router();

// GET /api/leaderboard — top players by rating
leaderboardRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string ?? '20', 10), 100);
    const board = await getLeaderboard(limit);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
