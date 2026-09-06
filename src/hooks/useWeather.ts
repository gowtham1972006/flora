import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type WeatherData,
  type WeatherAlert,
  fetchWeather,
  saveWeatherCache,
  loadWeatherCache,
  isWeatherEnabled,
  setWeatherEnabled,
  wasAlertSentToday,
  markAlertSent,
} from '../lib/weather';
import { addNotification } from '../lib/notifications';
import { getTranslations } from '../lib/i18n';
import type { LangCode } from '../lib/i18n';

// ─── Constants ────────────────────────────────────────────────────────────────
const STALE_THRESHOLD_MS  = 10 * 60 * 1000; // 10 min  → trigger background refresh
const AUTO_REFRESH_MS     = 20 * 60 * 1000; // 20 min  → periodic auto-refresh interval

export interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
  permissionDenied: boolean;
  enable: () => void;
  disable: () => void;
  refresh: () => void;
}

// ─── FIX 2: Push garden alerts to Supabase notifications (once per alert/day) ─
async function pushAlertNotifications(
  userId: string,
  data: WeatherData,
  lang: LangCode
): Promise<void> {
  const T = getTranslations(lang);
  const city = data.coords.city ?? 'Your Location';

  for (const alert of data.alerts) {
    const dedupKey = `${alert.id}_${new Date().toDateString()}`;
    if (wasAlertSentToday(dedupKey)) continue;

    markAlertSent(dedupKey);

    const alertMessages: Record<string, string> = {
      weather_alertHeat:     T.weather_alertHeat,
      weather_alertFrost:    T.weather_alertFrost,
      weather_alertRain:     T.weather_alertRain,
      weather_alertDrought:  T.weather_alertDrought,
      weather_alertWind:     T.weather_alertWind,
      weather_alertHumidity: T.weather_alertHumidity,
    };

    const message = `${alertMessages[alert.messageKey] ?? alert.messageKey} (${city}, ${data.current.temp}°C)`;

    addNotification(userId, T.weather_title, message, 'warning').catch(() => {
      // Non-fatal — alert will not be retried today
    });
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWeather(
  userId?: string | null,
  lang: LangCode = 'en'
): UseWeatherResult {
  const [data, setData]                   = useState<WeatherData | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [enabled, setEnabled]             = useState(() => isWeatherEnabled());
  const [permissionDenied, setPermDenied] = useState(false);

  const fetchingRef  = useRef(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const doFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const result = await fetchWeather();
      setData(result);
      saveWeatherCache(result);
      setPermDenied(false);
      setError(null);
      // FIX 2: push any new alerts to Supabase notifications
      if (userId) {
        pushAlertNotifications(userId, result, lang);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('not supported')) {
        setPermDenied(true);
      }
      setError(msg);
    } finally {
      fetchingRef.current = false;
    }
  }, [userId, lang]);

  // ── Load with cache-then-fetch strategy (FIX 3) ────────────────────────────
  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!force) {
        const cached = loadWeatherCache();
        if (cached) {
          setData(cached);
          // FIX 3: if cached but stale (>10 min), background-refresh silently
          if (Date.now() - cached.fetchedAt > STALE_THRESHOLD_MS) {
            doFetch(); // fire and forget — don't await
          }
          return;
        }
      }
      await doFetch();
    } finally {
      setLoading(false);
    }
  }, [doFetch]);

  // ── Auto-load + FIX 3 periodic setInterval refresh ────────────────────────
  useEffect(() => {
    if (!enabled || !userId) {
      // Clear interval and data when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!enabled) {
        setData(null);
        setError(null);
        setPermDenied(false);
      }
      return;
    }

    // Initial load
    load();

    // FIX 3: periodic auto-refresh every 20 min
    intervalRef.current = setInterval(() => {
      doFetch(); // always fetch fresh on interval tick
    }, AUTO_REFRESH_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const enable = useCallback(() => {
    setWeatherEnabled(true);
    setEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setWeatherEnabled(false);
    setEnabled(false);
  }, []);

  const refresh = useCallback(() => {
    if (enabled) load(true);
  }, [enabled, load]);

  return { data, loading, error, enabled, permissionDenied, enable, disable, refresh };
}
