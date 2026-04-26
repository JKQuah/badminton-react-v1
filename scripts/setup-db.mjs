#!/usr/bin/env node
// Usage: node scripts/setup-db.mjs <personal-access-token>
// Get your PAT at: https://supabase.com/dashboard/account/tokens

const PAT = process.argv[2]
if (!PAT) {
  console.error('\nUsage:  node scripts/setup-db.mjs <personal-access-token>')
  console.error('Get yours → https://supabase.com/dashboard/account/tokens\n')
  process.exit(1)
}

const PROJECT_REF = 'jpdppgcvnnuzyjmlbjfl'

const statements = [
  `create table if not exists registered_players (
    phone      text        primary key,
    name       text        not null,
    added_at   timestamptz not null default now()
  )`,

  `create table if not exists games (
    id                uuid        primary key,
    host_id           text        not null,
    host_name         text        not null,
    title             text        not null,
    venue             text        not null,
    date              text        not null,
    court_fee         numeric     not null default 0,
    food_fee          numeric     not null default 0,
    status            text        not null default 'open',
    participants      jsonb       not null default '[]'::jsonb,
    payment_qr_image  text,
    food_receipt      jsonb,
    created_at        timestamptz not null default now()
  )`,

  `alter table registered_players enable row level security`,
  `alter table games enable row level security`,

  `do $$ begin
    if not exists (
      select 1 from pg_policies
      where tablename = 'registered_players' and policyname = 'anon full access'
    ) then
      create policy "anon full access" on registered_players
        for all to anon using (true) with check (true);
    end if;
  end $$`,

  `do $$ begin
    if not exists (
      select 1 from pg_policies
      where tablename = 'games' and policyname = 'anon full access'
    ) then
      create policy "anon full access" on games
        for all to anon using (true) with check (true);
    end if;
  end $$`,
]

async function run(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? JSON.stringify(body))
  return body
}

let ok = true
for (const sql of statements) {
  const label = sql.trim().split('\n')[0].slice(0, 60)
  try {
    await run(sql)
    console.log(`✓ ${label}`)
  } catch (err) {
    console.error(`✗ ${label}`)
    console.error(`  ${err.message}`)
    ok = false
  }
}

process.exit(ok ? 0 : 1)
