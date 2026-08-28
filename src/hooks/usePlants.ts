import { useState, useEffect, useCallback } from 'react';
import { fetchPlants, fetchFavoriteIds, toggleFavorite } from '../lib/plants';
import type { PlantItem } from '../types';

export interface UsePlantsState {
  plants: PlantItem[];
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
}

export interface UsePlantsActions {
  toggleFav: (plantId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePlants(
  userId: string | null,
  category?: PlantItem['category']
): UsePlantsState & UsePlantsActions {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const favIds = userId ? await fetchFavoriteIds(userId) : new Set<string>();
      setFavoriteIds(favIds);

      const data = await fetchPlants(category, favIds);
      setPlants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plants');
    } finally {
      setLoading(false);
    }
  }, [userId, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFav = useCallback(
    async (plantId: string) => {
      if (!userId) return;

      const isFav = favoriteIds.has(plantId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(plantId);
        else next.add(plantId);
        return next;
      });
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, isFavorite: !isFav } : p))
      );

      try {
        await toggleFavorite(userId, plantId, isFav);
      } catch (err) {
        // Revert on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(plantId);
          else next.delete(plantId);
          return next;
        });
        setPlants((prev) =>
          prev.map((p) => (p.id === plantId ? { ...p, isFavorite: isFav } : p))
        );
        console.error('Failed to toggle favorite:', err);
      }
    },
    [userId, favoriteIds]
  );

  return { plants, favoriteIds, loading, error, toggleFav, refetch: load };
}
