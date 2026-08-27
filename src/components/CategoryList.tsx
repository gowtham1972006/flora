import React, { useState } from 'react';
import { PlantItem, ScreenType } from '../types';
import { samplePlants } from '../data/plantData';
import { Search, Sun, Droplet, ChevronRight, Heart, Sparkles, Filter } from 'lucide-react';

interface CategoryListProps {
  setScreen: (screen: ScreenType) => void;
  onSelectPlant: (plant: PlantItem) => void;
  favorites: string[];
  onToggleFavorite: (plantId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  setScreen,
  onSelectPlant,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Perennials' | 'Annuals' | 'Bulbs'>('All');

  const filteredPlants = samplePlants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'All') return matchesSearch;
    return matchesSearch && plant.subType === selectedFilter;
  });

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
            Flowers
          </h2>
          <p className="text-sm text-[#44483e] mt-1">
            Discover beautiful blooms to brighten your garden.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flowers..."
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
      <section>
        <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
          {(['All', 'Perennials', 'Annuals', 'Bulbs'] as const).map((filter) => {
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

      {/* Plant Cards List */}
      <section className="space-y-3.5">
        {filteredPlants.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#e1e3e0] text-[#44483e]">
            <p className="text-base font-semibold">No flowers match your search</p>
            <p className="text-xs mt-1">Try another search keyword or clear the filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('All');
              }}
              className="mt-4 px-4 py-2 bg-[#4c6635] text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredPlants.map((plant) => {
            const isFav = favorites.includes(plant.id);
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
                        className={`w-4 h-4 ${
                          isFav ? 'fill-[#ba1a1a] text-[#ba1a1a]' : 'text-[#74796d]'
                        }`}
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
