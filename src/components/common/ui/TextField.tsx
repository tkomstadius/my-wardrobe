import type { ReactNode } from "react";
import styles from "./TextField.module.css";

interface TextFieldRootProps {
  children: ReactNode;
  size?: "1" | "2" | "3";
  variant?: string;
  defaultValue?: string;
  type?: string;
  name?: string;
}

function TextFieldRoot({ children, size = "3" }: TextFieldRootProps) {
  return <div className={`${styles.root} ${styles[`size${size}`]}`}>{children}</div>;
}

interface TextFieldInputProps {
  type?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  list?: string;
}

function TextFieldInput(props: TextFieldInputProps) {
  return <input className={styles.input} {...props} />;
}

interface TextFieldSlotProps {
  children: ReactNode;
}

function TextFieldSlot({ children }: TextFieldSlotProps) {
  return <div className={styles.slot}>{children}</div>;
}

export const TextField = {
  Root: TextFieldRoot,
  Input: TextFieldInput,
  Slot: TextFieldSlot,
};
