import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { IoChevronDown } from "react-icons/io5";
import styles from "./Select.module.css";

interface SelectRootProps {
  children: ReactNode;
  name?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  defaultValue?: string;
  value?: string;
  size?: string;
}

function SelectRoot({
  children,
  name,
  onValueChange,
  disabled,
  defaultValue,
  value,
  size,
}: SelectRootProps) {
  return (
    <BaseSelect.Root
      name={name}
      onValueChange={(val: string | null) => onValueChange?.(val)}
      disabled={disabled}
      defaultValue={defaultValue}
      value={value}
    >
      {children}
    </BaseSelect.Root>
  );
}

interface SelectTriggerProps {
  placeholder?: string;
  variant?: string;
  className?: string;
}

function SelectTrigger({ placeholder, className }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger className={`${styles.trigger} ${className || ""}`}>
      <BaseSelect.Value>
        {(value: string | null) => value || placeholder || "Select an option"}
      </BaseSelect.Value>
      <div className={styles.icon}>
        <IoChevronDown size={16} />
      </div>
    </BaseSelect.Trigger>
  );
}

interface SelectContentProps {
  children: ReactNode;
}

function SelectContent({ children }: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner>
        <BaseSelect.Popup className={styles.listbox}>
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
}

function SelectItem({ value, children }: SelectItemProps) {
  return (
    <BaseSelect.Item value={value} className={styles.option}>
      {children}
    </BaseSelect.Item>
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
};
