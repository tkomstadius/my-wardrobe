import { cosineSimilarity, getImageEmbedding } from "./aiEmbedding";
import type { WardrobeItem } from "../types/wardrobe";

export interface ItemMatch {
	item: WardrobeItem;
	similarity: number;
	percentage: number;
	confidence: "high" | "medium" | "low";
}

/**
 * Find wardrobe items that match an outfit photo
 */
export async function findMatchingItems(
	outfitPhotoUrl: string,
	wardrobeItems: WardrobeItem[],
	options: {
		minThreshold?: number; // Minimum similarity to be considered (default 0.55)
		maxResults?: number; // Max matches to return (default: all above threshold)
	} = {},
): Promise<ItemMatch[]> {
	const { minThreshold = 0.55, maxResults } = options;

	// Get embedding for outfit photo
	const outfitEmbedding = await getImageEmbedding(outfitPhotoUrl);

	// Filter items that have embeddings
	const itemsWithEmbeddings = wardrobeItems.filter((item) => item.embedding);

	if (itemsWithEmbeddings.length === 0) {
		throw new Error(
			"No items have embeddings. Please generate embeddings first.",
		);
	}

	// Calculate similarity for each item
	const matches: ItemMatch[] = itemsWithEmbeddings
		.map((item) => {
			const similarity = cosineSimilarity(outfitEmbedding, item.embedding!);
			const percentage = Math.round(similarity * 100);

			let confidence: "high" | "medium" | "low";
			if (similarity >= 0.75) confidence = "high";
			else if (similarity >= 0.65) confidence = "medium";
			else confidence = "low";

			return {
				item,
				similarity,
				percentage,
				confidence,
			};
		})
		.filter((match) => match.similarity >= minThreshold)
		.sort((a, b) => b.similarity - a.similarity);

	// Limit results if requested
	return maxResults ? matches.slice(0, maxResults) : matches;
}

