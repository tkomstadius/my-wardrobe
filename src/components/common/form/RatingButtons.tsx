import { RadioCards } from "../ui/RadioCards";
import type { OutfitRating } from "../../../types/outfit";
import { RATING_OPTIONS } from "./constants";

interface RatingButtonsProps {
  name?: string; // For uncontrolled (form submission)
  defaultValue?: OutfitRating; // For uncontrolled
  value?: OutfitRating; // For controlled
  onChange?: (value: OutfitRating | undefined) => void; // For controlled
}

export function RatingButtons({
  name,
  defaultValue,
  value,
  onChange,
}: RatingButtonsProps) {
  const isControlled = value !== undefined || onChange !== undefined;

  const handleValueChange = (newValue: string) => {
    if (onChange) {
      const ratingValue = Number.parseInt(newValue, 10) as OutfitRating;
      // Toggle: if already selected, deselect (set to undefined)
      // Note: RadioCards doesn't support deselecting, so we'll handle it via the onChange
      if (value === ratingValue) {
        // If clicking the same option, we want to deselect
        // But RadioCards doesn't support empty value, so we'll need to handle this differently
        onChange(undefined);
      } else {
        onChange(ratingValue);
      }
    }
  };

  // For controlled mode, use value prop; for uncontrolled, use defaultValue
  const radioProps = isControlled
    ? {
        value: value?.toString() || "",
        onValueChange: handleValueChange,
      }
    : {
        defaultValue: defaultValue?.toString(),
        name, // For form submission
      };

  return (
    <RadioCards.Root {...radioProps}>
      {RATING_OPTIONS.map((rating) => (
        <RadioCards.Item key={rating.value} value={rating.value.toString()}>
          {rating.emoji}
        </RadioCards.Item>
      ))}
    </RadioCards.Root>
  );
}
