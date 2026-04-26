-- Run this once in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists registered_players (
  phone      text        primary key,
  name       text        not null,
  added_at   timestamptz not null default now()
);

create table if not exists games (
  id                 uuid        primary key,
  host_id            text        not null,
  host_name          text        not null,
  title              text        not null,
  venue              text        not null,
  date               text        not null,
  court_fee          numeric     not null default 0,
  food_fee           numeric     not null default 0,
  status             text        not null default 'open',
  participants       jsonb       not null default '[]'::jsonb,
  payment_qr_image   text,
  food_receipt       jsonb,
  created_at         timestamptz not null default now()
);

-- Allow anon key full access (app uses custom phone-based auth, not Supabase Auth)
alter table registered_players enable row level security;
create policy "anon full access" on registered_players for all to anon using (true) with check (true);

alter table games enable row level security;
create policy "anon full access" on games for all to anon using (true) with check (true);
