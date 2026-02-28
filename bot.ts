/**
 * Yantra — Claude bot player
 * Run with:  npx tsx bot.ts [JOIN_CODE]
 * If no join code, polls /debug/lobbies every 2s until one appears.
 */

import { io, Socket } from 'socket.io-client';

const SERVER = 'http://localhost:3001';
// Usage: tsx bot.ts [--host] [NAME]
//   --host  create a new game and auto-start when a second player joins
//   NAME    optional player name (default: Claude)
//   Without --host, polls for an open lobby and joins it.
//   A plain join code (e.g. ABC123) still works as before.
const args = process.argv.slice(2);
const isHostMode = args[0] === '--host';
const nameArg = isHostMode ? args[1] : (args[0]?.match(/^[A-Z0-9]{6}$/) ? undefined : args[0]);
const BOT_NAME = nameArg ?? 'Claude';

// ── Types (minimal inline copies to avoid shared package resolution) ──────────

type TileColour = 'red' | 'blue' | 'yellow' | 'purple';
interface Tile { id: string; colour: TileColour | null; value: number; isBlank: boolean; isEight: boolean; assignedValue?: number; }
interface BoardSquare { row: number; col: number; type: string; placedTile?: Tile; isLocked: boolean; }
interface TilePlacement { tile: Tile; row: number; col: number; }
interface GamePlayer { playerId: string; username: string; seatIndex: number; score: number; hand: Tile[]; }
interface GameState { gameId: string; joinCode: string; status: string; players: GamePlayer[]; currentTurnIndex: number; board: Record<string, BoardSquare>; tilesRemaining?: number; speedPlay?: boolean; }

// ── Bot state ─────────────────────────────────────────────────────────────────

let myPlayerId = '';
let myHand: Tile[] = [];
let gameState: GameState | null = null;
let hostedGameId = '';

// ── Valid-square mask (mirrors boardLayout.ts) ────────────────────────────────

function isValidSq(r: number, c: number) { return (r-7)**2 + (c-7)**2 <= 72; }
function sqKey(r: number, c: number) { return `${r},${c}`; }

// ── Sequence validation (mirrors moveValidator.ts) ────────────────────────────

function effectiveVal(t: Tile): number { return t.isBlank ? (t.assignedValue ?? 0) : t.value; }

function isValidSeq(tiles: Tile[]): boolean {
  if (tiles.length === 0) return false;
  const numbered = tiles.filter(t => !t.isBlank && !t.isEight);
  const values = tiles.map(effectiveVal);
  const colours = numbered.map(t => t.colour);

  // same-number any colour
  if (new Set(values).size === 1) return true;

  // ascending/descending same colour
  if (colours.length === 0 || !colours.every(c => c === colours[0])) return false;
  const sorted = [...values].sort((a,b) => a-b);
  if (new Set(sorted).size !== sorted.length) return false;
  return sorted[sorted.length-1] - sorted[0] === sorted.length - 1;
}

// ── Move finder ───────────────────────────────────────────────────────────────

interface Move { placements: TilePlacement[]; }

function findMove(board: Record<string, BoardSquare>, hand: Tile[], isFirst: boolean): Move | null {
  const occupied = new Set(
    Object.values(board).filter(s => s.placedTile).map(s => sqKey(s.row, s.col))
  );

  // Generate all non-empty subsets of the hand (up to 7 tiles), sorted by size desc for greedy
  const subsets = generateSubsets(hand);

  for (const subset of subsets) {
    if (!isValidSeq(subset)) continue;

    // Try placing in every valid row and column
    const placements = tryPlace(subset, board, occupied, isFirst);
    if (placements) return { placements };
  }
  return null;
}

function generateSubsets(hand: Tile[]): Tile[][] {
  // Exclude blank and eight tiles — bot has no mechanism to assign them values
  const playable = hand.filter(t => !t.isBlank && !t.isEight);
  const results: Tile[][] = [];
  const n = playable.length;
  for (let size = Math.min(n, 7); size >= 1; size--) {
    combos(playable, size, 0, [], results);
  }
  return results;
}

function combos(arr: Tile[], k: number, start: number, cur: Tile[], out: Tile[][]) {
  if (cur.length === k) { out.push([...cur]); return; }
  for (let i = start; i < arr.length; i++) {
    cur.push(arr[i]);
    combos(arr, k, i+1, cur, out);
    cur.pop();
  }
}

function tryPlace(tiles: Tile[], board: Record<string, BoardSquare>, occupied: Set<string>, isFirst: boolean): TilePlacement[] | null {
  const n = tiles.length;

  // Try every starting row/col combination, both horizontal and vertical
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Horizontal
      const hPlacements = tryDirection(tiles, board, occupied, isFirst, r, c, 0, 1);
      if (hPlacements) return hPlacements;
      // Vertical
      const vPlacements = tryDirection(tiles, board, occupied, isFirst, r, c, 1, 0);
      if (vPlacements) return vPlacements;
    }
  }
  return null;
}

