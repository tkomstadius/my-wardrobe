import styles from "./TextArea.module.css";

interface TextAreaProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  variant?: string;
  size?: string;
}

export function TextArea({
  name,
  value,
  defaultValue,
  placeholder,
  onChange,
  disabled,
  required,
  rows = 4,
}: TextAreaProps) {
  return (
    <textarea
      name={name}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      required={required}
      rows={rows}
      className={styles.textarea}
    />
  );
}
