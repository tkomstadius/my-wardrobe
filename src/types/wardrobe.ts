export type ItemCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "accessories"
  | "shoes"
  | "dresses"
  | "bags"
  | "jewelry";

export type ItemTrait = "comfort" | "confidence" | "creative";

// Subcategory is kept as string for backward compatibility with existing data
// but should ideally match one of the predefined subcategories for the category
export type WardrobeItem = {
  id: string;
  imageUrl: string;
  notes?: string;
  brand?: string;
  category: ItemCategory;
  subCategory?: string; // Should match a predefined subcategory for the category
  wearCount: number; // Total wear count (initialWearCount + wearHistory.length)
  initialWearCount?: number; // Wear count before adding to app (for items already owned)
  wearHistory: Date[]; // Array of dates when item was worn in the app
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  isHandmade?: boolean;
  trait?: ItemTrait; // What vibe does this item give? (comfort, confidence, creative)
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[]; // CLIP embedding vector (512 dimensions) for AI matching
};

export type NewWardrobeItem = Omit<
  WardrobeItem,
  "id" | "createdAt" | "updatedAt" | "wearCount" | "wearHistory"
>;

export type AddItemFormState = Partial<
  Omit<
    NewWardrobeItem,
    "imageUrl" | "embedding" | "price" | "purchaseDate" | "initialWearCount"
  > & {
    price?: string;
    purchaseDate?: string;
    initialWearCount?: string;
  }
>;

export type EditItemFormState = Omit<
  NewWardrobeItem,
  "imageUrl" | "embedding" | "price" | "purchaseDate" | "initialWearCount"
> & {
  price?: string;
  purchaseDate?: string;
  initialWearCount?: string;
};
