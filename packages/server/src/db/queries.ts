import { randomUUID } from 'node:crypto';
import { ELO_STARTING_RATING } from '@yantra/shared';
import type { GameState, RatingChange } from '@yantra/shared';
import { supabase } from './supabase.js';

// ── In-memory fallback store (used when Supabase is not configured) ──────────

const memPlayers = new Map<string, DbPlayer>();
const memGames = new Map<string, DbGame>();

function memId() {
  return randomUUID();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DbPlayer {
  id: string;
  username: string;
  rating: number;
  wins: number;
  draws: number;
  losses: number;
  created_at: string;
}

export interface DbGame {
  id: string;
  join_code: string;
  status: string;
  mode: string;
  speed_play: boolean;
  board_state: Record<string, unknown>;
  tile_pool: unknown[];
  current_turn: number;
  consecutive_skips: number;
  expires_at: string | null;
  created_at: string;
  winner_id: string | null;
}

// ── Players ───────────────────────────────────────────────────────────────────

export async function upsertPlayer(username: string): Promise<DbPlayer> {
  if (!supabase) {
    // In-memory: find by username or create
    const existing = [...memPlayers.values()].find((p) => p.username === username);
    if (existing) return existing;
    const p: DbPlayer = {
      id: memId(),
      username,
      rating: ELO_STARTING_RATING,
      wins: 0,
      draws: 0,
      losses: 0,
      created_at: new Date().toISOString(),
    };
    memPlayers.set(p.id, p);
    return p;
  }

  // Check if player exists first — never overwrite existing stats
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (existing) return existing as DbPlayer;

  const { data, error } = await supabase
    .from('players')
    .insert({ username, rating: ELO_STARTING_RATING, wins: 0, draws: 0, losses: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as DbPlayer;
}

export async function getPlayerByUsername(username: string): Promise<DbPlayer | null> {
  if (!supabase) {
    return [...memPlayers.values()].find((p) => p.username === username) ?? null;
  }
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data as DbPlayer | null;
}

export async function getLeaderboard(limit = 20): Promise<DbPlayer[]> {
  if (!supabase) {
    return [...memPlayers.values()]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbPlayer[];
}

// ── Games ─────────────────────────────────────────────────────────────────────

export async function createGame(state: GameState): Promise<void> {
  if (!supabase) {
    memGames.set(state.gameId, {
      id: state.gameId,
      join_code: state.joinCode,
      status: state.status,
      mode: state.mode,
      speed_play: state.speedPlay,
      board_state: state.board as Record<string, unknown>,
      tile_pool: state.tilePool as unknown[],
      current_turn: state.currentTurnIndex,
      consecutive_skips: state.consecutiveSkips,
      expires_at: state.expiresAt,
      created_at: new Date().toISOString(),
      winner_id: state.winnerId,
    });
    return;
  }
  const { error } = await supabase.from('games').insert({
    id: state.gameId,
    join_code: state.joinCode,
    status: state.status,
    mode: state.mode,
    speed_play: state.speedPlay,
    board_state: state.board,
    tile_pool: state.tilePool,
    current_turn: state.currentTurnIndex,
    consecutive_skips: state.consecutiveSkips,
    expires_at: state.expiresAt,
    winner_id: state.winnerId,
  });
  if (error) throw error;
}

export async function updateGame(state: GameState): Promise<void> {
  if (!supabase) {
    const g = memGames.get(state.gameId);
    if (g) {
      g.status = state.status;
      g.board_state = state.board as Record<string, unknown>;
      g.tile_pool = state.tilePool as unknown[];
      g.current_turn = state.currentTurnIndex;
      g.consecutive_skips = state.consecutiveSkips;
      g.winner_id = state.winnerId;
    }
    return;
  }
  const { error } = await supabase
    .from('games')
    .update({
      status: state.status,
      board_state: state.board,
      tile_pool: state.tilePool,
      current_turn: state.currentTurnIndex,
      consecutive_skips: state.consecutiveSkips,
      winner_id: state.winnerId,
    })
    .eq('id', state.gameId);
  if (error) throw error;
}

export async function getGameByJoinCode(joinCode: string): Promise<DbGame | null> {
  if (!supabase) {
    return [...memGames.values()].find((g) => g.join_code === joinCode) ?? null;
  }
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('join_code', joinCode)
    .maybeSingle();
  if (error) throw error;
  return data as DbGame | null;
}

export async function getGameById(gameId: string): Promise<DbGame | null> {
  if (!supabase) {
    return memGames.get(gameId) ?? null;
  }
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .maybeSingle();
  if (error) throw error;
  return data as DbGame | null;
}

// ── Game players ──────────────────────────────────────────────────────────────

export async function upsertGamePlayers(state: GameState): Promise<void> {
  if (!supabase) return; // in-memory: game state lives in activeGames map
  const rows = state.players.map((p) => ({
    game_id: state.gameId,
    player_id: p.playerId,
    seat_index: p.seatIndex,
    score: p.score,
    hand: p.hand,
  }));
  const { error } = await supabase
    .from('game_players')
    .upsert(rows, { onConflict: 'game_id,player_id' });
  if (error) throw error;
}

// ── Moves ─────────────────────────────────────────────────────────────────────

export async function recordMove(
  gameId: string,
  playerId: string,
  moveType: string,
  placedTiles: unknown,
  scoreGained: number
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('game_moves').insert({
    game_id: gameId,
    player_id: playerId,
    move_type: moveType,
    placed_tiles: placedTiles,
    score_gained: scoreGained,
  });
  if (error) throw error;
}

// ── Rating updates ────────────────────────────────────────────────────────────

export async function applyRatingChanges(
  changes: RatingChange[],
  gameId: string
): Promise<void> {
  if (!supabase) {
    // Update in-memory ratings
    for (const c of changes) {
      const p = memPlayers.get(c.playerId);
      if (p) {
        p.rating = c.ratingAfter;
        if (c.delta > 0) p.wins++;
        else if (c.delta < 0) p.losses++;
        else p.draws++;
      }
    }
    return;
  }
  for (const c of changes) {
    const { error: updateErr } = await supabase
      .from('players')
      .update({ rating: c.ratingAfter })
      .eq('id', c.playerId);
    if (updateErr) throw updateErr;

    const col = c.delta > 0 ? 'wins' : c.delta < 0 ? 'losses' : 'draws';
    await supabase.rpc('increment_player_stat', { player_id: c.playerId, stat: col });

    const { error: histErr } = await supabase.from('rating_history').insert({
      player_id: c.playerId,
      game_id: gameId,
      rating_before: c.ratingBefore,
      rating_after: c.ratingAfter,
    });
    if (histErr) throw histErr;
  }
}

// ── Player game history ───────────────────────────────────────────────────────

export async function getPlayerHistory(
  playerId: string,
  limit = 10
): Promise<unknown[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rating_history')
    .select('*, games(join_code, status, mode, winner_id)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
