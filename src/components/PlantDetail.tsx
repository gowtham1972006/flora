import React, { useState } from 'react';
import { PlantItem } from '../types';
import { Sun, Droplets, Sprout, Heart, ArrowRight, Check, Plus, Calendar } from 'lucide-react';

interface PlantDetailProps {
  plant: PlantItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToSchedule: (plantName: string, taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist') => void;
  onBack: () => void;
}

export const PlantDetail: React.FC<PlantDetailProps> = ({
  plant,
  isFavorite,
  onToggleFavorite,
  onAddToSchedule,
  onBack,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const handleAddSchedule = () => {
    onAddToSchedule(plant.name, 'Water');
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 md:pb-16 animate-fade-in">
      {/* Large Hero Image */}
      <section className="relative w-full h-[380px] md:h-[480px] rounded-b-[36px] md:rounded-[36px] overflow-hidden shadow-botanical -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
        <img
          src={plant.image}
          alt={plant.name}
          className="w-full h-full object-cover"
        />
        {/* Soft bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Content Container */}
      <div className="px-2 md:px-0 pt-6 space-y-6">
        {/* Header Title & Favorite Toggle */}
        <header className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#4c6635] uppercase tracking-wider bg-[#cdecae]/40 px-2.5 py-1 rounded-full">
              {plant.category} {plant.subType ? `• ${plant.subType}` : ''}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#191c1b] tracking-tight">
              {plant.name}
            </h1>
            <p className="text-base text-[#44483e] font-medium">
              {plant.scientificName}
            </p>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite(plant.id)}
            aria-label="Save to favorites"
            className="w-12 h-12 rounded-full bg-[#d2e9ce] text-[#566954] hover:bg-[#cdecae] flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Heart
              className={`w-6 h-6 transition-transform duration-200 ${
                isFavorite ? 'fill-[#ba1a1a] text-[#ba1a1a] scale-110' : 'text-[#50634e]'
              }`}
            />
          </button>
        </header>

        {/* Care Details (Bento Grid) */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-[#191c1b] tracking-tight">
            Care Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Sunlight Card */}
            <div className="bg-[#f2f4f1] rounded-2xl p-4 flex items-center md:flex-col md:text-center md:justify-center border border-[#e1e3e0]/60 shadow-[0_4px_20px_rgba(76,102,53,0.03)]">
              <div className="w-12 h-12 rounded-full bg-[#8ba870] text-white flex items-center justify-center shrink-0 mr-4 md:mr-0 md:mb-3 shadow-sm">
                <Sun className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#191c1b]">Sunlight</span>
                <span className="text-xs text-[#44483e] mt-0.5">{plant.sunlight}</span>
              </div>
            </div>

            {/* Water Card */}
            <div className="bg-[#f2f4f1] rounded-2xl p-4 flex items-center md:flex-col md:text-center md:justify-center border border-[#e1e3e0]/60 shadow-[0_4px_20px_rgba(76,102,53,0.03)]">
              <div className="w-12 h-12 rounded-full bg-[#d2e9ce] text-[#354e1f] flex items-center justify-center shrink-0 mr-4 md:mr-0 md:mb-3 shadow-sm">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#191c1b]">Water</span>
                <span className="text-xs text-[#44483e] mt-0.5">{plant.water}</span>
              </div>
            </div>

            {/* Fertilizing Card */}
            <div className="bg-[#f2f4f1] rounded-2xl p-4 flex items-center md:flex-col md:text-center md:justify-center border border-[#e1e3e0]/60 shadow-[0_4px_20px_rgba(76,102,53,0.03)]">
              <div className="w-12 h-12 rounded-full bg-[#99a196] text-white flex items-center justify-center shrink-0 mr-4 md:mr-0 md:mb-3 shadow-sm">
                <Sprout className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#191c1b]">Fertilizing</span>
                <span className="text-xs text-[#44483e] mt-0.5">{plant.fertilizing}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="bg-white rounded-2xl p-5 border border-[#e1e3e0] shadow-sm relative overflow-hidden space-y-3">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-[#8ba870]/10 rounded-full blur-2xl pointer-events-none" />

          <h3 className="text-xl font-bold text-[#191c1b] tracking-tight relative z-10">
            Description
          </h3>

          <div className="relative z-10 space-y-3 text-sm text-[#44483e] leading-relaxed">
            <p>
              {expanded
                ? plant.description
                : `${plant.description.slice(0, 180)}...`}
            </p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center text-sm font-bold text-[#4c6635] hover:text-[#354e1f] transition-colors group cursor-pointer"
            >
              <span>{expanded ? 'Show Less' : 'Read More'}</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Add to Care Schedule CTA */}
        <div className="pt-2">
          <button
            onClick={handleAddSchedule}
            className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white font-semibold text-base py-4 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {addedToast ? (
              <>
                <Check className="w-5 h-5 text-[#cdecae]" />
                <span>Added to Care Schedule!</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Add to Care Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
