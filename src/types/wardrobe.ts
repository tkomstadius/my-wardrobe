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
  type: string;
  color: string;
  brand?: string;
  category: ItemCategory;
  wearCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewWardrobeItem {
  imageUrl: string;
  type: string;
  color: string;
  brand?: string;
  category: ItemCategory;
}
