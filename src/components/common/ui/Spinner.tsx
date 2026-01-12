import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: "1" | "2" | "3" | "4";
  className?: string;
}

export function Spinner({ size = "3", className }: SpinnerProps) {
  return <div className={`${styles.spinner} ${styles[`size${size}`]} ${className || ""}`} />;
}
