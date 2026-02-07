import { Select as BaseSelect } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import styles from './Select.module.css';

interface SelectRootProps {
  children: ReactNode;
  name?: string;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  defaultValue?: string;
  value?: string;
}

function SelectRoot({
  children,
  name,
  onValueChange,
  disabled,
  defaultValue,
  value,
}: SelectRootProps) {
  return (
    <BaseSelect.Root
      name={name}
      onValueChange={onValueChange}
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
  className?: string;
}

function SelectTrigger({ placeholder, className }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger className={`${styles.trigger} ${className || ''}`}>
      <BaseSelect.Value>
        {(value) => (value as string) || placeholder || 'Select...'}
      </BaseSelect.Value>
      <BaseSelect.Icon className={styles.icon}>
        <IoChevronDown size={16} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

interface SelectContentProps {
  children: ReactNode;
}

function SelectContent({ children }: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className={styles.positioner} sideOffset={4}>
        <BaseSelect.Popup className={styles.popup}>{children}</BaseSelect.Popup>
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
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
};
