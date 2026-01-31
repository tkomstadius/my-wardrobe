import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { IoCheckmark } from 'react-icons/io5';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ name, checked, defaultChecked, onCheckedChange }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      name={name}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
      className={styles.checkbox}
    >
      <BaseCheckbox.Indicator className={styles.checkIcon}>
        <IoCheckmark size={16} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
