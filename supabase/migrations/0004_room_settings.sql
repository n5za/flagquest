-- FlagQuest room battles: per-mode settings (e.g. timed sprint seconds, match pairs, strict spelling)
alter table public.rooms
  add column if not exists settings jsonb not null default '{}';

comment on column public.rooms.settings is 'Per-mode room settings: { timed: { seconds }, match: { pairs }, type: { strict }, reverse: { strict } }';
