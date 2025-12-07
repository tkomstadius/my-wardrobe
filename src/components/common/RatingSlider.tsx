import { Text } from "@radix-ui/themes";
import styles from "./RatingSlider.module.css";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function RatingSlider({ label, value, onChange }: RatingSliderProps) {
  return (
    <label className={styles.label}>
      <div className={styles.labelRow}>
        <Text size="2">{label}</Text>
        <Text size="1" color="gray">
          {value > 0 ? value : "Not rated"}
        </Text>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
    </label>
  );
}

