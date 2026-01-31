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
    '3': '1.125rem',
    '4': '1.25rem',
    '5': '1.5rem',
    '6': '1.875rem',
    '7': '2.25rem',
    '8': '3rem',
  };

  const weightMap = {
    regular: '400',
    medium: '500',
    bold: '700',
  };

  return (
    <Component
      className={className}
      style={{
        fontSize: sizeMap[size],
        fontWeight: weightMap[weight],
        color: 'var(--text-color)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
