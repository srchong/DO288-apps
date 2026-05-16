-- Albums: each belongs to one client. Served publicly via a short slug.

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  slug text not null unique,
  title text not null,
  event_type text not null,
  event_date date,
  background_id uuid references public.backgrounds (id) on delete set null,
  allow_guest_uploads boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.albums enable row level security;

create index albums_client_id_idx on public.albums (client_id);
create index albums_slug_idx on public.albums (slug);
