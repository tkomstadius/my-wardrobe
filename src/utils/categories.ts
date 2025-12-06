import type { ItemCategory } from "../types/wardrobe";

export const CATEGORY_TITLES: Record<ItemCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses & Jumpsuits",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessories: "Accessories",
};

export const CATEGORIES: Array<{ id: ItemCategory; title: string }> = [
  { id: "tops", title: CATEGORY_TITLES.tops },
  { id: "bottoms", title: CATEGORY_TITLES.bottoms },
  { id: "dresses", title: CATEGORY_TITLES.dresses },
  { id: "outerwear", title: CATEGORY_TITLES.outerwear },
  { id: "shoes", title: CATEGORY_TITLES.shoes },
  { id: "accessories", title: CATEGORY_TITLES.accessories },
];

