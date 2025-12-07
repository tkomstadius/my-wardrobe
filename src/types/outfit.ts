export interface Outfit {
  id: string;
  photo?: string; // Data URL of outfit photo
  itemIds: string[]; // IDs of wardrobe items in this outfit
  notes?: string;
  // Rating scales (1-5)
  comfortRating?: number; // How comfortable the outfit is
  confidenceRating?: number; // How confident you feel in it
  creativityRating?: number; // How creative/expressive the outfit is
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields, but allow createdAt to be set
export type NewOutfit = Omit<Outfit, "id" | "updatedAt"> & {
  createdAt?: Date;
};
