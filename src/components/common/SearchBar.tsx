import { TextField } from "./ui/TextField";
import { IconButton } from "./ui/IconButton";
import { Text } from "./ui/Text";
import { Flex } from "./ui/Flex";
import { IoClose, IoSearchOutline } from "react-icons/io5";
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
  placeholder = "category, brand, notes, tags...",
  resultCount,
}: SearchBarProps) {
  return (
    <Flex direction="column" gap="1">
      <TextField.Root size="3">
        <TextField.Slot>
          <IoSearchOutline />
        </TextField.Slot>
        <TextField.Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <TextField.Slot>
            <IconButton
              size="1"
              onClick={onClear}
              type="button"
            >
              <IoClose />
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
    </Flex>
  );
}
