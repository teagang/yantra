import { Router } from 'express';
import { z } from 'zod';
import {
  upsertPlayer,
  getPlayerByUsername,
  getPlayerHistory,
} from '../db/queries.js';

export const playersRouter = Router();

// POST /api/players — create or retrieve a player by username
playersRouter.post('/', async (req, res) => {
  const schema = z.object({ username: z.string().min(2).max(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const player = await upsertPlayer(parsed.data.username);
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/players/:username — profile + stats
playersRouter.get('/:username', async (req, res) => {
  try {
    const player = await getPlayerByUsername(req.params['username']!);
    if (!player) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/players/:username/history — recent games
playersRouter.get('/:username/history', async (req, res) => {
  try {
    const player = await getPlayerByUsername(req.params['username']!);
    if (!player) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    const history = await getPlayerHistory(player.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
