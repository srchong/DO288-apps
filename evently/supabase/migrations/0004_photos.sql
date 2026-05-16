-- Photos: belong to an album. client_id is denormalized so RLS policies stay
-- simple. Original, thumbnail and (for 360 photos) the 4096px panorama are all
-- stored in Cloudflare R2; only the object keys live in Postgres.

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  r2_key_original text not null,
  r2_key_thumb text not null,
  r2_key_pano text,
  is_360 boolean not null default false,
  width integer not null default 0,
  height integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  uploaded_by text not null default 'client'
    check (uploaded_by in ('client', 'guest')),
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create index photos_album_id_idx on public.photos (album_id);
create index photos_moderation_idx on public.photos (album_id, status);
