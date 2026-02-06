import styles from './Skeleton.module.css';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
};

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    />
  );
}
