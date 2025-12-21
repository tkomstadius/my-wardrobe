import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { RatingButtons } from "./form/RatingButtons";
import type { Outfit, OutfitRating } from "../../types/outfit";
import {
  markOutfitAsPrompted,
  markPromptedToday,
} from "../../utils/outfitRatingPrompt";

interface OutfitRatingPromptProps {
  outfit: Outfit;
  onRate: (outfitId: string, rating: OutfitRating) => Promise<void>;
  onDismiss: () => void;
}

export function OutfitRatingPrompt({
  outfit,
  onRate,
  onDismiss,
}: OutfitRatingPromptProps) {
  const [rating, setRating] = useState<OutfitRating | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (rating === undefined) return;

    setIsSaving(true);
    try {
      await onRate(outfit.id, rating);
      markOutfitAsPrompted(outfit.id);
      markPromptedToday();
      onDismiss();
    } catch (error) {
      console.error("Failed to save rating:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    markOutfitAsPrompted(outfit.id);
    markPromptedToday();
    onDismiss();
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && handleDismiss()}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Rate Today's Outfit</Dialog.Title>
        <Dialog.Description size="2">
          How did you feel about this outfit today?
        </Dialog.Description>

        {outfit.photo && (
          <Flex justify="center" my="4">
            <img
              src={outfit.photo}
              alt="Outfit"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "var(--radius-3)",
                objectFit: "contain",
                background: "var(--gray-2)",
              }}
            />
          </Flex>
        )}

        <Flex direction="column" gap="3" mt="4">
          <div>
            <Text weight="bold" size="2" mb="2" as="div">
              Rate This Outfit
            </Text>
            <RatingButtons value={rating} onChange={setRating} />
          </div>

          <Flex gap="3" justify="end" mt="2">
            <Button
              variant="soft"
              color="gray"
              onClick={handleDismiss}
              disabled={isSaving}
            >
              Skip
            </Button>
            <Button
              variant="solid"
              onClick={handleSave}
              disabled={rating === undefined || isSaving}
            >
              {isSaving ? "Saving..." : "Save Rating"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
