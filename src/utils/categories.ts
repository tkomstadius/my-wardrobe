import type { ItemCategory } from "../types/wardrobe";

// Single source of truth for category definitions
export const CATEGORIES = [
  { id: "tops" as const, title: "Tops" },
  { id: "bottoms" as const, title: "Bottoms" },
  { id: "dresses" as const, title: "Dresses & Jumpsuits" },
  { id: "outerwear" as const, title: "Outerwear" },
  { id: "shoes" as const, title: "Shoes" },
  { id: "bags" as const, title: "Bags" },
  { id: "jewelry" as const, title: "Jewelry" },
  { id: "accessories" as const, title: "Accessories" },
] as const;

// Extract just the category IDs for validation
export const CATEGORY_IDS = CATEGORIES.map((cat) => cat.id) as ItemCategory[];

// Create title lookup object for backwards compatibility
export const CATEGORY_TITLES: Record<ItemCategory, string> = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.id, cat.title])
) as Record<ItemCategory, string>;
