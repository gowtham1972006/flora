-- ============================================================
-- Flora - Patch 004: Fix notifications INSERT RLS policy
-- Run this in: Supabase -> SQL Editor -> New Query -> Run
-- Run AFTER: 001_initial_schema.sql, 002_storage_and_rls.sql, 003_fixes.sql
-- ============================================================

-- The original policy in 002_storage_and_rls.sql used:
--   with check (true)
-- which allows any authenticated user to insert a notification
-- for ANY user_id. This replaces it with a correct user-scoped policy.

-- 1. Drop the over-permissive policy by its exact original name
drop policy if exists "Service role can insert notifications" on public.notifications;

-- 2. Recreate as a properly scoped user INSERT policy
create policy "Users can insert their own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);
