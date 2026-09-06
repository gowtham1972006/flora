import React, { useState, useEffect, useCallback } from 'react';
import { PlantItem, ScreenType } from '../types';
import { fetchPlants, searchPlants } from '../lib/plants';
import { samplePlants } from '../data/plantData';
import { Search, Sun, Droplet, ChevronRight, Heart, Sparkles } from 'lucide-react';

interface CategoryListProps {
  setScreen: (screen: ScreenType) => void;
  onSelectPlant: (plant: PlantItem) => void;
  favorites: string[];
  onToggleFavorite: (plantId: string) => void;
  /** Which category to display. Defaults to 'Flowers'. */
  category?: PlantItem['category'];
}

// Sub-type filter options per category
const FILTERS: Record<PlantItem['category'], Array<'All' | 'Perennials' | 'Annuals' | 'Bulbs' | 'Indoor' | 'Outdoor'>> = {
  Flowers:    ['All', 'Perennials', 'Annuals', 'Bulbs'],
  'Leaf Plant': ['All', 'Indoor', 'Outdoor'],
  Succulents: ['All', 'Indoor', 'Outdoor'],
  Trees:      ['All', 'Outdoor'],
};

const CATEGORY_LABELS: Record<PlantItem['category'], string> = {
  Flowers:    'Flowers',
  'Leaf Plant': 'Leaf Plants',
  Succulents: 'Succulents',
  Trees:      'Trees',
};

const CATEGORY_DESC: Record<PlantItem['category'], string> = {
  Flowers:    'Discover beautiful blooms to brighten your garden.',
  'Leaf Plant': 'Bold foliage plants for indoors and outdoors.',
  Succulents: 'Low-maintenance plants that store water in their leaves.',
  Trees:      'Majestic trees for shade, fruit, and garden structure.',
};

export const CategoryList: React.FC<CategoryListProps> = ({
  setScreen,
  onSelectPlant,
  favorites,
  onToggleFavorite,
  category = 'Flowers',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Build the favorite Set once for O(1) lookups
  const favoriteSet = new Set(favorites);

  // Determine available filter options for this category
  const filterOptions = FILTERS[category] ?? ['All'];

  const loadPlants = useCallback(async () => {
    setLoading(true);
    try {
      const favSet = new Set<string>(favorites);
      const data = searchQuery.trim()
        ? await searchPlants(searchQuery, favSet)
        : await fetchPlants(category as PlantItem['category'] | undefined, favSet);

      // Apply sub-type filter locally (avoids extra round-trip)
      const filtered = selectedFilter === 'All'
        ? data
        : data.filter((p) => p.subType === selectedFilter);

      setPlants(filtered);
    } catch {
      // Fallback to static data filtered by category
      const favSet = new Set(favorites);
      const fallback = samplePlants
        .filter((p) => p.category === category)
        .map((p) => ({ ...p, isFavorite: favSet.has(p.id) }));
      setPlants(fallback);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchQuery, selectedFilter]);

  useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  // Reset filter when category changes
  useEffect(() => {
    setSelectedFilter('All');
  }, [category]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-28 md:pb-12 pt-4 sm:pt-6 animate-fade-in">
      {/* Header & Search */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-[#8ba870]/20 text-[#4c6635]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#4c6635] uppercase tracking-wider">
              Botanical Catalog
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#4c6635] tracking-tight">
            {CATEGORY_LABELS[category]}
          </h2>
          <p className="text-sm text-[#44483e] mt-1">{CATEGORY_DESC[category]}</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${CATEGORY_LABELS[category].toLowerCase()}...`}
            className="w-full bg-[#f2f4f1] border border-[#e1e3e0] rounded-full py-3.5 pl-12 pr-4 text-sm font-medium text-[#191c1b] placeholder:text-[#74796d] focus:outline-none focus:ring-2 focus:ring-[#8ba870] focus:bg-white transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-[#e1e3e0] text-[#44483e] rounded-full px-2 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Filter Chips */}
      {filterOptions.length > 1 && (
        <section>
          <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
            {filterOptions.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#8ba870] text-[#0d2000] shadow-sm'
                      : 'bg-[#e7e9e6] text-[#44483e] hover:bg-[#e1e3e0]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Plant Cards List */}
      <section className="space-y-3.5">
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#e1e3e0] flex items-center gap-4 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-[#e7e9e6] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#e7e9e6] rounded w-1/2" />
                  <div className="h-3 bg-[#e7e9e6] rounded w-1/3" />
                  <div className="h-3 bg-[#e7e9e6] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#e1e3e0] text-[#44483e]">
            <p className="text-base font-semibold">No plants match your search</p>
            <p className="text-xs mt-1">Try another keyword or clear the filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('All'); }}
              className="mt-4 px-4 py-2 bg-[#4c6635] text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          plants.map((plant) => {
            const isFav = favoriteSet.has(plant.id);
            return (
              <div
                key={plant.id}
                onClick={() => {
                  onSelectPlant(plant);
                  setScreen('plant_detail');
                }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#c4c8ba]/30 hover:border-[#8ba870] hover:shadow-md transition-all duration-200 flex items-center gap-4 cursor-pointer active:scale-[0.99] group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#eceeeb] border border-[#e1e3e0]">
                  <img
                    src={plant.image}
                    alt={plant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#191c1b] truncate group-hover:text-[#4c6635] transition-colors">
                      {plant.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(plant.id);
                      }}
                      className="p-1 text-[#74796d] hover:text-[#ba1a1a] transition-colors ml-2"
                      aria-label="Toggle favorite"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? 'fill-[#ba1a1a] text-[#ba1a1a]' : 'text-[#74796d]'}`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-[#44483e] italic truncate mb-2">
                    {plant.scientificName}
                  </p>

                  {/* Requirements badges */}
                  <div className="flex items-center gap-3 text-xs text-[#50634e]">
                    <div className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-[#4c6635]" />
                      <span className="text-[11px] font-medium">{plant.sunlight.split(' ')[0]}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-[#c4c8ba]" />
                    <div className="flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-[#4c6635]" />
                      <span className="text-[11px] font-medium">{plant.water.split(' ')[0]}</span>
                    </div>
                    {plant.subType && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-[#c4c8ba]" />
                        <span className="text-[11px] bg-[#f2f4f1] text-[#354e1f] px-2 py-0.5 rounded-md font-medium">
                          {plant.subType}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="w-8 h-8 rounded-full bg-[#f2f4f1] flex items-center justify-center text-[#74796d] group-hover:text-[#4c6635] group-hover:bg-[#cdecae] transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
