import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Text } from "./ui/Text";
import { useState } from "react";
import { RatingButtons } from "./form/RatingButtons";
import type { Outfit, OutfitRating } from "../../types/outfit";
import { markOutfitAsPrompted } from "../../utils/outfitRatingPrompt";

interface OutfitRatingPromptProps {
  outfit: Outfit;
  onRate: (outfitId: string, rating: OutfitRating) => Promise<void>;
  onDismiss: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function OutfitRatingPrompt({
  outfit,
  onRate,
  onDismiss,
  currentIndex = 0,
  totalCount = 1,
}: OutfitRatingPromptProps) {
  const [rating, setRating] = useState<OutfitRating | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (rating === undefined) return;

    setIsSaving(true);
    try {
      await onRate(outfit.id, rating);
      markOutfitAsPrompted(outfit.id);
      onDismiss();
    } catch (error) {
      console.error("Failed to save rating:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    markOutfitAsPrompted(outfit.id);
    onDismiss();
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && handleDismiss()}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>
          Rate Outfit
          {totalCount > 1 && (
            <Text size="2" color="gray" style={{ marginLeft: "0.5rem" }}>
              ({currentIndex + 1} of {totalCount})
            </Text>
          )}
        </Dialog.Title>
        <Dialog.Description size="2">
          How did you feel about this outfit?
        </Dialog.Description>

        {outfit.photo && (
          <Flex justify="center" style={{ margin: "1rem 0" }}>
            <img
              src={outfit.photo}
              alt="Outfit"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "0.5rem",
                objectFit: "contain",
                background: "var(--surface-color)",
              }}
            />
          </Flex>
        )}

        <Flex direction="column" gap="3" style={{ marginTop: "1rem" }}>
          <div>
            <Text weight="bold" size="2" style={{ marginBottom: "0.5rem", display: "block" }}>
              Rate This Outfit
            </Text>
            <RatingButtons value={rating} onChange={setRating} />
          </div>

          <Flex gap="3" justify="end" style={{ marginTop: "0.5rem" }}>
            <Button
              onClick={handleDismiss}
              disabled={isSaving}
            >
              Skip
            </Button>
            <Button
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
