-- FlagQuest room battles: pick any game mode for a room (mc | type | match | timed | reverse)
alter table public.rooms
  add column if not exists mode text not null default 'mc';

comment on column public.rooms.mode is 'Room quiz mode: mc | type | match | timed | reverse';
