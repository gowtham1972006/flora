// ─── Flora Weather Service ────────────────────────────────────────────────
// Provider: Open-Meteo (https://open-meteo.com) — FREE, no API key
// Geocoding: Nominatim/OpenStreetMap — FREE, no API key
// Cache: localStorage, 20-minute TTL

export interface WeatherCoords {
  lat: number;
  lon: number;
  city?: string;
}

export interface WeatherCurrent {
  temp: number;           // °C
  feelsLike: number;      // °C
  humidity: number;       // %
  windSpeed: number;      // km/h
  weatherCode: number;    // WMO code
  description: string;
  icon: string;           // emoji
  isDay: boolean;
}

export interface WeatherAlert {
  id: string;
  type: 'heat' | 'frost' | 'rain' | 'drought' | 'wind' | 'humidity';
  severity: 'warning' | 'info';
  messageKey: string;    // key in Translations
}

export interface WeatherData {
  coords: WeatherCoords;
  current: WeatherCurrent;
  alerts: WeatherAlert[];
  fetchedAt: number;
}

// ─── WMO weather code → description + emoji ───────────────────────────────────
function decodeWeatherCode(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: '☀️' };
  if (code <= 2) return { description: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { description: 'Overcast', icon: '☁️' };
  if (code <= 49) return { description: 'Foggy', icon: '🌫️' };
  if (code <= 59) return { description: 'Drizzle', icon: '🌦️' };
  if (code <= 69) return { description: 'Rain', icon: '🌧️' };
  if (code <= 79) return { description: 'Snow', icon: '❄️' };
  if (code <= 84) return { description: 'Rain showers', icon: '🌧️' };
  if (code <= 94) return { description: 'Thunderstorm', icon: '⛈️' };
  return { description: 'Thunderstorm with hail', icon: '🌩️' };
}

// ─── Garden alerts from weather conditions ────────────────────────────────────
// Thresholds exactly match the deployed Flora bundle (Jw function)
function buildAlerts(w: WeatherCurrent): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Heat stress: >= 35°C
  if (w.temp >= 35) {
    alerts.push({ id: 'heat', type: 'heat', severity: 'warning', messageKey: 'weather_alertHeat' });
  }
  // Frost risk: <= 2°C (deployed threshold)
  if (w.temp <= 2) {
    alerts.push({ id: 'frost', type: 'frost', severity: 'warning', messageKey: 'weather_alertFrost' });
  }
  // Rain: specific WMO heavy rain / storm codes (deployed uses exact list, not range)
  const RAIN_CODES = [63, 65, 73, 75, 82, 95, 96, 99];
  if (RAIN_CODES.includes(w.weatherCode)) {
    alerts.push({ id: 'rain', type: 'rain', severity: 'info', messageKey: 'weather_alertRain' });
  }
  // Drought: humidity < 25% AND temp > 28°C
  if (w.humidity < 25 && w.temp > 28) {
    alerts.push({ id: 'drought', type: 'drought', severity: 'warning', messageKey: 'weather_alertDrought' });
  }
  // Strong wind: >= 40 km/h
  if (w.windSpeed >= 40) {
    alerts.push({ id: 'wind', type: 'wind', severity: 'warning', messageKey: 'weather_alertWind' });
  }
  // High humidity: >= 85% AND temp >= 18°C (avoids false positives in cold, dry conditions)
  if (w.humidity >= 85 && w.temp >= 18) {
    alerts.push({ id: 'humidity', type: 'humidity', severity: 'info', messageKey: 'weather_alertHumidity' });
  }

  return alerts;
}

// ─── Geolocation ─────────────────────────────────────────────────────────────
export function requestGeolocation(): Promise<WeatherCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { timeout: 10_000, maximumAge: 300_000 }
    );
  });
}

// ─── Reverse geocode with Nominatim ──────────────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return (
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.county ??
      'Your Location'
    );
  } catch {
    return 'Your Location';
  }
}

// ─── Fetch weather from Open-Meteo ───────────────────────────────────────────
async function fetchOpenMeteo(coords: WeatherCoords): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(coords.lat));
  url.searchParams.set('longitude', String(coords.lon));
  url.searchParams.set(
    'current',
    ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'wind_speed_10m', 'weather_code', 'is_day'].join(',')
  );
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const json = await res.json();
  const c = json.current;
  const { description, icon } = decodeWeatherCode(c.weather_code);

  const current: WeatherCurrent = {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    weatherCode: c.weather_code,
    description,
    icon,
    isDay: c.is_day === 1,
  };

  return {
    coords,
    current,
    alerts: buildAlerts(current),
    fetchedAt: Date.now(),
  };
}

// ─── Public: fetch complete weather (geolocation + geocode + weather) ─────────
export async function fetchWeather(): Promise<WeatherData> {
  const coords = await requestGeolocation();
  const city = await reverseGeocode(coords.lat, coords.lon);
  return fetchOpenMeteo({ ...coords, city });
}

// ─── localStorage cache ───────────────────────────────────────────────────────
const WEATHER_KEY     = 'Flora_weather';
const ENABLED_KEY     = 'Flora_weather_enabled';
const SENT_ALERTS_KEY = 'Flora_sent_alerts';
const CACHE_TTL_MS    = 20 * 60 * 1000; // 20 minutes

export function saveWeatherCache(data: WeatherData): void {
  try { localStorage.setItem(WEATHER_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function loadWeatherCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_KEY);
    if (!raw) return null;
    const data: WeatherData = JSON.parse(raw);
    return Date.now() - data.fetchedAt > CACHE_TTL_MS ? null : data;
  } catch { return null; }
}

export function isWeatherEnabled(): boolean {
  try { return localStorage.getItem(ENABLED_KEY) === 'true'; } catch { return false; }
}

export function setWeatherEnabled(enabled: boolean): void {
  try { localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false'); } catch { /* ignore */ }
}

export function wasAlertSentToday(alertId: string): boolean {
  try {
    const raw = localStorage.getItem(SENT_ALERTS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const ts = map[alertId] ?? 0;
    return Date.now() - ts < 24 * 60 * 60 * 1000;
  } catch { return false; }
}

export function markAlertSent(alertId: string): void {
  try {
    const raw = localStorage.getItem(SENT_ALERTS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[alertId] = Date.now();
    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}
