import type { CSSProperties, ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import styles from "./Link.module.css";

interface LinkProps {
  children: ReactNode;
  to: string;
  style?: CSSProperties;
  className?: string;
}

export function Link({ children, to, style = {}, className = "" }: LinkProps) {
  return (
    <RouterLink to={to} className={`${styles.link} ${className}`} style={style}>
      {children}
    </RouterLink>
  );
}
