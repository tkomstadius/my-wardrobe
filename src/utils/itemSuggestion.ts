import type { WardrobeItem } from "../types/wardrobe";
import { getNeglectedItems, isWornToday } from "./wardrobeFilters";
import type { WeatherData } from "../contexts/WeatherContext";

/**
 * Suggest a single item to wear today
 * Considers: neglected items, items not worn today, weather, ratings
 */
export function suggestItem(
  items: WardrobeItem[],
  weatherData: WeatherData | null
): WardrobeItem | null {
  if (items.length === 0) {
    return null;
  }

  // Filter out items worn today
  const availableItems = items.filter((item) => !isWornToday(item));

  if (availableItems.length === 0) {
    // If all items are worn today, just return a random one
    return items[Math.floor(Math.random() * items.length)] || null;
  }

  // Get temperature from weather (extract number from "20°C")
  const temperature = weatherData
    ? parseFloat(weatherData.actualTemp.replace("°C", ""))
    : null;

  // Score each item based on various factors
  const scoredItems = availableItems.map((item) => {
    let score = 0;

    // Neglected items get higher priority (haven't been worn in 30+ days)
    const neglectedItems = getNeglectedItems([item], 30);
    if (neglectedItems.length > 0) {
      score += 50;
    }

    // Items never worn get high priority
    if (!item.wearHistory || item.wearHistory.length === 0) {
      score += 40;
    } else {
      // Items worn less frequently get higher priority
      const daysSinceWorn = item.wearHistory.length > 0
        ? Math.floor(
            (Date.now() - new Date(item.wearHistory[item.wearHistory.length - 1]!).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Infinity;
      
      // Boost score based on days since last worn (up to 30 days)
      score += Math.min(daysSinceWorn, 30);
    }

    // Items with good ratings get a boost
    if (item.rating === 1) {
      score += 20;
    } else if (item.rating === 0) {
      score += 5;
    }

    // Weather-based suggestions (simple heuristic)
    if (temperature !== null) {
      const category = item.category;
      
      // Cold weather: favor outerwear, less favor tops/shoes
      if (temperature < 10) {
        if (category === "outerwear") score += 15;
        if (category === "tops") score += 5;
        if (category === "shoes") score += 5;
      }
      // Moderate weather: balanced
      else if (temperature >= 10 && temperature < 20) {
        score += 5; // Small boost for all items
      }
      // Warm weather: favor lighter categories
      else if (temperature >= 20) {
        if (category === "tops") score += 10;
        if (category === "dresses") score += 10;
        if (category === "outerwear") score -= 10; // Less likely in warm weather
      }
    }

    // Recently added items get a small boost (encourage trying new items)
    const daysSinceAdded = Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceAdded < 7) {
      score += 10;
    }

    return { item, score };
  });

  // Sort by score (highest first)
  scoredItems.sort((a, b) => b.score - a.score);

  // Pick from top 3 candidates (adds some randomness)
  const topCandidates = scoredItems.slice(0, 3);
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  return selected?.item || null;
}

