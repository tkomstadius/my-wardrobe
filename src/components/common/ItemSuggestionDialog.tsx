import { Dialog, Button, Text, Flex, Heading } from "@radix-ui/themes";
import { ItemCard } from "./ItemCard";
import type { WardrobeItem } from "../../types/wardrobe";

interface ItemSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedItem: WardrobeItem | null;
  onTryAnother: () => void;
}

export function ItemSuggestionDialog({
  open,
  onOpenChange,
  suggestedItem,
  onTryAnother,
}: ItemSuggestionDialogProps) {
  if (!suggestedItem) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: "90vw", width: "500px" }}>
        <Dialog.Title>
          <Heading size="5">What Should I Wear Today?</Heading>
        </Dialog.Title>

        <Dialog.Description size="2" color="gray" mb="4">
          Here's a suggestion based on your wardrobe, wear history, and today's weather.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <ItemCard item={suggestedItem} />

          <Flex gap="3" justify="end">
            <Button
              variant="soft"
              onClick={onTryAnother}
            >
              Try Another
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

