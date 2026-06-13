import { getRecentThemes } from "./db";

export interface WeatherContext {
  condition: string;
  temp: string;
  mood: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface AppContext {
  day: string;
  timeOfDay: string;
  location: string;
  weather: WeatherContext;
  recentThemes: string[];
}

export const DEFAULT_COORDINATES: GeoCoordinates = {
  latitude: 5.676,
  longitude: -0.136,
};

export const DEFAULT_LOCATION_NAME = "Ashaley Botwe";

const NOMINATIM_USER_AGENT = "Companion/1.0 (personal message app)";

interface PrecipSample {
  mm: number;
  is15Min: boolean;
  code?: number;
}

function wmoToCondition(code: number): string {
  if (code === 0) return "clear sky";
  if (code === 1) return "mainly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code === 61 || code === 80) return "light rain";
  if (code === 63 || code === 81) return "rainy";
  if (code === 65 || code === 82) return "heavy rain";
  if (code >= 56 && code <= 57) return "freezing drizzle";
  if (code >= 66 && code <= 67) return "freezing rain";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 85 && code <= 86) return "snow showers";
  if (code >= 95 && code <= 99) return "stormy";
  return "cloudy";
}

function isRainCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  );
}

function totalPrecipMm(
  precipitation: number,
  rain: number,
  showers: number
): number {
  return Math.max(precipitation ?? 0, (rain ?? 0) + (showers ?? 0));
}

function conditionFromPrecip(mm: number, is15Min: boolean): string | null {
  if (mm <= 0) return null;

  if (is15Min) {
    if (mm >= 2.5) return "heavy rain";
    if (mm >= 0.8) return "rainy";
    if (mm >= 0.15) return "light rain";
    return "drizzle";
  }

  if (mm >= 4) return "heavy rain";
  if (mm >= 1.5) return "rainy";
  if (mm >= 0.3) return "light rain";
  return "drizzle";
}

function resolveCondition(samples: PrecipSample[]): string {
  let bestCondition: string | null = null;
  let bestScore = 0;

  for (const sample of samples) {
    const fromPrecip = conditionFromPrecip(sample.mm, sample.is15Min);
    if (!fromPrecip) continue;

    const score = sample.is15Min ? sample.mm * 4 : sample.mm;
    if (score > bestScore) {
      bestScore = score;
      bestCondition = fromPrecip;
    }
  }

  if (bestCondition) return bestCondition;

  const codes = samples
    .map((sample) => sample.code)
    .filter((code): code is number => typeof code === "number");

  const rainCode = codes.find(isRainCode);
  if (rainCode != null) return wmoToCondition(rainCode);

  const fallbackCode = codes.find((code) => code != null) ?? 3;
  return wmoToCondition(fallbackCode);
}

function conditionToMood(condition: string): string {
  const lower = condition.toLowerCase();
  if (
    lower.includes("clear") ||
    lower.includes("sunny") ||
    lower.includes("mainly clear")
  ) {
    return "bright";
  }
  if (
    lower.includes("rain") ||
    lower.includes("drizzle") ||
    lower.includes("shower")
  ) {
    return "cosy";
  }
  if (lower.includes("storm") || lower.includes("thunder")) {
    return "dramatic";
  }
  if (lower.includes("fog")) {
    return "reflective";
  }
  if (lower.includes("cloud") || lower.includes("overcast")) {
    return "quiet";
  }
  return "quiet";
}

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function forecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: "auto",
    current:
      "temperature_2m,weathercode,precipitation,rain,showers",
    hourly: "weathercode,precipitation,rain,showers",
    minutely_15: "precipitation,weathercode",
    past_hours: "2",
    forecast_hours: "2",
    forecast_minutes: "120",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function localDayAndTime(timezone: string): { day: string; timeOfDay: string } {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: timezone,
  });
  const hour = parseInt(
    now.toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }),
    10
  );
  return { day, timeOfDay: getTimeOfDay(hour) };
}

function fallbackWeather(): WeatherContext {
  return {
    condition: "partly cloudy",
    temp: "28°C",
    mood: "quiet",
  };
}

