-- Yantra — Supabase database schema
-- Run this in the Supabase SQL editor to initialise the database.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Players ───────────────────────────────────────────────────────────────────
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  rating      integer not null default 1000,
  wins        integer not null default 0,
  draws       integer not null default 0,
  losses      integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Games ─────────────────────────────────────────────────────────────────────
create table if not exists games (
  id              uuid primary key,
  join_code       text not null unique,
  status          text not null default 'waiting',  -- waiting | active | finished
  mode            text not null default 'unranked', -- ranked | unranked | local
  speed_play      boolean not null default false,
  board_state     jsonb not null default '{}',
  tile_pool       jsonb not null default '[]',
  current_turn    integer not null default 0,
  consecutive_skips integer not null default 0,
  expires_at      timestamptz,
  winner_id       uuid references players(id),
  created_at      timestamptz not null default now()
);

-- ── Game players ──────────────────────────────────────────────────────────────
create table if not exists game_players (
  game_id     uuid not null references games(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  seat_index  integer not null,
  score       integer not null default 0,
  hand        jsonb not null default '[]',
  primary key (game_id, player_id)
);

-- ── Moves ─────────────────────────────────────────────────────────────────────
create table if not exists game_moves (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references games(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  move_type     text not null,  -- place | skip | swap | resign
  placed_tiles  jsonb,
  score_gained  integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Rating history ────────────────────────────────────────────────────────────
create table if not exists rating_history (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  game_id       uuid not null references games(id) on delete cascade,
  rating_before integer not null,
  rating_after  integer not null,
  created_at    timestamptz not null default now()
);

-- ── Helper function: increment a stat column ──────────────────────────────────
create or replace function increment_player_stat(player_id uuid, stat text)
returns void language plpgsql as $$
begin
  execute format('update players set %I = %I + 1 where id = $1', stat, stat)
  using player_id;
end;
$$;

-- ── Row Level Security (optional — enable if using anon client) ───────────────
-- alter table players enable row level security;
-- alter table games enable row level security;
-- etc.

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_games_join_code on games(join_code);
create index if not exists idx_game_moves_game_id on game_moves(game_id);
create index if not exists idx_rating_history_player_id on rating_history(player_id, created_at desc);
create index if not exists idx_players_rating on players(rating desc);
