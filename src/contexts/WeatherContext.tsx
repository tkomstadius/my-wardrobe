import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

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

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

// Stockholm coordinates (can be made configurable later)
const DEFAULT_LATITUDE = 59.3294;
const DEFAULT_LONGITUDE = 18.0687;

async function fetchWeatherData(): Promise<WeatherData> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LATITUDE}&longitude=${DEFAULT_LONGITUDE}&current=temperature_2m,apparent_temperature,precipitation&forecast_days=1`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
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

  const refreshWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData();
      setWeatherData(data);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Failed to load weather data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  const value: WeatherContextValue = {
    weatherData,
    isLoading,
    error,
    refreshWeather,
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
