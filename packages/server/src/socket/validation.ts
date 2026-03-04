import { z } from 'zod';

const username = z.string().min(2).max(20);

const tileSchema = z.object({
  id: z.string().max(50),
  colour: z.string().nullable(),
  value: z.number().int().min(0).max(8),
  isBlank: z.boolean(),
  isEight: z.boolean(),
  assignedValue: z.number().int().min(1).max(7).optional(),
  assignedColour: z.string().optional(),
});

const tilePlacementSchema = z.object({
  tile: tileSchema,
  row: z.number().int(),
  col: z.number().int(),
});

const moveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('place'), placements: z.array(tilePlacementSchema).min(1).max(7) }),
  z.object({ type: z.literal('swap'), tileIds: z.array(z.string().max(50)) }),
  z.object({ type: z.literal('skip') }),
  z.object({ type: z.literal('resign') }),
]);

export const createGameSchema = z.object({
  username,
  mode: z.enum(['ranked', 'unranked', 'local']),
  speedPlay: z.boolean(),
  speedPlaySeconds: z.number().int().min(10).max(300).optional(),
  maxPlayers: z.number().int().min(2).max(4).optional(),
});

export const joinGameSchema = z.object({
  username,
  joinCode: z.string().min(1).max(10),
});

export const startGameSchema = z.object({
  gameId: z.string().uuid(),
});

export const submitMoveSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
  move: moveSchema,
});

export const previewMoveSchema = z.object({
  gameId: z.string().uuid(),
  placements: z.array(tilePlacementSchema).min(1).max(7),
});

export const requestStateSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
});
