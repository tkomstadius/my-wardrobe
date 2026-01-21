import type { ReactNode } from "react";
import styles from "./Callout.module.css";

interface CalloutRootProps {
  children: ReactNode;
  color?: "blue" | "yellow" | "red" | "green" | "purple" | "amber" | "orange";
  variant?: "soft" | "outline";
  size?: string;
  className?: string;
}

function CalloutRoot({ children, color = "blue", className }: CalloutRootProps) {
  const colorMap: Record<string, string> = {
    blue: styles.info || "",
    yellow: styles.warning || "",
    amber: styles.warning || "",
    red: styles.error || "",
    green: styles.success || "",
    purple: styles.info || "",
    orange: styles.warning || "",
  };

  return <div className={`${styles.callout} ${colorMap[color] || styles.info} ${className || ""}`}>{children}</div>;
}

interface CalloutIconProps {
  children: ReactNode;
}

function CalloutIcon({ children }: CalloutIconProps) {
  return <div className={styles.icon}>{children}</div>;
}

interface CalloutTextProps {
  children: ReactNode;
}

function CalloutText({ children }: CalloutTextProps) {
  return <div className={styles.content}>{children}</div>;
}

export const Callout = {
  Root: CalloutRoot,
  Icon: CalloutIcon,
  Text: CalloutText,
};
