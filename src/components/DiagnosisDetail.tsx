import React, { useState } from 'react';
import { DiseaseItem } from '../types';
import {
  AlertTriangle,
  Info,
  Droplet,
  FlaskConical,
  Sun,
  Bug,
  Thermometer,
  Wind,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DiagnosisDetailProps {
  disease: DiseaseItem;
  onAddToSchedule: (plantName: string, taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist') => void;
  onBack: () => void;
}

export const DiagnosisDetail: React.FC<DiagnosisDetailProps> = ({
  disease,
  onAddToSchedule,
  onBack,
}) => {
  const [addedToSchedule, setAddedToSchedule] = useState(false);

  const handleAdd = () => {
    onAddToSchedule(disease.name, 'Water');
    setAddedToSchedule(true);
    setTimeout(() => setAddedToSchedule(false), 3000);
  };

  const getCauseIcon = (iconName: string) => {
    switch (iconName) {
      case 'water_drop':
        return <Droplet className="w-6 h-6 text-[#4c6635]" />;
      case 'science':
        return <FlaskConical className="w-6 h-6 text-[#4c6635]" />;
      case 'light_mode':
        return <Sun className="w-6 h-6 text-[#4c6635]" />;
      case 'bug_report':
        return <Bug className="w-6 h-6 text-[#4c6635]" />;
      case 'thermostat':
        return <Thermometer className="w-6 h-6 text-[#4c6635]" />;
      case 'wind':
        return <Wind className="w-6 h-6 text-[#4c6635]" />;
      default:
        return <Droplet className="w-6 h-6 text-[#4c6635]" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 md:pb-16 animate-fade-in text-[#191c1b]">
      {/* Hero Image Section */}
      <section className="relative w-full h-[380px] md:h-[440px] rounded-b-[40px] md:rounded-[40px] overflow-hidden shadow-botanical -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full bg-[#eceeeb]">
        <img
          src={disease.image}
          alt={disease.name}
          className="w-full h-full object-cover"
        />

        {/* Scanning Box Reticle (for Wilting layout style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffdad6]">
              Diagnosis Complete
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {disease.name}
          </h1>

          <p className="text-sm opacity-90 mt-0.5">
            Confidence Score: {disease.confidenceScore || 94}%
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-2 md:px-0 pt-6 space-y-6">
        {/* Title & Severity Card (Image 3 / 31) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e1e3e0]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-bold text-[#191c1b] tracking-tight">
                {disease.name}
              </h2>
              <p className="text-sm text-[#44483e]">
                Commonly known as {disease.commonName}
              </p>
            </div>

            <div
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold ${
                disease.severity === 'High'
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : 'bg-[#d2e9ce] text-[#253c10]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{disease.severity} Severity</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#e1e3e0]/60 pt-4 mt-2">
            <div>
              <span className="text-xs text-[#74796d] block font-medium">Affected Area</span>
              <span className="text-sm font-semibold text-[#191c1b]">{disease.affectedArea}</span>
            </div>
            <div>
              <span className="text-xs text-[#74796d] block font-medium">Spread Rate</span>
              <span className="text-sm font-semibold text-[#191c1b]">{disease.spreadRate}</span>
            </div>
            <div>
              <span className="text-xs text-[#74796d] block font-medium">Urgency</span>
              <span className="text-sm font-semibold text-[#ba1a1a]">
                {disease.urgency || 'Treat within 24h'}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#74796d] block font-medium">Status</span>
              <span className="text-sm font-semibold text-[#4c6635]">Actionable Plan</span>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#d2e9ce] text-[#354e1f] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#191c1b]">Description</h3>
          </div>

          <div className="bg-[#f2f4f1] rounded-2xl p-5 border border-[#e1e3e0]/60 space-y-3">
            <p className="text-sm md:text-base text-[#44483e] leading-relaxed">
              {disease.description}
            </p>
            {disease.secondaryDescription && (
              <p className="text-xs md:text-sm text-[#44483e] leading-relaxed">
                {disease.secondaryDescription}
              </p>
            )}

            {disease.tags && (
              <div className="flex flex-wrap gap-2 pt-2">
                {disease.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white text-[#354e1f] text-xs font-semibold rounded-full border border-[#c4c8ba]/40 shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Common Causes (Bento Grid of 4 cards matching Image 3) */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#191c1b]">Common Causes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {disease.causes.map((cause, idx) => (
              <div
                key={idx}
                className="bg-[#f2f4f1] p-4 rounded-2xl flex flex-col items-center text-center border border-[#e1e3e0]/60 shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-xs">
                  {getCauseIcon(cause.icon)}
                </div>
                <span className="text-sm font-bold text-[#191c1b]">{cause.title}</span>
                <span className="text-[11px] text-[#74796d] mt-0.5">{cause.subtitle}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Treatment Plan Section (Image 3 & 31) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8ba870] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#191c1b]">Treatment Plan</h3>
          </div>

          <div className="space-y-3">
            {disease.treatmentSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-4 bg-white p-4.5 rounded-2xl shadow-sm border border-[#e1e3e0]"
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#eceeeb] text-[#191c1b] font-bold flex items-center justify-center text-sm shadow-inner">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#191c1b] mb-1">{step.title}</h4>
                  <p className="text-xs md:text-sm text-[#44483e] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add to Care Schedule CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleAdd}
            className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white font-semibold text-base py-4 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {addedToSchedule ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#cdecae]" />
                <span>Added to Care Schedule!</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                <span>Add to Care Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