function tryDirection(tiles: Tile[], board: Record<string, BoardSquare>, occupied: Set<string>, isFirst: boolean, startR: number, startC: number, dr: number, dc: number): TilePlacement[] | null {
  const placements: TilePlacement[] = [];
  let r = startR, c = startC;
  let ti = 0;

  // Place all tiles consecutively, skipping over already-occupied squares
  while (ti < tiles.length) {
    if (r < 0 || r > 14 || c < 0 || c > 14) return null;
    if (!isValidSq(r, c)) return null;

    const k = sqKey(r, c);
    if (occupied.has(k)) {
      r += dr; c += dc;
      continue;
    }

    placements.push({ tile: tiles[ti], row: r, col: c });
    ti++;
    r += dr; c += dc;
  }

  if (placements.length !== tiles.length) return null;

  // Connectivity check
  if (isFirst) {
    const coversCenter = placements.some(p => p.row === 7 && p.col === 7);
    if (!coversCenter) return null;
  } else {
    const connects = placements.some(p => touchesOccupied(p.row, p.col, occupied));
    if (!connects) return null;
  }

  // Validate the main sequence (including existing tiles on the same axis)
  const mainHorizontal = dr === 0; // dr===0 means moving along columns → horizontal
  const allTiles = buildFullSeq(placements, board, mainHorizontal);
  if (allTiles === null) return null;
  if (!isValidSeq(allTiles)) return null;

  // Validate every cross-sequence formed by the new tiles touching existing tiles
  if (!crossSeqsValid(placements, board, mainHorizontal)) return null;

  return placements;
}

/** For each placed tile, check the perpendicular sequence it forms with existing tiles. */
function crossSeqsValid(placements: TilePlacement[], board: Record<string, BoardSquare>, mainHorizontal: boolean): boolean {
  // Perpendicular direction
  const cdr = mainHorizontal ? 1 : 0; // cross-dr
  const cdc = mainHorizontal ? 0 : 1; // cross-dc

  for (const p of placements) {
    // Gather existing tiles before and after this tile in the cross direction
    const before: Tile[] = [];
    let r = p.row - cdr, c = p.col - cdc;
    while (r >= 0 && c >= 0 && r <= 14 && c <= 14) {
      const sq = board[sqKey(r, c)];
      if (!sq?.placedTile) break;
      before.unshift(sq.placedTile);
      r -= cdr; c -= cdc;
    }

    const after: Tile[] = [];
    r = p.row + cdr; c = p.col + cdc;
    while (r >= 0 && c >= 0 && r <= 14 && c <= 14) {
      const sq = board[sqKey(r, c)];
      if (!sq?.placedTile) break;
      after.push(sq.placedTile);
      r += cdr; c += cdc;
    }

    if (before.length === 0 && after.length === 0) continue; // no cross-sequence formed

    const crossTiles = [...before, p.tile, ...after];
    if (!isValidSeq(crossTiles)) return false;
  }
  return true;
}

function buildFullSeq(placements: TilePlacement[], board: Record<string, BoardSquare>, horizontal: boolean): Tile[] | null {
  if (placements.length === 0) return null;
  const fixed = horizontal ? placements[0].row : placements[0].col;
  const positions = placements.map(p => horizontal ? p.col : p.row);
  const min = Math.min(...positions);
  const max = Math.max(...positions);

  // Build the core span (placed tiles + existing tiles filling gaps)
  const core: Tile[] = [];
  for (let pos = min; pos <= max; pos++) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const placed = placements.find(p => p.row === row && p.col === col);
    if (placed) { core.push(placed.tile); continue; }
    const sq = board[sqKey(row, col)];
    if (!sq?.placedTile) return null; // gap
    core.push(sq.placedTile);
  }

  // Extend outward in both directions (pick up existing tiles beyond the span)
  const before: Tile[] = [];
  for (let pos = min - 1; pos >= 0; pos--) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const sq = board[sqKey(row, col)];
    if (!sq?.placedTile) break;
    before.unshift(sq.placedTile);
  }
  const after: Tile[] = [];
  for (let pos = max + 1; pos <= 14; pos++) {
    const row = horizontal ? fixed : pos;
    const col = horizontal ? pos : fixed;
    const sq = board[sqKey(row, col)];
    if (!sq?.placedTile) break;
    after.push(sq.placedTile);
  }

  return [...before, ...core, ...after];
}

function touchesOccupied(r: number, c: number, occupied: Set<string>): boolean {
  return [[0,1],[0,-1],[1,0],[-1,0]].some(([dr,dc]) => occupied.has(sqKey(r+dr, c+dc)));
}

// ── Play a turn ───────────────────────────────────────────────────────────────

