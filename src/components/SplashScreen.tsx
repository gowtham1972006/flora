import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#cdecae] via-[#f2f4f1] to-[#f8faf7] flex flex-col justify-between items-center text-[#191c1b] px-6 py-12 relative overflow-hidden">
      {/* Ambient Botanical Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -right-[10%] w-[70vw] h-[70vw] md:w-[35vw] md:h-[35vw] bg-[#4c6635] opacity-5 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_30s_linear_infinite] blur-3xl" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[80vw] h-[80vw] md:w-[45vw] md:h-[45vw] bg-[#8ba870] opacity-10 rounded-[60%_40%_30%_70%/50%_60%_40%_50%] animate-[spin_40s_linear_infinite_reverse] blur-3xl" />
      </div>

      {/* Spacer */}
      <div className="w-full h-8" />

      {/* Main Branding Logo & Title */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-sm z-10 text-center animate-fade-in">
        {/* Botanical Leaf Motif Card */}
        <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-[100%_0%_100%_0%/100%_0%_100%_0%] shadow-[0_20px_40px_rgba(76,102,53,0.12)] flex items-center justify-center transform rotate-45 mb-8 border border-white/80 transition-transform duration-500 hover:scale-105">
          <div className="transform -rotate-45 text-[#4c6635]">
            <svg
              className="w-16 h-16 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
            </svg>
          </div>
        </div>

        <h1 className="font-bold text-4xl text-[#4c6635] tracking-tight mb-3">
          FloraVeda
        </h1>
        <p className="text-base md:text-lg text-[#44483e] leading-relaxed max-w-xs">
          Nurture your botanical life with precision care and expert guidance.
        </p>
      </main>

      {/* Bottom Actions */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-3.5 pb-6">
        <button
          onClick={onGetStarted}
          className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white font-semibold text-base py-4 px-6 rounded-2xl shadow-[0_8px_20px_rgba(76,102,53,0.22)] active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 group cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onLogin}
          className="w-full bg-transparent hover:bg-white/60 text-[#4c6635] font-semibold text-base py-3.5 px-6 rounded-2xl transition-colors duration-200 flex justify-center items-center cursor-pointer"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
};
