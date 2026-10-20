import type { CSSProperties, ReactNode } from 'react';

interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  gap?: '1' | '2' | '3' | '4' | '5';
  wrap?: 'wrap' | 'nowrap';
  style?: CSSProperties;
  className?: string;
  mb?: string;
  mt?: string;
  my?: string;
}

export function Flex({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = '2',
  wrap = 'nowrap',
  style = {},
  className = '',
  mb,
  mt,
  my,
}: FlexProps) {
  const gapMap = {
    '1': 'var(--space-1)',
    '2': 'var(--space-2)',
    '3': 'var(--space-3)',
    '4': 'var(--space-4)',
    '5': 'var(--space-6)',
  };

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
  };

  const marginStyles: CSSProperties = {};
  if (mb) marginStyles.marginBottom = mb;
  if (mt) marginStyles.marginTop = mt;
  if (my) {
    marginStyles.marginTop = my;
    marginStyles.marginBottom = my;
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction,
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        gap: gapMap[gap],
        flexWrap: wrap,
        minWidth: 0,
        maxWidth: '100%',
        ...marginStyles,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