function findTimeIndex(times: string[], currentTime: string): number {
  let index = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= currentTime) index = i;
    else break;
  }
  return index;
}

function collectPrecipSamples(data: {
  current?: {
    time?: string;
    weathercode?: number;
    precipitation?: number;
    rain?: number;
    showers?: number;
  };
  hourly?: {
    time?: string[];
    weathercode?: number[];
    precipitation?: number[];
    rain?: number[];
    showers?: number[];
  };
  minutely_15?: {
    time?: string[];
    weathercode?: number[];
    precipitation?: number[];
  };
}): PrecipSample[] {
  const samples: PrecipSample[] = [];
  const current = data.current;

  if (current) {
    samples.push({
      mm: totalPrecipMm(
        current.precipitation ?? 0,
        current.rain ?? 0,
        current.showers ?? 0
      ),
      is15Min: true,
      code: current.weathercode,
    });
  }

  const hourly = data.hourly;
  if (hourly?.time?.length && current?.time) {
    const index = findTimeIndex(hourly.time, current.time);
    for (const offset of [0, -1, 1]) {
      const slot = index + offset;
      if (slot < 0 || slot >= hourly.time.length) continue;
      samples.push({
        mm: totalPrecipMm(
          hourly.precipitation?.[slot] ?? 0,
          hourly.rain?.[slot] ?? 0,
          hourly.showers?.[slot] ?? 0
        ),
        is15Min: false,
        code: hourly.weathercode?.[slot],
      });
    }
  }

  const minutely = data.minutely_15;
  if (minutely?.time?.length && current?.time) {
    const index = findTimeIndex(minutely.time, current.time);
    for (const offset of [0, -1, 1, 2]) {
      const slot = index + offset;
      if (slot < 0 || slot >= minutely.time.length) continue;
      samples.push({
        mm: minutely.precipitation?.[slot] ?? 0,
        is15Min: true,
        code: minutely.weathercode?.[slot],
      });
    }
  }

  return samples;
}

async function fetchWeatherAt(
  latitude: number,
  longitude: number
): Promise<{ weather: WeatherContext; timezone: string }> {
  try {
    const response = await fetch(forecastUrl(latitude, longitude), {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    const temp = data.current?.temperature_2m;
    const samples = collectPrecipSamples(data);
    const condition = resolveCondition(samples);
    const timezone =
      typeof data.timezone === "string" ? data.timezone : "UTC";

    return {
      timezone,
      weather: {
        condition,
        temp: temp != null ? `${Math.round(temp)}°C` : "warm",
        mood: conditionToMood(condition),
      },
    };
  } catch {
    return { weather: fallbackWeather(), timezone: "UTC" };
  }
}

function formatLocationName(name: string): string {
  return name
    .replace(/\bDzorm\b/i, "Dzorn")
    .replace(/\s+/g, " ")
    .trim();
}

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", latitude.toString());
    url.searchParams.set("lon", longitude.toString());
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    const data = await response.json();
    const address = data.address ?? {};
    const name =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state;

    if (typeof name === "string" && name.trim()) {
      return formatLocationName(name.trim());
    }

    return "your area";
  } catch {
    return DEFAULT_LOCATION_NAME;
  }
}

export function isValidCoordinates(
  value: unknown
): value is GeoCoordinates {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as Record<string, unknown>;
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export async function buildContext(
  coordinates?: GeoCoordinates
): Promise<AppContext> {
  const { latitude, longitude } = coordinates ?? DEFAULT_COORDINATES;
  const usingDefault = !coordinates;

  const [{ weather, timezone }, location] = await Promise.all([
    fetchWeatherAt(latitude, longitude),
    usingDefault
      ? Promise.resolve(DEFAULT_LOCATION_NAME)
      : reverseGeocode(latitude, longitude),
  ]);

  const { day, timeOfDay } = localDayAndTime(timezone);
  const recentThemes = getRecentThemes(10);

  return {
    day,
    timeOfDay,
    location,
    weather,
    recentThemes,
  };
}
