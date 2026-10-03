import React, { useState, useMemo } from 'react';
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
import type { LangCode } from '../lib/i18n';
import type { Translations } from '../lib/i18n';
import { useContentTranslation } from '../hooks/useContentTranslation';

interface DiagnosisDetailProps {
  disease: DiseaseItem;
  onAddToSchedule: (plantName: string, taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist') => void;
  onBack: () => void;
  lang: LangCode;
  T: Translations;
}

/** Inline skeleton shimmer */
const TextSkeleton: React.FC<{ width?: string; className?: string }> = ({
  width = 'w-32',
  className = '',
}) => (
  <span
    className={`inline-block bg-[#e7e9e6] rounded animate-pulse ${width} ${className}`}
    style={{ minHeight: '1em' }}
  />
);

export const DiagnosisDetail: React.FC<DiagnosisDetailProps> = ({
  disease,
  onAddToSchedule,
  onBack,
  lang,
  T,
}) => {
  const [addedToSchedule, setAddedToSchedule] = useState(false);

  const handleAdd = () => {
    onAddToSchedule(disease.name, 'Water'); // English name used as task key
    setAddedToSchedule(true);
    setTimeout(() => setAddedToSchedule(false), 3000);
  };

  const getCauseIcon = (iconName: string) => {
    switch (iconName) {
      case 'water_drop':  return <Droplet    className="w-6 h-6 text-[#4c6635]" />;
      case 'science':     return <FlaskConical className="w-6 h-6 text-[#4c6635]" />;
      case 'light_mode':  return <Sun        className="w-6 h-6 text-[#4c6635]" />;
      case 'bug_report':  return <Bug        className="w-6 h-6 text-[#4c6635]" />;
      case 'thermostat':  return <Thermometer className="w-6 h-6 text-[#4c6635]" />;
      case 'wind':        return <Wind       className="w-6 h-6 text-[#4c6635]" />;
      default:            return <Droplet    className="w-6 h-6 text-[#4c6635]" />;
    }
  };

  // ── Flatten all translatable text fields into one batch ───────────────────
  // Scalar fields
  const scalarFields: Record<string, string | undefined | null> = {
    name: disease.name,
    commonName: disease.commonName,
    description: disease.description,
    secondaryDescription: disease.secondaryDescription,
    affectedArea: disease.affectedArea,
    urgency: disease.urgency,
  };

  // Cause array: cause_0_title, cause_0_subtitle, cause_1_title, …
  disease.causes.forEach((cause, i) => {
    scalarFields[`cause_${i}_title`]    = cause.title;
    scalarFields[`cause_${i}_subtitle`] = cause.subtitle;
  });

  // Treatment steps: step_0_title, step_0_description, …
  disease.treatmentSteps.forEach((step, i) => {
    scalarFields[`step_${i}_title`]       = step.title;
    scalarFields[`step_${i}_description`] = step.description;
  });

  const { translated, loading } = useContentTranslation({
    entityType: 'disease',
    entityId: disease.id,
    fields: scalarFields,
    lang,
  });

  // ── Extract translated scalars ─────────────────────────────────────────────
  const tName                = translated.name                ?? disease.name;
  const tCommonName          = translated.commonName          ?? disease.commonName;
  const tDescription         = translated.description         ?? disease.description;
  const tSecondaryDesc       = translated.secondaryDescription ?? disease.secondaryDescription;
  const tAffectedArea        = translated.affectedArea        ?? disease.affectedArea;
  const tUrgency             = translated.urgency             ?? disease.urgency;

  // ── Reconstruct translated causes ─────────────────────────────────────────
  const tCauses = useMemo(() => disease.causes.map((cause, i) => ({
    ...cause,
    title:    translated[`cause_${i}_title`]    ?? cause.title,
    subtitle: translated[`cause_${i}_subtitle`] ?? cause.subtitle,
  })), [disease.causes, translated]);

  // ── Reconstruct translated treatment steps ────────────────────────────────
  const tSteps = useMemo(() => disease.treatmentSteps.map((step, i) => ({
    ...step,
    title:       translated[`step_${i}_title`]       ?? step.title,
    description: translated[`step_${i}_description`] ?? step.description,
  })), [disease.treatmentSteps, translated]);

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 md:pb-16 animate-fade-in text-[#191c1b]">
      {/* Hero Image Section */}
      <section className="relative w-full h-[380px] md:h-[440px] rounded-b-[40px] md:rounded-[40px] overflow-hidden shadow-botanical -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full bg-[#eceeeb]">
        <img
          src={disease.image}
          alt={tName}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffdad6]">
              {T.diag_title}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {loading ? <TextSkeleton width="w-48" className="h-9" /> : tName}
          </h1>

          <p className="text-sm opacity-90 mt-0.5">
            {T.diag_confidence}: {disease.confidenceScore || 94}%
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-2 md:px-0 pt-6 space-y-6">
        {/* Title & Severity Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e1e3e0]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-bold text-[#191c1b] tracking-tight">
                {loading ? <TextSkeleton width="w-40" className="h-7" /> : tName}
              </h2>
              <p className="text-sm text-[#44483e]">
                {loading ? (
                  <TextSkeleton width="w-32" />
                ) : (
                  <>Commonly known as {tCommonName}</>
                )}
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
              <span>{disease.severity} {T.diag_severity}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#e1e3e0]/60 pt-4 mt-2">
            <div>
              <span className="text-xs text-[#74796d] block font-medium">{T.diag_affectedArea}</span>
              <span className="text-sm font-semibold text-[#191c1b]">
                {loading ? <TextSkeleton width="w-20" /> : tAffectedArea}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#74796d] block font-medium">{T.diag_spreadRate}</span>
              <span className="text-sm font-semibold text-[#191c1b]">{disease.spreadRate}</span>
            </div>
            <div>
              <span className="text-xs text-[#74796d] block font-medium">{T.diag_urgency}</span>
              <span className="text-sm font-semibold text-[#ba1a1a]">
                {loading ? <TextSkeleton width="w-24" /> : (tUrgency || 'Treat within 24h')}
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
            {loading ? (
              <div className="space-y-2">
                <TextSkeleton width="w-full" className="h-4" />
                <TextSkeleton width="w-full" className="h-4" />
                <TextSkeleton width="w-3/4" className="h-4" />
              </div>
            ) : (
              <p className="text-sm md:text-base text-[#44483e] leading-relaxed">
                {tDescription}
              </p>
            )}
            {!loading && tSecondaryDesc && (
              <p className="text-xs md:text-sm text-[#44483e] leading-relaxed">
                {tSecondaryDesc}
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

        {/* Common Causes */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#191c1b]">{T.diag_causes}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tCauses.map((cause, idx) => (
              <div
                key={idx}
                className="bg-[#f2f4f1] p-4 rounded-2xl flex flex-col items-center text-center border border-[#e1e3e0]/60 shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-xs">
                  {getCauseIcon(cause.icon)}
                </div>
                <span className="text-sm font-bold text-[#191c1b]">
                  {loading ? <TextSkeleton width="w-16" /> : cause.title}
                </span>
                <span className="text-[11px] text-[#74796d] mt-0.5">
                  {loading ? <TextSkeleton width="w-20" /> : cause.subtitle}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Treatment Plan Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8ba870] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#191c1b]">{T.diag_treatment}</h3>
          </div>

          <div className="space-y-3">
            {tSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-4 bg-white p-4.5 rounded-2xl shadow-sm border border-[#e1e3e0]"
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#eceeeb] text-[#191c1b] font-bold flex items-center justify-center text-sm shadow-inner">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#191c1b] mb-1">
                    {loading ? <TextSkeleton width="w-24" /> : step.title}
                  </h4>
                  <p className="text-xs md:text-sm text-[#44483e] leading-relaxed">
                    {loading ? (
                      <span className="space-y-1 block">
                        <TextSkeleton width="w-full" className="h-3" />
                        <TextSkeleton width="w-4/5" className="h-3" />
                      </span>
                    ) : step.description}
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
                <span>{T.diag_added}</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                <span>{T.diag_addSchedule}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
