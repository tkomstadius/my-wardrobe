import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { ReactNode } from 'react';
import styles from './RadioCards.module.css';

interface RadioCardsRootProps {
  children: ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

function RadioCardsRoot({ children, defaultValue, onValueChange, name }: RadioCardsRootProps) {
  return (
    <RadioGroup
      defaultValue={defaultValue}
      onValueChange={(value) => onValueChange?.(value as string)}
      name={name}
      className={styles.root}
    >
      {children}
    </RadioGroup>
  );
}

interface RadioCardsItemProps {
  value: string;
  children: ReactNode;
}

function RadioCardsItem({ value, children }: RadioCardsItemProps) {
  return (
    <Radio.Root value={value} className={styles.item}>
      {children}
    </Radio.Root>
  );
}

export const RadioCards = {
  Root: RadioCardsRoot,
  Item: RadioCardsItem,
};
