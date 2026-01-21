import type { ReactNode } from "react";
import styles from "./Button.module.css";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "soft" | "ghost" | "outline";
  color?: "default" | "red" | "gray" | "green" | "orange";
  size?: "1" | "2" | "3" | "4";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  style?: React.CSSProperties;
}

export function Button({
  children,
  onClick,
  variant = "solid",
  color = "default",
  size = "3",
  disabled = false,
  type = "button",
  className = "",
  style,
}: ButtonProps) {
  const colorClass =
    color === "red"
      ? styles.red
      : color === "gray"
      ? styles.gray
      : color === "green"
      ? styles.green
      : color === "orange"
      ? styles.warning
      : "";
  const sizeClass = styles[`size${size}`];
  const variantClass =
    variant === "outline" ? styles.soft : styles[variant] || styles.solid;

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${colorClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
