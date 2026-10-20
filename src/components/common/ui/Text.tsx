import type { CSSProperties, ReactNode } from 'react';

interface TextProps {
  children: ReactNode;
  as?: 'p' | 'span' | 'label' | 'div';
  size?: '1' | '2' | '3' | '4' | '5';
  weight?: 'regular' | 'medium' | 'bold';
  color?: 'default' | 'gray' | 'secondary' | 'red' | 'blue' | 'green' | 'orange';
  align?: 'left' | 'center' | 'right';
  style?: CSSProperties;
  className?: string;
}

export function Text({
  children,
  as: Component = 'p',
  size = '2',
  weight = 'regular',
  color = 'default',
  align = 'left',
  style = {},
  className = '',
}: TextProps) {
  const sizeMap = {
    '1': 'var(--text-xs)',
    '2': 'var(--text-sm)',
    '3': 'var(--text-md)',
    '4': 'var(--text-lg)',
    '5': 'var(--text-xl)',
  };

  const weightMap = {
    regular: 'var(--weight-regular)',
    medium: 'var(--weight-medium)',
    bold: 'var(--weight-semibold)',
  };

  const colorMap = {
    default: 'var(--color-text)',
    gray: 'var(--color-text-secondary)',
    secondary: 'var(--color-text-secondary)',
    red: 'var(--color-danger)',
    blue: 'var(--color-accent)',
    green: 'var(--color-success)',
    orange: 'var(--color-warning)',
  };

  return (
    <Component
      className={className}
      style={{
        fontSize: sizeMap[size],
        fontWeight: weightMap[weight],
        color: colorMap[color],
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
