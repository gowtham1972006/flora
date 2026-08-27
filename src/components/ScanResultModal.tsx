import React from 'react';
import { DiseaseItem } from '../types';
import { ChevronRight, X } from 'lucide-react';

interface ScanResultModalProps {
  disease: DiseaseItem;
  onViewDiagnosis: () => void;
  onClose: () => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  disease,
  onViewDiagnosis,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-fade-in">
      <div className="w-full max-w-xl mx-auto bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(76,102,53,0.2)] p-6 pb-10 relative border-t border-[#cdecae]/50">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-[#e1e3e0] rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#191c1b] tracking-tight">
            Scan Results
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f4f1] text-[#74796d] flex items-center justify-center hover:bg-[#e7e9e6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result Card */}
        <button
          onClick={onViewDiagnosis}
          className="w-full flex items-center justify-between p-4 bg-[#f8faf7] hover:bg-[#f2f4f1] border border-[#e1e3e0] rounded-2xl transition-all text-left active:scale-[0.99] group shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#c4c8ba]/40">
              <img
                src={disease.image}
                alt={disease.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider">
                Confidence: {disease.confidenceScore || 94}%
              </span>
              <h3 className="font-bold text-base text-[#191c1b] truncate mt-0.5">
                {disease.name === 'Wilting Leaves' ? 'Wilting leaves detected' : `${disease.name} detected`}
              </h3>
              <p className="text-xs text-[#44483e] truncate">
                Likely cause: {disease.causes[0]?.title || 'Environmental stress'}
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#d2e9ce] text-[#354e1f] flex items-center justify-center shrink-0 ml-3 group-hover:bg-[#8ba870] group-hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        <p className="text-center text-xs text-[#74796d] mt-4">
          Tap the diagnosis card to view full treatment protocol and causes.
        </p>
      </div>
    </div>
  );
};