function playTurn(socket: Socket) {
  if (!gameState) return;
  const isFirst = Object.values(gameState.board).every(s => !s.placedTile);

  console.log(`[Bot] My hand: ${myHand.map(t => `${t.colour ?? (t.isEight ? '8' : 'blank')}-${t.value}`).join(', ')}`);

  const move = findMove(gameState.board, myHand, isFirst);

  if (move) {
    console.log(`[Bot] Playing ${move.placements.length} tile(s):`,
      move.placements.map(p => `${p.tile.colour}-${p.tile.value} → (${p.row},${p.col})`).join(', '));
    socket.emit('submit:move', {
      gameId: gameState.gameId,
      playerId: myPlayerId,
      move: { type: 'place', placements: move.placements },
    });
  } else {
    console.log('[Bot] No valid move found — skipping.');
    socket.emit('submit:move', {
      gameId: gameState.gameId,
      playerId: myPlayerId,
      move: { type: 'skip' },
    });
  }
}

// ── Socket connection ─────────────────────────────────────────────────────────

async function getJoinCode(provided?: string): Promise<string> {
  if (provided) return provided;

  console.log('[Bot] Polling for open lobby…');
  while (true) {
    try {
      const res = await fetch(`${SERVER}/debug/lobbies`);
      const data = await res.json() as { pending: { joinCode: string; players: string[] }[] };
      if (data.pending.length > 0) {
        const lobby = data.pending[0];
        console.log(`[Bot] Found lobby ${lobby.joinCode} with players: ${lobby.players.join(', ')}`);
        return lobby.joinCode;
      }
    } catch { /* server not ready yet */ }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  const joinCode = isHostMode ? null : await getJoinCode(args[0]?.match(/^[A-Z0-9]{6}$/) ? args[0] : undefined);

  const socket = io(SERVER);

  socket.on('connect', () => {
    console.log(`[Bot] Connected as socket ${socket.id}`);
    if (isHostMode) {
      socket.emit('create:game', { username: BOT_NAME, mode: 'unranked', speedPlay: false, speedPlaySeconds: 60, maxPlayers: 4 });
    } else {
      socket.emit('join:game', { username: BOT_NAME, joinCode });
    }
  });

  // Host-only: received after creating the game
  socket.on('game:created', (data: { gameId: string; joinCode: string; playerId: string }) => {
    myPlayerId = data.playerId;
    hostedGameId = data.gameId;
    console.log(`[Bot] Created game ${data.gameId}, join code: ${data.joinCode}`);
  });

  // Host-only: auto-start once a second player joins
  socket.on('lobby:playerJoined', (data: { players: { username: string }[] }) => {
    if (data.players.length >= 2 && hostedGameId) {
      console.log(`[Bot] ${data.players.length} players ready — starting game`);
      socket.emit('start:game', { gameId: hostedGameId });
    }
  });

  socket.on('game:joined', (data: { gameId: string; playerId: string }) => {
    myPlayerId = data.playerId;
    console.log(`[Bot] Joined game ${data.gameId} as player ${myPlayerId}`);
  });

  socket.on('game:started', (data: { state: GameState; yourHand: Tile[] }) => {
    gameState = data.state;
    myHand = data.yourHand;
    console.log(`[Bot] Game started! Hand: ${myHand.map(t => `${t.colour ?? 'special'}-${t.value}`).join(', ')}`);
    checkMyTurn(socket);
  });

  socket.on('game:stateUpdate', (data: { state: GameState }) => {
    gameState = data.state;
    checkMyTurn(socket);
  });

  socket.on('game:handUpdate', (data: { hand: Tile[]; tilesRemaining: number }) => {
    myHand = data.hand;
    console.log(`[Bot] New hand (${data.tilesRemaining} tiles left in pool): ${myHand.map(t => `${t.colour ?? 'special'}-${t.value}`).join(', ')}`);
  });

  socket.on('game:moveResult', (data: { username: string; moveType: string; newScore: number }) => {
    console.log(`[Bot] Move result — ${data.username}: ${data.moveType}, score now ${data.newScore}`);
  });

  socket.on('game:invalidMove', (data: { reason: string }) => {
    console.log(`[Bot] Invalid move: ${data.reason} — skipping instead`);
    socket.emit('submit:move', {
      gameId: gameState!.gameId,
      playerId: myPlayerId,
      move: { type: 'skip' },
    });
  });

  socket.on('game:finished', (data: { finalScores: { username: string; score: number }[]; winnerId: string | null }) => {
    console.log('[Bot] Game finished!');
    for (const s of data.finalScores) {
      console.log(`  ${s.username}: ${s.score}`);
    }
    const winner = data.finalScores.find(s => (s as any).playerId === data.winnerId);
    console.log(`Winner: ${winner?.username ?? 'Draw'}`);
    process.exit(0);
  });

  socket.on('error', (data: { message: string }) => {
    console.error('[Bot] Server error:', data.message);
  });

  socket.on('disconnect', () => {
    console.log('[Bot] Disconnected');
    process.exit(1);
  });
}

function checkMyTurn(socket: Socket) {
  if (!gameState || gameState.status !== 'active') return;
  const current = gameState.players[gameState.currentTurnIndex];
  if (current?.playerId === myPlayerId) {
    // Small delay so the human can see the board update first
    setTimeout(() => playTurn(socket), 1200);
  }
}

main().catch(console.error);
