export interface Outfit {
  id: string;
  photo?: string; // Data URL of outfit photo
  itemIds: string[]; // IDs of wardrobe items in this outfit
  notes?: string;
  rating?: number; // Overall rating (1-5)
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields, but allow createdAt to be set
export type NewOutfit = Omit<Outfit, "id" | "updatedAt"> & {
  createdAt?: Date;
};
