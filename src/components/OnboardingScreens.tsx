import React from 'react';
import { ArrowRight, Scan } from 'lucide-react';

interface OnboardingProps {
  step: 1 | 2 | 3;
  onNext: () => void;
  onSkip: () => void;
  onSignUp: () => void;
  onLogin: () => void;
}

export const OnboardingScreens: React.FC<OnboardingProps> = ({
  step,
  onNext,
  onSkip,
  onSignUp,
  onLogin,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#f8faf7] flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#cdecae] opacity-25 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-[#d2e9ce] opacity-35 rounded-full blur-2xl -ml-20 pointer-events-none" />

      {/* Top Bar with Skip (for steps 1 & 2) */}
      <div className="w-full max-w-md flex justify-end items-center h-10 z-10">
        {step < 3 ? (
          <button
            onClick={onSkip}
            className="text-sm font-semibold text-[#4c6635] hover:bg-[#e7e9e6] px-4 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            Skip
          </button>
        ) : (
          <div className="h-6" />
        )}
      </div>

      {/* Main Content by Step */}
      <main className="flex-1 w-full max-w-md flex flex-col items-center justify-center text-center z-10 my-4">
        {step === 1 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
            {/* Step 1: Plant in Circular Container */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 aspect-square flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-[#f2f4f1] p-3 relative z-10 transition-transform duration-500 hover:scale-105">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTstOzYHRvoq5iWWCuqEdHtiADhk2tyQh1kBlG68AjlTEKUfrdNid-XvDzeql9N9YE1IcIBsNg_RbKLsJs9uDtyMks19jhmWi8TSdz4sN-1PjE7B_Tg2q6SeF6T1qXrBY0MSRcfQMWKMcHI4ZdhJp3oNnQKSAXdRbQu7nxBZCh0hSHKY4AWe5CIYvhF73oY660FO5SLU_4ASb_SgAOR9sgO3tnHwtVC6BQN2OUFMmThVceaihbGYCS"
                  alt="Doctor Plant Botanical"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="absolute -bottom-2 w-3/4 h-6 bg-[#4c6635] opacity-15 blur-lg rounded-full z-0" />
            </div>

            <div className="space-y-2 mt-4 max-w-xs">
              <h2 className="text-3xl font-bold text-[#191c1b] tracking-tight">
                Welcome to Doctor Plant
              </h2>
              <p className="text-sm md:text-base text-[#44483e] leading-relaxed">
                Your personal botanical expert. Diagnose, treat, and nurture your green companions with precision and care.
              </p>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-6 h-2 rounded-full bg-[#4c6635] transition-all" />
              <div className="w-2 h-2 rounded-full bg-[#e1e3e0]" />
              <div className="w-2 h-2 rounded-full bg-[#e1e3e0]" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
            {/* Step 2: Organic Masked Leaf with Scan Line */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] overflow-hidden bg-[#e7e9e6] shadow-xl border-2 border-white/60">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNx1c3ZE7n2cLzYqO3QSJjIg7MOkeoA1n5VJ22Sj8RaypfvBsHgY-T1qotqan7LCJMtbOauvnSBMJfyK_bGmJnvzvcGO8oscq3tAw8vGX9Bk4Xh2BdKtJ-y1itRYu6gOSh-aaufqLTseLFma0a4X0Gr8KN9S9EMqZ7gcJQJjJRWwW8_g-9fUiXSzCDv0b-7xIZqugcosrXRQMr0tYAOcdiW-VHIeIFjH80kuRAlRVAGuv1HaT8W6ot"
                  alt="Doctor Plant Scanning"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Scanning reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 border-2 border-dashed border-[#8ba870] rounded-3xl relative flex items-center justify-center bg-white/30 backdrop-blur-[2px] shadow-sm">
                  <Scan className="w-12 h-12 text-[#4c6635] animate-pulse" />
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#8ba870] shadow-[0_0_8px_#8ba870] animate-scan" />
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 max-w-xs">
              <h2 className="text-3xl font-bold text-[#191c1b] tracking-tight">
                Doctor Plant
              </h2>
              <p className="text-sm md:text-base text-[#44483e] leading-relaxed">
                Get started with Doctor plant by exploring how easy it is to Find plant disease health solutions.
              </p>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-[#e1e3e0]" />
              <div className="w-6 h-2 rounded-full bg-[#4c6635] transition-all" />
              <div className="w-2 h-2 rounded-full bg-[#e1e3e0]" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
            {/* Step 3: Potted Monstera in White Pot */}
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-[0_20px_40px_rgba(76,102,53,0.12)] border-4 border-white relative transition-transform duration-500 hover:scale-105">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvzt0Dsv6xVrTl3N-ReQ21WFP2dZn3zMibk_-T1s_1yLYzqa-7NOXg-Hdm8WfC0UM0tEy-5HXwoPnZsf5k-yfWXMpBvRLWqAwizkiAJTb-cbu1qeU4B64_qCJ7SVA1rcnxcIC8TUy_fJCQvJadQUAMShEPZv8Rpm3ccHS1j5ElLeuptDyWZ_7DjpDZ0LnZtv4-eyGaD3q6LMRtVS_fc8GYaap1UtDkx8yfwsnqey120xDsRdH4zCJr"
                alt="Doctor Plant Ready"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5 mt-4 max-w-xs">
              <h2 className="text-3xl font-bold text-[#4c6635] tracking-tight">
                Doctor Plant
              </h2>
              <p className="text-base text-[#44483e]">
                Let's get started!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Area */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-3 pt-4">
        {step < 3 ? (
          <button
            onClick={onNext}
            className="w-18 h-18 bg-[#4c6635] hover:bg-[#354e1f] text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 group cursor-pointer"
            aria-label="Next slide"
          >
            <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div className="w-full space-y-3">
            <button
              onClick={onSignUp}
              className="w-full bg-[#8ba870] hover:bg-[#4c6635] text-white font-semibold text-base py-4 px-6 rounded-2xl shadow-[0_8px_20px_rgba(139,168,112,0.25)] active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 group cursor-pointer"
            >
              <span>Sign up</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLogin}
              className="w-full bg-transparent hover:bg-[#e7e9e6] border-2 border-[#8ba870] text-[#4c6635] font-semibold text-base py-3.5 px-6 rounded-2xl transition-colors duration-200 flex justify-center items-center cursor-pointer"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
