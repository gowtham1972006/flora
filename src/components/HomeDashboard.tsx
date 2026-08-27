import React, { useState } from 'react';
import { ScreenType, DiseaseItem } from '../types';
import { sampleDiseases } from '../data/plantData';
import { Search, Scan, AlertTriangle, Info, ArrowRight, Sparkles } from 'lucide-react';

interface HomeDashboardProps {
  setScreen: (screen: ScreenType) => void;
  onSelectDisease: (disease: DiseaseItem) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  setScreen,
  onSelectDisease,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'leaf' | 'flowers' | 'succulents' | 'trees'>('leaf');

  const diseasesList = Object.values(sampleDiseases);
  const filteredDiseases = diseasesList.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-28 md:pb-12 pt-4 sm:pt-6 animate-fade-in">
      {/* Title & Search Header */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#191c1b] tracking-tight">
            Find plant disease
          </h2>
          <p className="text-sm text-[#44483e] mt-1">
            Detect symptoms early and protect your botanicals with targeted treatments.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#74796d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for diseases or symptoms..."
            className="w-full bg-[#f2f4f1] border border-[#e1e3e0] rounded-full py-3.5 pl-12 pr-4 text-sm font-medium text-[#191c1b] placeholder:text-[#74796d] focus:outline-none focus:ring-2 focus:ring-[#4c6635] focus:bg-white transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs bg-[#e1e3e0] text-[#44483e] rounded-full px-2 py-0.5 hover:bg-[#c4c8ba]"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Categories Horizontal Scroll */}
      <section>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {/* Leaf Plant */}
          <button
            onClick={() => setActiveCategory('leaf')}
            className={`flex flex-col items-center justify-center min-w-[84px] py-3 px-3 rounded-2xl shrink-0 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeCategory === 'leaf'
                ? 'bg-[#8ba870] text-[#0d2000] shadow-sm font-semibold'
                : 'bg-[#eceeeb] text-[#191c1b] hover:bg-[#e7e9e6]'
            }`}
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
              </svg>
            </div>
            <span className="text-xs">Leaf Plant</span>
          </button>

          {/* Flowers */}
          <button
            onClick={() => setScreen('category_flowers')}
            className="flex flex-col items-center justify-center min-w-[84px] py-3 px-3 rounded-2xl bg-[#eceeeb] text-[#191c1b] hover:bg-[#e7e9e6] shrink-0 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center text-[#4c6635]">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Flowers</span>
          </button>

          {/* Succulents */}
          <button
            onClick={() => {
              setActiveCategory('succulents');
              setScreen('category_flowers');
            }}
            className="flex flex-col items-center justify-center min-w-[84px] py-3 px-3 rounded-2xl bg-[#eceeeb] text-[#191c1b] hover:bg-[#e7e9e6] shrink-0 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center text-[#4c6635]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1m-4 5a1 1 0 0 1 .993.883L9 8v2a3 3 0 0 0 6 0V8a1 1 0 0 1 1.993-.117L17 8v2a5 5 0 0 1-4 4.9V19h2a1 1 0 0 1 .117 1.993L15 21H9a1 1 0 0 1-.117-1.993L9 19h2v-4.1A5 5 0 0 1 7 10V8a1 1 0 0 1 1-1" />
              </svg>
            </div>
            <span className="text-xs font-medium">Succulents</span>
          </button>

