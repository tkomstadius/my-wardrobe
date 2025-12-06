export type ItemCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "accessories"
  | "shoes"
  | "dresses";

export interface WardrobeItem {
  id: string;
  imageUrl: string;
  notes?: string;
  brand?: string;
  category: ItemCategory;
  wearCount: number;
  wearHistory: Date[]; // Array of dates when item was worn
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewWardrobeItem {
  imageUrl: string;
  notes?: string;
  brand?: string;
  category: ItemCategory;
  wearCount?: number;
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  purchaseDate?: Date;
}
