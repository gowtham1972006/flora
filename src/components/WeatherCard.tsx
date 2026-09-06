import React from 'react';
import { MapPin, Droplets, Wind, Thermometer, CloudSun, RefreshCw } from 'lucide-react';
import type { UseWeatherResult } from '../hooks/useWeather';
import type { Translations } from '../lib/i18n';

interface WeatherCardProps {
  weather: UseWeatherResult;
  T: Translations;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, T }) => {
  const { data, loading, error, enabled, permissionDenied, enable, refresh } = weather;

  // ── Not enabled ───────────────────────────────────────────────────────────────
  if (!enabled) {
    return (
      <section className="animate-fade-in">
        <div className="bg-gradient-to-r from-[#e8f5fd] to-[#d6ecf3] border border-[#93c5d3]/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌤️</span>
            <div>
              <p className="text-sm font-semibold text-[#191c1b]">{T.weather_title}</p>
              <p className="text-xs text-[#44483e]">{T.weather_enableLocation}</p>
            </div>
          </div>
          <button
            onClick={enable}
            className="shrink-0 px-3 py-2 bg-[#4c6635] text-white text-xs font-semibold rounded-xl hover:bg-[#354e1f] active:scale-95 transition-all cursor-pointer"
          >
            {T.weather_enableBtn}
          </button>
        </div>
      </section>
    );
  }

  // ── Permission denied ─────────────────────────────────────────────────────────
  if (permissionDenied) {
    return (
      <section className="animate-fade-in">
        <div className="bg-[#fff8e1] border border-[#f0c000]/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <p className="text-xs text-[#44483e] flex-1">{T.weather_enableLocation}</p>
        </div>
      </section>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <section className="animate-fade-in">
        <div className="bg-white border border-[#e1e3e0] rounded-2xl p-4 flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-[#e7e9e6]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#e7e9e6] rounded w-1/3" />
            <div className="h-3 bg-[#e7e9e6] rounded w-1/4" />
          </div>
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <section className="animate-fade-in">
        <div className="bg-white border border-[#e1e3e0] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-[#74796d]" />
            <p className="text-sm text-[#74796d]">{T.weather_error}</p>
          </div>
          <button
            onClick={refresh}
            className="text-xs text-[#4c6635] font-medium hover:underline cursor-pointer"
          >
            {T.retry}
          </button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { current, coords, alerts } = data;
  const hasAlerts = alerts.length > 0;
  const topAlert = alerts[0];

  // Map messageKey → translated string
  const alertMessages: Record<string, string> = {
    weather_alertHeat: T.weather_alertHeat,
    weather_alertFrost: T.weather_alertFrost,
    weather_alertRain: T.weather_alertRain,
    weather_alertDrought: T.weather_alertDrought,
    weather_alertWind: T.weather_alertWind,
    weather_alertHumidity: T.weather_alertHumidity,
  };

  return (
    <section className="animate-fade-in">
      <div
        className={`relative rounded-2xl border overflow-hidden ${
          hasAlerts
            ? 'bg-[#ffdad6]/40 border-[#ba1a1a]/20'
            : 'bg-gradient-to-r from-[#e8f5fd] to-[#d6ecf3] border-[#93c5d3]/30'
        }`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <CloudSun className="w-3.5 h-3.5 text-[#4c6635]" />
              <span className="text-xs font-bold text-[#4c6635] uppercase tracking-wider">{T.weather_title}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#191c1b] tracking-tight">{current.temp}°</span>
              <span className="text-xl">{current.icon}</span>
            </div>
            <p className="text-sm text-[#44483e] mt-0.5">{current.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {coords.city && (
              <div className="flex items-center gap-1 text-xs text-[#74796d]">
                <MapPin className="w-3 h-3" />
                <span>{coords.city}</span>
              </div>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh weather"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#74796d] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 px-4 pb-3">
          <div className="flex items-center gap-1 text-xs text-[#44483e]">
            <Thermometer className="w-3.5 h-3.5 text-[#74796d]" />
            <span>{T.weather_feelsLike} {current.feelsLike}°</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#44483e]">
            <Droplets className="w-3.5 h-3.5 text-[#74796d]" />
            <span>{T.weather_humidity} {current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#44483e]">
            <Wind className="w-3.5 h-3.5 text-[#74796d]" />
            <span>{T.weather_wind} {current.windSpeed} km/h</span>
          </div>
        </div>

        {/* Alert banner */}
        {hasAlerts && topAlert && (
          <div className="mx-4 mb-4 bg-white/70 rounded-xl px-3 py-2.5 border border-[#ba1a1a]/10">
            <p className="text-xs font-medium text-[#44483e] leading-relaxed">
              {alertMessages[topAlert.messageKey] ?? topAlert.messageKey}
            </p>
            {alerts.length > 1 && (
              <p className="text-[10px] text-[#74796d] mt-0.5">
                +{alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Good conditions */}
        {!hasAlerts && (
          <div className="mx-4 mb-4 bg-white/50 rounded-xl px-3 py-2">
            <p className="text-xs font-medium text-[#354e1f]">
              ✅ {T.weather_good} — {T.weather_goodSub}
            </p>
          </div>
        )}

        {/* Last updated */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#74796d]">
            {T.weather_lastUpdated} {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </section>
  );
};
