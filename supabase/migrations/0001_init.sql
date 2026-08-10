-- FlagQuest initial schema (idempotent — safe to re-run)
create table if not exists public.players (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_scores (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  mode text not null,
  score int not null default 0,
  correct int not null default 0,
  total int not null default 0,
  detail text not null default '',
  xp int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists xp_scores_player_idx on public.xp_scores (player_id);
create index if not exists xp_scores_created_idx on public.xp_scores (created_at desc);

alter table public.players enable row level security;
alter table public.xp_scores enable row level security;

drop policy if exists "players_read" on public.players;
create policy "players_read" on public.players for select using (true);

drop policy if exists "players_own_write" on public.players;
create policy "players_own_write" on public.players
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "xp_scores_read" on public.xp_scores;
create policy "xp_scores_read" on public.xp_scores for select using (true);

drop policy if exists "xp_scores_own_write" on public.xp_scores;
create policy "xp_scores_own_write" on public.xp_scores
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);
