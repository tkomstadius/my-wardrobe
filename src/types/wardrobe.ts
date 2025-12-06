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
  wearCount: number; // Total wear count (initialWearCount + wearHistory.length)
  initialWearCount?: number; // Wear count before adding to app (for items already owned)
  wearHistory: Date[]; // Array of dates when item was worn in the app
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  isHandmade?: boolean;
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
  initialWearCount?: number;
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  isHandmade?: boolean;
  purchaseDate?: Date;
}
