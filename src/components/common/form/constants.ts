import { OutfitRating } from "../../../types/outfit";

export const IMAGE_URL_NAME = "imageUrl";
export const ORIGINAL_IMAGE_URL_NAME = "originalImageUrl";
export const CREATED_DATE_NAME = "createdDate";
export const BRAND_NAME = "brand";
export const CATEGORY_NAME = "category";
export const SUBCATEGORY_NAME = "subCategory";
export const PRICE_NAME = "price";
export const PURCHASE_DATE_NAME = "purchaseDate";
export const INITIAL_WEAR_COUNT_NAME = "initialWearCount";
export const ITEM_TRAIT_NAME = "trait";
export const NOTES_NAME = "notes";
export const SECOND_HAND_NAME = "isSecondHand";
export const DOG_CASUAL_NAME = "isDogCasual";
export const HANDMADE_NAME = "isHandmade";
export const RATING_NAME = "rating";
export const ITEM_IDS_NAME = "itemIds";

export const TRAIT_OPTIONS = [
  { id: "none", title: "None" },
  { id: "comfort", title: "Comfort (cozy, relaxed)" },
  { id: "confidence", title: "Confidence (powerful, bold)" },
  { id: "creative", title: "Creative (expressive, artistic)" },
];

export const RATING_OPTIONS: Array<{ value: OutfitRating; emoji: string }> = [
  { value: 1, emoji: "⭐️" },
  { value: 0, emoji: "😐" },
  { value: -1, emoji: "💩" },
];
