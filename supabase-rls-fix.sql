-- Yantra — Enable Row Level Security on all public tables
-- Paste this into the Supabase SQL editor and run it.
--
-- The server uses the service_role key which bypasses RLS,
-- so this only blocks unauthorized direct access via the anon key.

alter table players        enable row level security;
alter table games          enable row level security;
alter table game_players   enable row level security;
alter table game_moves     enable row level security;
alter table rating_history enable row level security;

-- Allow public read access to player profiles / leaderboard
create policy "Players are publicly readable"
  on players for select using (true);

-- Allow public read of rating history (player stats pages)
create policy "Rating history is publicly readable"
  on rating_history for select using (true);
