import { getRecentThemes } from "./db";

export interface WeatherContext {
  condition: string;
  temp: string;
  mood: string;
}

export interface AppContext {
  day: string;
  timeOfDay: string;
  weather: WeatherContext;
  recentThemes: string[];
}

const ACCRA_FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=5.6037&longitude=-0.1870&current=temperature_2m,weathercode&timezone=Africa/Accra";

function wmoToCondition(code: number): string {
  if (code === 0) return "clear sky";
  if (code === 1) return "mainly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 85 && code <= 86) return "snow showers";
  if (code >= 95 && code <= 99) return "stormy";
  return "cloudy";
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

async function fetchWeather(): Promise<WeatherContext> {
  try {
    const response = await fetch(ACCRA_FORECAST_URL, {
      next: { revalidate: 1800 },
    });
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    const data = await response.json();
    const temp = data.current?.temperature_2m;
    const code = data.current?.weathercode ?? 3;
    const condition = wmoToCondition(code);
    return {
      condition,
      temp: temp != null ? `${Math.round(temp)}°C` : "warm",
      mood: conditionToMood(condition),
    };
  } catch {
    return {
      condition: "partly cloudy",
      temp: "28°C",
      mood: "quiet",
    };
  }
}

export async function buildContext(): Promise<AppContext> {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Africa/Accra",
  });
  const hour = parseInt(
    now.toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Accra",
    }),
    10
  );
  const timeOfDay = getTimeOfDay(hour);
  const weather = await fetchWeather();
  const recentThemes = getRecentThemes(10);

  return {
    day,
    timeOfDay,
    weather,
    recentThemes,
  };
}
