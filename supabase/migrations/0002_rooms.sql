-- FlagQuest room battles (multiplayer)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null default 'Room',
  admin_id uuid not null references public.players (id) on delete cascade,
  question_count int not null default 10,
  status text not null default 'lobby', -- lobby | playing | finished
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  name text not null,
  score int not null default 0,
  correct int not null default 0,
  done boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, player_id)
);

create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists room_members_room_idx on public.room_members (room_id);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

drop policy if exists "rooms_read" on public.rooms;
create policy "rooms_read" on public.rooms for select using (true);

drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert" on public.rooms for insert with check (auth.uid() = admin_id);

drop policy if exists "rooms_admin_update" on public.rooms;
create policy "rooms_admin_update" on public.rooms
  for update using (auth.uid() = admin_id) with check (auth.uid() = admin_id);

drop policy if exists "room_members_read" on public.room_members;
create policy "room_members_read" on public.room_members for select using (true);

drop policy if exists "room_members_insert" on public.room_members;
create policy "room_members_insert" on public.room_members
  for insert with check (auth.uid() = player_id);

drop policy if exists "room_members_self_update" on public.room_members;
create policy "room_members_self_update" on public.room_members
  for update using (auth.uid() = player_id) with check (auth.uid() = player_id);

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