          {/* Trees */}
          <button
            onClick={() => {
              setActiveCategory('trees');
              setScreen('category_flowers');
            }}
            className="flex flex-col items-center justify-center min-w-[84px] py-3 px-3 rounded-2xl bg-[#eceeeb] text-[#191c1b] hover:bg-[#e7e9e6] shrink-0 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <div className="w-7 h-7 mb-1 flex items-center justify-center text-[#4c6635]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L4 16h4v4h8v-4h4L12 2zm0 3.8L16.2 14H7.8L12 5.8z" />
              </svg>
            </div>
            <span className="text-xs font-medium">Trees</span>
          </button>
        </div>
      </section>

      {/* Health of your plants Banner (Image 13) */}
      <section>
        <div
          onClick={() => setScreen('scan')}
          className="relative rounded-3xl overflow-hidden bg-[#4c6635] text-white p-6 shadow-lg flex items-center justify-between group cursor-pointer hover:shadow-xl transition-all duration-300"
        >
          <div className="relative z-10 space-y-2 max-w-[60%]">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
              Health of your plants
            </h3>
            <p className="text-xs md:text-sm text-[#cdecae] leading-relaxed">
              Scan your plant to detect problems early and keep them thriving.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScreen('scan');
              }}
              className="mt-3 inline-flex items-center gap-2 bg-white text-[#4c6635] px-4 py-2.5 rounded-full font-semibold text-xs md:text-sm hover:bg-[#f2f4f1] active:scale-95 transition-all shadow-md"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Now</span>
            </button>
          </div>

          <div className="absolute right-0 top-0 w-1/2 h-full opacity-65 group-hover:opacity-85 transition-opacity">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjDTDMqaa09jYd-igaCo-tj37_CH6olonLaGOrWe-PSTl3584vTTmicawgAQNBcRhuR9CasyK9dqHVYlfabTolugE4EREYrpgYX8r-fHmD5QDUXdqOnB9ht7ku3fNV0SHWXamFyxsl6wu140cfxiqsF8NnjE019iE3elkHX6L-EC6LNheU4FiNlJ4YI4wOnnquc9eBxgLLOQrLmOfA6rKeR_-huqVo7MhNcR4EcPp8Su84EPL7oBG2"
              alt="Lush green monstera"
              className="w-full h-full object-cover object-left"
            />
          </div>
        </div>
      </section>

      {/* Common Problems Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-[#191c1b] tracking-tight">
              Common Problems
            </h3>
            <p className="text-xs text-[#44483e]">Tap any condition to view full treatment protocol</p>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs md:text-sm font-semibold text-[#4c6635] hover:underline cursor-pointer"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiseases.map((disease) => {
            const isHighRisk = disease.severity === 'High';
            return (
              <div
                key={disease.id}
                onClick={() => {
                  onSelectDisease(disease);
                  setScreen('diagnosis');
                }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#e1e3e0] hover:shadow-md hover:border-[#8ba870] transition-all cursor-pointer flex items-start gap-4 active:scale-[0.99]"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#eceeeb] border border-[#e1e3e0]">
                  <img
                    src={disease.image}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-[#191c1b] truncate">
                      {disease.name}
                    </h4>
                    <ArrowRight className="w-4 h-4 text-[#74796d] shrink-0" />
                  </div>
                  <p className="text-xs text-[#44483e] line-clamp-2 leading-relaxed">
                    {disease.description}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    {isHighRisk ? (
                      <div className="flex items-center gap-1 text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>High Risk</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[#253c10] bg-[#cdecae] px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <Info className="w-3.5 h-3.5" />
                        <span>Treatable</span>
                      </div>
                    )}
                    <span className="text-[11px] text-[#74796d]">
                      {disease.causes[0]?.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Plant Spotlight / Link to Flowers Catalog */}
      <section className="bg-gradient-to-r from-[#d2e9ce]/60 to-[#dde5d8]/60 rounded-2xl p-5 border border-[#8ba870]/30 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#354e1f] uppercase tracking-wider">
            Garden Flora Directory
          </span>
          <h4 className="text-base font-bold text-[#191c1b]">
            Explore 50+ Blooming Flower Varieties
          </h4>
          <p className="text-xs text-[#44483e]">
            Care instructions for Gladiolus, Hybrid Roses, Delphiniums & more.
          </p>
        </div>
        <button
          onClick={() => setScreen('category_flowers')}
          className="px-4 py-2 bg-[#4c6635] text-white rounded-xl text-xs font-semibold hover:bg-[#354e1f] active:scale-95 transition-all shrink-0 ml-3"
        >
          View Catalog
        </button>
      </section>
    </div>
  );
};
