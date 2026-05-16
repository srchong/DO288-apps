-- Comments: attached to an album, optionally to a specific photo.
-- Created through a Server Action that verifies a Cloudflare Turnstile token.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  photo_id uuid references public.photos (id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create index comments_album_id_idx on public.comments (album_id);
