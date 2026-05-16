-- Backgrounds: catalog of album themes. Some are free, some are paid.
-- This is shared catalog data, not tenant data, so it has no client_id.

create table public.backgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null
    check (category in ('wedding', 'party', 'kids', 'corporate', 'classic')),
  is_free boolean not null default true,
  preview_url text not null,
  created_at timestamptz not null default now()
);

alter table public.backgrounds enable row level security;
