-- Row Level Security policies for every table.
--
-- Trusted server-side writes (guest photo uploads, captcha-verified comments)
-- go through the service-role key, which bypasses RLS. Those paths therefore
-- have no anonymous INSERT policy on purpose.

-- clients: a user can only see and edit their own row.
create policy "clients_select_own" on public.clients
  for select using (id = auth.uid());

create policy "clients_update_own" on public.clients
  for update using (id = auth.uid()) with check (id = auth.uid());

-- backgrounds: public read-only catalog.
create policy "backgrounds_select_all" on public.backgrounds
  for select using (true);

-- albums: publicly readable (served by slug). Only the owner can write.
create policy "albums_select_all" on public.albums
  for select using (true);

create policy "albums_insert_own" on public.albums
  for insert with check (client_id = auth.uid());

create policy "albums_update_own" on public.albums
  for update using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "albums_delete_own" on public.albums
  for delete using (client_id = auth.uid());

-- photos: approved photos are public; the owner sees and manages all of theirs.
create policy "photos_select_approved_or_own" on public.photos
  for select using (status = 'approved' or client_id = auth.uid());

create policy "photos_insert_own" on public.photos
  for insert with check (client_id = auth.uid());

create policy "photos_update_own" on public.photos
  for update using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "photos_delete_own" on public.photos
  for delete using (client_id = auth.uid());

-- comments: publicly readable. Inserts happen server-side after Turnstile.
create policy "comments_select_all" on public.comments
  for select using (true);
