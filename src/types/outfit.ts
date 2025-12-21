export type OutfitRating = 1 | 0 | -1; // 1 = good, 0 = meh, -1 = nope

export interface WeatherInfo {
  actualTemp: string;
  feelsLikeTemp: string;
  precipitation: string;
}

export interface Outfit {
  id: string;
  photo?: string; // Data URL of outfit photo
  itemIds: string[]; // IDs of wardrobe items in this outfit
  notes?: string;
  rating?: OutfitRating; // Overall rating (1 = good, 0 = meh, -1 = nope)
  weather?: WeatherInfo; // Weather data when outfit was logged
  createdAt: Date;
  updatedAt: Date;
}

// Omit auto-generated fields, but allow createdAt to be set
export type NewOutfit = Omit<Outfit, "id" | "updatedAt"> & {
  createdAt?: Date;
};
