-- ============================================================
-- Flora – Patch: backfill missing profiles + add RPC
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Backfill any auth users who don't have a profiles row yet
--    (happens when the trigger wasn't installed before sign-up)
insert into public.profiles (id, name, role, avatar_url, plants_count)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Plant Lover'),
  'Plant Enthusiast',
  u.raw_user_meta_data->>'avatar_url',
  0
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 2. RPC to safely increment plants_count
create or replace function public.increment_plants_count(uid uuid)
returns void language sql security definer set search_path = public as $$
  update profiles set plants_count = plants_count + 1 where id = uid;
$$;
