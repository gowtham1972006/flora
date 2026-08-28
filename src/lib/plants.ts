import { supabase, DbPlant } from './supabase';
import { PlantItem } from '../types';

// ─── DB row → frontend type ───────────────────────────────────────────────────
function toPlantItem(row: DbPlant, favoriteIds: Set<string>): PlantItem {
  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    category: row.category,
    subType: row.sub_type ?? undefined,
    image: row.image_url ?? '',
    sunlight: row.sunlight,
    water: row.water,
    fertilizing: row.fertilizing,
    description: row.description,
    isFavorite: favoriteIds.has(row.id),
  };
}

// ─── Fetch all plants (optionally filtered by category) ──────────────────────
export async function fetchPlants(
  category?: PlantItem['category'],
  favoriteIds: Set<string> = new Set()
): Promise<PlantItem[]> {
  let query = supabase.from('plants').select('*').order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => toPlantItem(row as DbPlant, favoriteIds));
}

// ─── Search plants by name / scientific name / description ───────────────────
export async function searchPlants(
  searchTerm: string,
  favoriteIds: Set<string> = new Set()
): Promise<PlantItem[]> {
  if (!searchTerm.trim()) return fetchPlants(undefined, favoriteIds);

  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .or(
      `name.ilike.%${searchTerm}%,scientific_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    )
    .order('name');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toPlantItem(row as DbPlant, favoriteIds));
}

// ─── Fetch single plant by ID ─────────────────────────────────────────────────
export async function fetchPlantById(
  id: string,
  favoriteIds: Set<string> = new Set()
): Promise<PlantItem | null> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return toPlantItem(data as DbPlant, favoriteIds);
}

// ─── Favorites ────────────────────────────────────────────────────────────────
export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('favorites')
    .select('plant_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.plant_id as string));
}

export async function addFavorite(
  userId: string,
  plantId: string
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, plant_id: plantId });

  // Ignore duplicate key errors (user already favorited this plant)
  if (error && !error.message.includes('duplicate')) {
    throw new Error(error.message);
  }
}

export async function removeFavorite(
  userId: string,
  plantId: string
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('plant_id', plantId);

  if (error) throw new Error(error.message);
}

export async function toggleFavorite(
  userId: string,
  plantId: string,
  currentlyFavorited: boolean
): Promise<void> {
  if (currentlyFavorited) {
    await removeFavorite(userId, plantId);
  } else {
    await addFavorite(userId, plantId);
  }
}

// ─── Count favorites for profile stats ───────────────────────────────────────
export async function countFavorites(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
