-- Review comments pinned onto app pages by percentage position.
-- Positions are % of the page content area (never the window), so pins stay
-- put across screen sizes.

create table page_comments (
  id uuid primary key default gen_random_uuid(),
  page text not null,        -- app pathname, e.g. /dashboard
  x numeric not null,        -- 0-100, % of page content width
  y numeric not null,        -- 0-100, % of page content height
  author text not null,
  body text not null,
  resolved boolean not null default false,
  parent_id uuid references page_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on page_comments (page);

alter publication supabase_realtime add table page_comments;

alter table page_comments enable row level security;

-- Internal tool: anon may read/insert/update/delete this table only.
create policy "anon all" on page_comments
  for all to anon using (true) with check (true);
