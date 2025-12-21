import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface WeatherData {
  actualTemp: string;
  feelsLikeTemp: string;
  precipitation: string;
  timestamp: Date;
}

interface WeatherContextValue {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(
  undefined
);

interface WeatherProviderProps {
  children: ReactNode;
}

// Stockholm coordinates (can be made configurable later)
const DEFAULT_LATITUDE = 59.3294;
const DEFAULT_LONGITUDE = 18.0687;

// Cache weather data for 24 hours
const WEATHER_CACHE_DURATION = 24 * 60 * 60 * 1000;
const WEATHER_CACHE_KEY = "wardrobe_weather_cache";

function getCachedWeather(): WeatherData | null {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const cachedData: WeatherData = {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
    };

    // Check if cache is still valid (less than 24 hours old)
    const age = Date.now() - cachedData.timestamp.getTime();
    if (age < WEATHER_CACHE_DURATION) {
      return cachedData;
    }

    // Cache expired, remove it
    localStorage.removeItem(WEATHER_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to cache weather data:", error);
  }
}

async function fetchWeatherData(): Promise<WeatherData> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LATITUDE}&longitude=${DEFAULT_LONGITUDE}&current=temperature_2m,apparent_temperature,precipitation&forecast_days=1`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather data");
  }

  const weatherJson = await response.json();

  return {
    actualTemp: `${weatherJson.current.temperature_2m}°C`,
    feelsLikeTemp: `${weatherJson.current.apparent_temperature}°C`,
    precipitation: `${weatherJson.current.precipitation}mm`,
    timestamp: new Date(),
  };
}

export function WeatherProvider({ children }: WeatherProviderProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWeather = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData();
      setWeatherData(data);
      setCachedWeather(data);
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      setError("Failed to load weather data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch weather on mount, using cache if available
  useEffect(() => {
    const cached = getCachedWeather();
    if (cached) {
      // Use cached data immediately
      setWeatherData(cached);
      setIsLoading(false);
    } else {
      // No valid cache, fetch fresh data
      refreshWeather();
    }
  }, []);

  const value: WeatherContextValue = {
    weatherData,
    isLoading,
    error,
    refreshWeather,
  };

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
}

