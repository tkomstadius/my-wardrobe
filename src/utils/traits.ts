import type { ItemTrait } from "../types/wardrobe";

export const TRAIT_EMOJIS: Record<ItemTrait, string> = {
  comfort: "🧸",
  confidence: "🔥",
  creative: "🦄",
};

export function getTraitEmoji(trait: ItemTrait | undefined): string | null {
  if (!trait) return null;
  return TRAIT_EMOJIS[trait] || null;
}

export function getTraitLabel(trait: ItemTrait | undefined): string | null {
  if (!trait) return null;
  
  const labels: Record<ItemTrait, string> = {
    comfort: "Comfort",
    confidence: "Confidence",
    creative: "Creative",
  };
  
  return labels[trait] || null;
}

