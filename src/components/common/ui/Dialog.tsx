import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import styles from './Dialog.module.css';

interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

function DialogRoot({ open, onOpenChange, children }: DialogRootProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog.Root>
  );
}

interface DialogContentProps {
  children: ReactNode;
  maxWidth?: string;
  style?: React.CSSProperties;
}

function DialogContent({ children, maxWidth, style }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={styles.backdrop}>
        <BaseDialog.Popup className={styles.content} style={{ maxWidth, ...style }}>
          <BaseDialog.Close className={styles.closeButton}>
            <IoClose size={20} />
          </BaseDialog.Close>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Backdrop>
    </BaseDialog.Portal>
  );
}

interface DialogTitleProps {
  children: ReactNode;
}

function DialogTitle({ children }: DialogTitleProps) {
  return <BaseDialog.Title className={styles.title}>{children}</BaseDialog.Title>;
}

interface DialogDescriptionProps {
  children: ReactNode;
  size?: '1' | '2' | '3';
  color?: string;
  mb?: string;
  style?: React.CSSProperties;
}

function DialogDescription({ children, size = '2', color, mb, style }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={styles.description}
      style={{
        fontSize: size === '1' ? '0.75rem' : size === '2' ? '0.875rem' : '1rem',
        color: color,
        marginBottom: mb,
        ...style,
      }}
    >
      {children}
    </BaseDialog.Description>
  );
}

function DialogClose({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const Dialog = {
  Root: DialogRoot,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};
