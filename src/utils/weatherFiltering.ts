import type { WeatherData } from '../contexts/WeatherContext';
import type { WardrobeItem } from '../types/wardrobe';

/**
 * Parse temperature from weather string (e.g., "20°C" -> 20)
 */
function parseTemperature(tempString: string): number | null {
  const match = tempString.match(/^(-?\d+(?:\.\d+)?)/);
  if (!match || !match[1]) return null;
  return parseFloat(match[1]);
}

// Subcategories that are inappropriate for cold weather (< 10°C)
const COLD_WEATHER_EXCLUDE = new Set([
  'shorts',
  'sandals',
  'tank top',
  // Normalize to lowercase for comparison
]);

// Additional exclusions for hot weather (> 25°C)
const HOT_WEATHER_EXCLUDE = new Set(['sweater', 'boots', 'hoodie', 'sweatshirt']);

/**
 * Check if an item is appropriate for the current weather
 * Only filters obvious seasonal items - most items are year-round
 */
function isItemAppropriateForWeather(item: WardrobeItem, temperature: number): boolean {
  const subCategory = item.subCategory?.toLowerCase() || '';
  const category = item.category;

  // Cold weather (< 10°C): exclude shorts, sandals, tank tops
  if (temperature < 10) {
    if (COLD_WEATHER_EXCLUDE.has(subCategory)) {
      return false;
    }
  }

  // Warm weather (> 20°C): exclude outerwear (jackets, coats)
  if (temperature > 20) {
    if (category === 'outerwear') {
      return false;
    }
  }

  // Hot weather (> 25°C): also exclude heavy sweaters, boots
  if (temperature > 25) {
    if (HOT_WEATHER_EXCLUDE.has(subCategory)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter items based on current weather conditions
 * Returns all items if no weather data is available
 */
export function filterItemsForWeather(
  items: WardrobeItem[],
  weatherData: WeatherData | null,
): WardrobeItem[] {
  if (!weatherData) {
    return items;
  }

  const temperature = parseTemperature(weatherData.actualTemp);
  if (temperature === null) {
    return items;
  }

  return items.filter((item) => isItemAppropriateForWeather(item, temperature));
}
