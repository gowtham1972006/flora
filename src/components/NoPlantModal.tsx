import React from 'react';
import { AlertCircle, Camera, X } from 'lucide-react';

interface NoPlantModalProps {
  onRetake: () => void;
  onCancel: () => void;
}

export const NoPlantModal: React.FC<NoPlantModalProps> = ({ onRetake, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[28px] p-8 shadow-[0_20px_50px_rgba(186,26,26,0.2)] flex flex-col items-center text-center relative overflow-hidden border border-[#ffdad6]">
        {/* Error icon circle */}
        <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-5 shadow-inner">
          <AlertCircle className="w-9 h-9 stroke-[2.5]" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-[#191c1b] mb-2 tracking-tight">
          There is no plant
        </h2>
        <p className="text-sm text-[#44483e] mb-6 max-w-[280px] leading-relaxed">
          We couldn't detect a plant in this image. Please ensure the leaf is clearly visible and well-lit.
        </p>

        {/* Retake Button */}
        <button
          onClick={onRetake}
          className="w-full h-14 bg-[#4c6635] hover:bg-[#354e1f] text-white rounded-xl font-semibold text-sm md:text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>Retake Photo</span>
        </button>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="mt-3 py-2 px-4 text-sm font-semibold text-[#596157] hover:text-[#191c1b] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
