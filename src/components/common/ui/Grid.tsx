import type { CSSProperties, ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  columns?: '1' | '2' | '3' | '4' | '5';
  gap?: '1' | '2' | '3' | '4' | '5';
  style?: CSSProperties;
  className?: string;
}

export function Grid({
  children,
  columns = '1',
  gap = '3',
  style = {},
  className = '',
}: GridProps) {
  const gapMap = {
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.5rem',
  };

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gapMap[gap],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
