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
    '1': '0.75rem',
    '2': '0.875rem',
    '3': '1rem',
    '4': '1.125rem',
    '5': '1.25rem',
  };

  const weightMap = {
    regular: '400',
    medium: '500',
    bold: '700',
  };

  const colorMap = {
    default: 'var(--text-color)',
    gray: 'var(--text-secondary)',
    secondary: 'var(--text-secondary)',
    red: 'var(--error-color)',
    blue: 'var(--accent-color)',
    green: 'var(--success-color)',
    orange: 'var(--warning-color)',
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
