import { supabase, DbProfile } from './supabase';
import { UserProfile } from '../types';
import { uploadAvatar } from './storage';
import { countFavorites } from './plants';

// ─── DB row → frontend type ───────────────────────────────────────────────────
function toUserProfile(row: DbProfile, favoritesCount: number): UserProfile {
  return {
    name: row.name || 'Plant Lover',
    role: row.role || 'Plant Enthusiast',
    avatar: row.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${row.id}`,
    plantsCount: row.plants_count,
    favoritesCount,
  };
}

// ─── Client-side default when DB is unavailable ──────────────────────────────
function clientDefault(userId: string, name: string, favoritesCount: number): UserProfile {
  return {
    name,
    role: 'Plant Enthusiast',
    avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`,
    plantsCount: 0,
    favoritesCount,
  };
}

// ─── Fetch user profile ───────────────────────────────────────────────────────
// Accepts an optional fallbackName (from auth user metadata) used when:
//   - the profile row has an empty name (trigger not yet committed)
//   - the profile row does not exist yet
// Retries up to 3 times with 600 ms gaps to handle the auth-trigger race.
export async function fetchProfile(userId: string, fallbackName?: string): Promise<UserProfile> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 600;

  // Fetch favorites count once outside the retry loop
  let favCount = 0;
  try {
    favCount = await countFavorites(userId);
  } catch { /* non-critical */ }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log('[PROFILE] attempt:', attempt);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const isLastAttempt = attempt === MAX_RETRIES;
    console.log('[PROFILE] found:', !!data, '| has name:', !!(data as DbProfile | null)?.name);

    // Profile exists and has a real name — return immediately
    if (data && data.name) {
      return toUserProfile(data as DbProfile, favCount);
    }

    // Profile row not ready (missing or blank name) — retry if we have time
    if (!isLastAttempt) {
      await new Promise<void>((r) => setTimeout(r, RETRY_DELAY_MS));
      continue;
    }

    // ── Final attempt — resolve with best available data ──────────────────
    const nameToUse = fallbackName?.trim() || 'Plant Lover';

    if (!data) {
      // No row — create one with the fallback name (trigger must have failed)
      console.warn('[PROFILE] no row found after retries — attempting client-side upsert');
      const { data: upserted, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, name: nameToUse, role: 'Plant Enthusiast', plants_count: 0 })
        .select()
        .maybeSingle();

      if (upsertErr || !upserted) {
        console.warn('[PROFILE] upsert failed (RLS or network) — using client default:', upsertErr?.message);
        return clientDefault(userId, nameToUse, favCount);
      }
      return toUserProfile(upserted as DbProfile, favCount);
    }

    // Row exists but name is still blank — patch it with the fallback name
    if (!data.name && nameToUse !== 'Plant Lover') {
      // Fire-and-forget; don't block the UI
      void supabase
        .from('profiles')
        .update({ name: nameToUse })
        .eq('id', userId);
    }
    return toUserProfile(
      { ...data, name: data.name || nameToUse } as DbProfile,
      favCount
    );
  }

  // Should be unreachable, but TypeScript requires a return
  return clientDefault(userId, fallbackName?.trim() || 'Plant Lover', 0);
}

// ─── Update name and/or role ──────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  updates: { name?: string; role?: string }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.role !== undefined && { role: updates.role.trim() }),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

// ─── Upload a new avatar and update profile ───────────────────────────────────
export async function updateAvatar(
  userId: string,
  file: File
): Promise<string> {
  const publicUrl = await uploadAvatar(userId, file);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return publicUrl;
}

// ─── Increment plants_count (called when user adds plant to care schedule) ────
export async function incrementPlantsCount(userId: string): Promise<void> {
  // Use a Postgres function to avoid race conditions.
  // The RPC is now typed in the Database interface so no cast is needed.
  await supabase.rpc('increment_plants_count', { uid: userId });
}
