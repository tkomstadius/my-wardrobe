import type { ReactNode } from "react";
import styles from "./IconButton.module.css";

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "1" | "2" | "3" | "4";
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function IconButton({
  children,
  onClick,
  size = "3",
  type = "button",
  className = "",
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.iconButton} ${styles[`size${size}`]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
