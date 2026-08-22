import type { ItemCategory } from '../types/wardrobe';

export const CATEGORIES = [
  { id: 'tops' as const, title: 'Tops' },
  { id: 'bottoms' as const, title: 'Bottoms' },
  { id: 'dresses' as const, title: 'One piece' },
  { id: 'outerwear' as const, title: 'Outerwear' },
  { id: 'shoes' as const, title: 'Shoes' },
  { id: 'bags' as const, title: 'Bags' },
  { id: 'jewelry' as const, title: 'Jewelry' },
  { id: 'accessories' as const, title: 'Accessories' },
] as const;

export const CATEGORY_IDS = CATEGORIES.map((cat) => cat.id) as ItemCategory[];

// Create title lookup object for backwards compatibility
export const CATEGORY_TITLES: Record<ItemCategory, string> = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.id, cat.title]),
) as Record<ItemCategory, string>;

export const SUBCATEGORIES: Record<ItemCategory, readonly string[]> = {
  tops: [
    'T-Shirt',
    'Tank top',
    'West',
    'Long sleeve',
    'Shirt',
    'Sweatshirt',
    'Hoodie',
    'Sweater',
    'Cardigan',
    'Jacket',
    'Jeans jacket',
  ] as const,
  bottoms: ['Jeans', 'Slacks', 'Shorts', 'Skirt'] as const,
  dresses: ['Dress', 'Jumpsuit'] as const,
  outerwear: ['Jacket', 'Coat'] as const,
  shoes: ['Sneakers', 'Boots', 'Sandals', 'Heels'] as const,
  bags: ['Handbag', 'Backpack'] as const,
  jewelry: ['Necklace', 'Earrings', 'Bracelet', 'Ring'] as const,
  accessories: ['Hat', 'Belt', 'Glasses', 'Sunglasses'] as const,
} as const;

export function getSubCategoriesForCategory(category: ItemCategory): readonly string[] {
  return SUBCATEGORIES[category] || [];
}

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
