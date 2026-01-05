import type { WardrobeItem } from "../types/wardrobe";
import { getNeglectedItems, isWornToday } from "./wardrobeFilters";
import type { WeatherData } from "../contexts/WeatherContext";
import { differenceInDays } from "date-fns";

/**
 * Suggest a single item to wear today
 * Considers: neglected items, items not worn today, weather, ratings
 * Only suggests tops, bottoms, or dresses with weighted random selection
 */
export function suggestItem(
  items: WardrobeItem[],
  weatherData: WeatherData | null
): WardrobeItem | null {
  if (items.length === 0) {
    return null;
  }

  // Filter to only tops, bottoms, or dresses
  const relevantItems = items.filter(
    (item) =>
      item.category === "tops" ||
      item.category === "bottoms" ||
      item.category === "dresses"
  );

  if (relevantItems.length === 0) {
    return null;
  }

  // Filter out items worn today
  const availableItems = relevantItems.filter((item) => !isWornToday(item));

  if (availableItems.length === 0) {
    // If all relevant items are worn today, just return a random one from relevant items
    return (
      relevantItems[Math.floor(Math.random() * relevantItems.length)] || null
    );
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
      const lastWornDate = new Date(item.wearHistory.at(-1)!);
      const daysSinceWorn = differenceInDays(new Date(), lastWornDate);

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
        if (category === "tops") score += 5;
      }
      // Moderate weather: balanced
      else if (temperature >= 10 && temperature < 20) {
        score += 5; // Small boost for all items
      }
      // Warm weather: favor lighter categories
      else if (temperature >= 20) {
        if (category === "tops") score += 10;
        if (category === "dresses") score += 10;
      }
    }

    // Recently added items get a small boost (encourage trying new items)
    const daysSinceAdded = differenceInDays(
      new Date(),
      new Date(item.createdAt)
    );
    if (daysSinceAdded < 7) {
      score += 10;
    }

    return { item, score };
  });

  // Use weighted random selection for more variety
  // Normalize scores to be positive (add minimum score offset to ensure all positive)
  const minScore = Math.min(...scoredItems.map((s) => s.score));
  const offset = minScore < 0 ? Math.abs(minScore) + 1 : 1;

  // Calculate weights (higher score = higher weight, but all items have a chance)
  const weights = scoredItems.map((s) => s.score + offset);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // Pick a random item using weighted selection
  let random = Math.random() * totalWeight;
  for (let i = 0; i < scoredItems.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      return scoredItems[i]!.item;
    }
  }

  // Fallback to last item (shouldn't happen, but TypeScript safety)
  return scoredItems.at(-1)?.item || null;
}
