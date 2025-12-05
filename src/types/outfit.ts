export interface Outfit {
  id: string;
  photo?: string; // Data URL of outfit photo
  itemIds: string[]; // IDs of wardrobe items in this outfit
  wornDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields and make wornDate optional
export type NewOutfit = Omit<Outfit, 'id' | 'createdAt' | 'updatedAt' | 'wornDate'> & {
  wornDate?: Date;
};

