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

// ─── Fetch user profile ───────────────────────────────────────────────────────
// Uses maybeSingle() instead of single() so missing rows return null, not an error.
// If no profile row exists yet (trigger hasn't run), we upsert a default one.
export async function fetchProfile(userId: string): Promise<UserProfile> {
  const [profileResult, favCount] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    countFavorites(userId).catch(() => 0),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);

  // No row yet — upsert a sensible default then return it
  if (!profileResult.data) {
    const { data: upserted, error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, name: '', role: 'Plant Enthusiast', plants_count: 0 })
      .select()
      .maybeSingle();

    if (upsertErr || !upserted) {
      // Still can't get a row — return a client-side default without throwing
      return {
        name: 'Plant Lover',
        role: 'Plant Enthusiast',
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}`,
        plantsCount: 0,
        favoritesCount: 0,
      };
    }
    return toUserProfile(upserted as DbProfile, favCount);
  }

  return toUserProfile(profileResult.data as DbProfile, favCount);
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
  // Use a Postgres function to avoid race conditions
  await supabase.rpc('increment_plants_count' as never, { uid: userId });
}
