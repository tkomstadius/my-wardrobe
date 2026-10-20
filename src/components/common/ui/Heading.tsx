import type { CSSProperties, ReactNode } from 'react';

interface HeadingProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '3' | '4' | '5' | '6' | '7' | '8';
  weight?: 'regular' | 'medium' | 'bold';
  style?: CSSProperties;
  className?: string;
  align?: string;
}

export function Heading({
  children,
  as: Component = 'h2',
  size = '5',
  weight = 'bold',
  style = {},
  className = '',
}: HeadingProps) {
  const sizeMap = {
    '3': 'var(--text-lg)',
    '4': 'var(--text-xl)',
    '5': 'var(--text-2xl)',
    '6': 'var(--text-3xl)',
    '7': 'var(--text-4xl)',
    '8': 'var(--text-5xl)',
  };

  const weightMap = {
    regular: 'var(--weight-regular)',
    medium: 'var(--weight-medium)',
    bold: 'var(--weight-semibold)',
  };

  return (
    <Component
      className={className}
      style={{
        fontSize: sizeMap[size],
        fontWeight: weightMap[weight],
        color: 'var(--color-text)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
