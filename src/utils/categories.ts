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

// Subcategories per category
export const SUBCATEGORIES: Record<ItemCategory, readonly string[]> = {
  tops: [
    "T-Shirt",
    "Shirt",
    "Sweater",
    "Cardigan",
    "Hoodie",
    "Long sleeve",    
  ] as const,
  bottoms: [
    "Jeans",
    "Slacks",
    "Shorts",
    "Skirt",
  ] as const,
  dresses: [
    "Dress",
    "Jumpsuit",
  ] as const,
  outerwear: [
    "Jacket",
    "Coat",
  ] as const,
  shoes: [
    "Sneakers",
    "Boots",
    "Heels",
  ] as const,
  bags: [
    "Handbag",
    "Backpack",
  ] as const,
  jewelry: [
    "Necklace",
    "Earrings",
    "Bracelet",
    "Ring",
  ] as const,
  accessories: [
    "Hat",
    "Belt",
    "Sunglasses",
  ] as const,
} as const;

// Get subcategories for a specific category
export function getSubCategoriesForCategory(
  category: ItemCategory
): readonly string[] {
  return SUBCATEGORIES[category] || [];
}

// Get all unique subcategories across all categories
export function getAllSubCategories(): string[] {
  const allSubCategories = new Set<string>();
  for (const subCategories of Object.values(SUBCATEGORIES)) {
    for (const subCategory of subCategories) {
      allSubCategories.add(subCategory);
    }
  }
  return Array.from(allSubCategories).sort();
}

// Type for valid subcategories (union of all possible subcategories)
export type ItemSubCategory =
  | (typeof SUBCATEGORIES.tops)[number]
  | (typeof SUBCATEGORIES.bottoms)[number]
  | (typeof SUBCATEGORIES.dresses)[number]
  | (typeof SUBCATEGORIES.outerwear)[number]
  | (typeof SUBCATEGORIES.shoes)[number]
  | (typeof SUBCATEGORIES.bags)[number]
  | (typeof SUBCATEGORIES.jewelry)[number]
  | (typeof SUBCATEGORIES.accessories)[number];
