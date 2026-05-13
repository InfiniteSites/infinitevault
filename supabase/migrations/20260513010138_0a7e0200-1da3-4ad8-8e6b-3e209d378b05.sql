
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  category_id uuid references public.categories(id) on delete cascade,
  visits integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.proxies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  visits integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.dumps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table public.dump_links (
  id uuid primary key default gen_random_uuid(),
  dump_id uuid not null references public.dumps(id) on delete cascade,
  url text not null,
  visits integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.wildcards (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  created_at timestamptz not null default now()
);

create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  balance numeric not null default 10,
  updated_at timestamptz not null default now()
);

create table public.site_stats (
  id integer primary key default 1,
  total_visits bigint not null default 0,
  constraint single_row check (id = 1)
);
insert into public.site_stats (id, total_visits) values (1, 0);

-- Seed default categories
insert into public.categories (name) values ('Misc'), ('Red''s Exploit Corner'), ('KoopBin');

-- Enable RLS, public access (admin gate is client-side)
alter table public.categories enable row level security;
alter table public.links enable row level security;
alter table public.proxies enable row level security;
alter table public.dumps enable row level security;
alter table public.dump_links enable row level security;
alter table public.wildcards enable row level security;
alter table public.leaderboard enable row level security;
alter table public.site_stats enable row level security;

create policy "public all categories" on public.categories for all using (true) with check (true);
create policy "public all links" on public.links for all using (true) with check (true);
create policy "public all proxies" on public.proxies for all using (true) with check (true);
create policy "public all dumps" on public.dumps for all using (true) with check (true);
create policy "public all dump_links" on public.dump_links for all using (true) with check (true);
create policy "public all wildcards" on public.wildcards for all using (true) with check (true);
create policy "public all leaderboard" on public.leaderboard for all using (true) with check (true);
create policy "public all site_stats" on public.site_stats for all using (true) with check (true);

-- RPC to atomically increment site visits
create or replace function public.bump_site_visits()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.site_stats set total_visits = total_visits + 1 where id = 1
  returning total_visits;
$$;

-- RPC to bump link visits
create or replace function public.bump_link_visits(table_name text, row_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if table_name = 'links' then
    update public.links set visits = visits + 1 where id = row_id;
  elsif table_name = 'proxies' then
    update public.proxies set visits = visits + 1 where id = row_id;
  elsif table_name = 'dump_links' then
    update public.dump_links set visits = visits + 1 where id = row_id;
  end if;
end;
$$;
