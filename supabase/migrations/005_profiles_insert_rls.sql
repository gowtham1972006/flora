-- ============================================================
-- Flora - Patch 005: profiles INSERT RLS policy
-- Run this in: Supabase -> SQL Editor -> New Query -> Run
-- Run AFTER: 001_initial_schema.sql, 002_storage_and_rls.sql
-- ============================================================

-- The DB trigger handle_new_user() is SECURITY DEFINER and bypasses RLS --
-- it does NOT need this policy to create the profile row.
--
-- This policy is only needed for the browser-client upsert fallback in
-- fetchProfile() (profile.ts), which runs as the authenticated user and
-- therefore IS subject to RLS. Without this policy, the fallback silently
-- returns clientDefault() and the profile row is never persisted.

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
