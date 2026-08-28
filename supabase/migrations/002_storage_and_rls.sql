-- ============================================================
-- FloraVeda – Storage Buckets & Row-Level Security Policies
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────────

-- Bucket for user avatars (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) on conflict (id) do nothing;

-- Bucket for plant scan images (private – only owner can read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plant-scans',
  'plant-scans',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp']
) on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── plants (public read, no user writes) ──────────────────────
alter table public.plants enable row level security;

create policy "Plants are publicly readable"
  on public.plants for select
  using (true);

-- ── diseases (public read) ────────────────────────────────────
alter table public.diseases enable row level security;

create policy "Diseases are publicly readable"
  on public.diseases for select
  using (true);

-- ── favorites ─────────────────────────────────────────────────
alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ── care_tasks ────────────────────────────────────────────────
alter table public.care_tasks enable row level security;

create policy "Users can view their own care tasks"
  on public.care_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own care tasks"
  on public.care_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own care tasks"
  on public.care_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own care tasks"
  on public.care_tasks for delete
  using (auth.uid() = user_id);

-- ── notifications ─────────────────────────────────────────────
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Service role (Edge Functions) can insert notifications
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

-- ── scan_history ──────────────────────────────────────────────
alter table public.scan_history enable row level security;

create policy "Users can view their own scan history"
  on public.scan_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scan history"
  on public.scan_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own scan history"
  on public.scan_history for delete
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- STORAGE POLICIES
-- ──────────────────────────────────────────────────────────────

-- Avatars: anyone can view, only owner can upload/update/delete
create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload their avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Plant scans: only owner can view/upload/delete
create policy "Users can view their own plant scans"
  on storage.objects for select
  using (
    bucket_id = 'plant-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload their own plant scans"
  on storage.objects for insert
  with check (
    bucket_id = 'plant-scans'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own plant scans"
  on storage.objects for delete
  using (
    bucket_id = 'plant-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ──────────────────────────────────────────────────────────────
-- REAL-TIME
-- Enable real-time for notifications so the client gets live updates
-- ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.care_tasks;
