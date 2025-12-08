import { TextField, IconButton, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  resultCount?: number;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search items (category, brand, notes, tags...)",
  resultCount,
}: SearchBarProps) {
  return (
    <div className={styles.container}>
      <TextField.Root
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="3"
      >
        <TextField.Slot>
          <Text size="3">🔍</Text>
        </TextField.Slot>
        {value && (
          <TextField.Slot>
            <IconButton
              size="1"
              variant="ghost"
              onClick={onClear}
              type="button"
              aria-label="Clear search"
            >
              <Cross2Icon />
            </IconButton>
          </TextField.Slot>
        )}
      </TextField.Root>

      {resultCount !== undefined && (
        <div className={styles.resultCount}>
          <Text size="2" color="gray">
            {resultCount} {resultCount === 1 ? "item" : "items"}
          </Text>
        </div>
      )}
    </div>
  );
}
