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
    '1': 'var(--space-1)',
    '2': 'var(--space-2)',
    '3': 'var(--space-3)',
    '4': 'var(--space-4)',
    '5': 'var(--space-6)',
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
