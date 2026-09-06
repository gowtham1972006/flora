import React, { useState } from 'react';
import {
  Globe, CloudSun, Bell, AlarmClock, Sun, Info,
  ChevronRight, Check, ArrowLeft
} from 'lucide-react';
import type { Translations } from '../lib/i18n';
import type { LangCode } from '../lib/i18n';
import { LANGUAGES } from '../lib/i18n';

interface SettingsScreenProps {
  T: Translations;
  lang: LangCode;
  onSetLang: (code: LangCode) => void;
  weatherEnabled: boolean;
  onWeatherEnable: () => void;
  onWeatherDisable: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  T,
  lang,
  onSetLang,
  weatherEnabled,
  onWeatherEnable,
  onWeatherDisable,
  onBack,
}) => {
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 md:pb-12 pt-4 sm:pt-6 animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#e7e9e6] hover:bg-[#e1e3e0] text-[#4c6635] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-2xl font-bold text-[#191c1b] tracking-tight">{T.settings_title}</h2>
      </div>

      {/* Language */}
      <section className="bg-white rounded-2xl border border-[#e1e3e0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f1]">
          <div className="w-8 h-8 rounded-xl bg-[#cdecae]/60 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#4c6635]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#191c1b]">{T.settings_language}</p>
            <p className="text-xs text-[#74796d]">{T.settings_languageSub}</p>
          </div>
        </div>

        {/* Current language + picker toggle */}
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#f8faf7] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentLang?.flag}</span>
            <span className="text-sm font-medium text-[#191c1b]">
              {currentLang?.label} — {currentLang?.nativeLabel}
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 text-[#74796d] transition-transform duration-200 ${showLangPicker ? 'rotate-90' : ''}`} />
        </button>

        {/* Language picker */}
        {showLangPicker && (
          <div className="border-t border-[#f2f4f1] animate-fade-in">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  onSetLang(language.code);
                  setShowLangPicker(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f8faf7] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{language.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#191c1b]">{language.label}</p>
                    <p className="text-xs text-[#74796d]">{language.nativeLabel}</p>
                  </div>
                </div>
                {lang === language.code && (
                  <Check className="w-4 h-4 text-[#4c6635]" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Weather Alerts */}
      <section className="bg-white rounded-2xl border border-[#e1e3e0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f1]">
          <div className="w-8 h-8 rounded-xl bg-[#dde5d8]/60 flex items-center justify-center">
            <CloudSun className="w-4 h-4 text-[#4c6635]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#191c1b]">{T.settings_weather}</p>
            <p className="text-xs text-[#74796d]">{T.settings_weatherSub}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-[#44483e]">{T.settings_weatherEnable}</span>
          <button
            onClick={weatherEnabled ? onWeatherDisable : onWeatherEnable}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
              weatherEnabled ? 'bg-[#4c6635]' : 'bg-[#c4c8ba]'
            }`}
            aria-label={T.settings_weatherEnable}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                weatherEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-[#e1e3e0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f1]">
          <div className="w-8 h-8 rounded-xl bg-[#fde8e8]/60 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#191c1b]">{T.settings_notifications}</p>
            <p className="text-xs text-[#74796d]">{T.settings_notifSub}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-[#44483e]">{T.settings_careReminders}</span>
          <span className="text-xs text-[#74796d] bg-[#f2f4f1] px-2.5 py-1 rounded-full">
            {T.settings_careRemindersSub}
          </span>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white rounded-2xl border border-[#e1e3e0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f1]">
          <div className="w-8 h-8 rounded-xl bg-[#fff9c4]/60 flex items-center justify-center">
            <Sun className="w-4 h-4 text-[#b08000]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#191c1b]">{T.settings_theme}</p>
            <p className="text-xs text-[#74796d]">{T.settings_themeSub}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-[#44483e]">{T.settings_themeSub}</span>
          <div className="w-8 h-8 rounded-full bg-[#f8faf7] border border-[#e1e3e0] flex items-center justify-center">
            <Sun className="w-4 h-4 text-[#4c6635]" />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-2xl border border-[#e1e3e0] overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f4f1]">
          <div className="w-8 h-8 rounded-xl bg-[#e7f0e1]/60 flex items-center justify-center">
            <Info className="w-4 h-4 text-[#4c6635]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#191c1b]">{T.settings_about}</p>
            <p className="text-xs text-[#74796d]">{T.settings_aboutSub}</p>
          </div>
        </div>
        <div className="px-4 py-3.5 space-y-1">
          <p className="text-sm font-medium text-[#191c1b]">Flora</p>
          <p className="text-xs text-[#74796d]">{T.settings_version}</p>
          <p className="text-xs text-[#74796d]">
            Powered by Supabase · Gemini AI · Open-Meteo
          </p>
        </div>
      </section>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-[#4c6635] hover:bg-[#354e1f] text-white font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {T.settings_saved}
            </span>
          ) : (
            T.save
          )}
        </button>
      </div>
    </div>
  );
};
