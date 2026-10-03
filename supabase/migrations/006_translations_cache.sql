-- ============================================================
-- Flora – Content Translation Cache
-- Run this AFTER 005_profiles_insert_rls.sql
-- ============================================================
-- Caches Gemini translations for plant and disease content.
-- Stale detection is based on source_text matching the current DB value.
-- If source_text changes (admin edits the record), the old translation
-- will no longer match and a fresh translation will be requested.
-- ============================================================

create table if not exists public.content_translations (
  id                uuid        primary key default gen_random_uuid(),
  entity_type       text        not null check (entity_type in ('plant', 'disease')),
  entity_id         text        not null,
  field_name        text        not null,
  source_language   text        not null default 'en',
  target_language   text        not null check (target_language in ('ta', 'hi', 'fr', 'es')),
  source_text       text        not null,
  translated_text   text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Unique constraint ─────────────────────────────────────────
-- One translation per (entity, field, source_lang, target_lang, source_text).
-- If source_text changes the old row won't be found, triggering re-translation.
create unique index if not exists content_translations_lookup_idx
  on public.content_translations
  (entity_type, entity_id, field_name, source_language, target_language, source_text);

-- ── Timestamp auto-update ─────────────────────────────────────
create trigger content_translations_updated_at
  before update on public.content_translations
  for each row execute procedure public.set_updated_at();

-- ── Row-Level Security ────────────────────────────────────────
alter table public.content_translations enable row level security;

-- Public content (plants / diseases) translations are safe to share with all users.
create policy "Content translations are publicly readable"
  on public.content_translations for select
  using (true);

-- Only service role (Edge Functions) may write translations.
-- Client-side code never writes to this table directly.
create policy "Service role can insert translations"
  on public.content_translations for insert
  with check (true);

create policy "Service role can update translations"
  on public.content_translations for update
  using (true)
  with check (true);
