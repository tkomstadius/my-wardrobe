import { Button, Text } from "@radix-ui/themes";
import styles from "./RatingButtons.module.css";

interface RatingButtonsProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  label?: string;
}

export function RatingButtons({
  value,
  onChange,
  label = "Rating",
}: RatingButtonsProps) {
  const ratings = [1, 2, 3, 4, 5];

  return (
    <div className={styles.container}>
      <Text size="2" weight="medium">
        {label}
      </Text>
      <div className={styles.buttons}>
        {ratings.map((rating) => (
          <Button
            key={rating}
            type="button"
            size="3"
            variant={value === rating ? "solid" : "soft"}
            color={value === rating ? "blue" : "gray"}
            onClick={() => onChange(value === rating ? undefined : rating)}
            className={styles.ratingButton}
          >
            {rating}
          </Button>
        ))}
      </div>
      {value && (
        <Text size="1" color="gray">
          {value === 1 && "Not great"}
          {value === 2 && "Okay"}
          {value === 3 && "Good"}
          {value === 4 && "Great"}
          {value === 5 && "Love it!"}
        </Text>
      )}
    </div>
  );
}
