import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import styles from './AlertDialog.module.css';

interface AlertDialogRootProps {
  children: ReactNode;
}

function AlertDialogRoot({ children }: AlertDialogRootProps) {
  const [open, setOpen] = useState(false);

  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen}>
      {children}
    </BaseDialog.Root>
  );
}

interface AlertDialogTriggerProps {
  children: ReactElement;
}

function AlertDialogTrigger({ children }: AlertDialogTriggerProps) {
  return <BaseDialog.Trigger render={children} />;
}

interface AlertDialogContentProps {
  children: ReactNode;
  maxWidth?: string;
}

function AlertDialogContent({ children, maxWidth }: AlertDialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={styles.backdrop}>
        <BaseDialog.Popup className={styles.content} style={{ maxWidth }}>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Backdrop>
    </BaseDialog.Portal>
  );
}

interface AlertDialogTitleProps {
  children: ReactNode;
}

function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <BaseDialog.Title className={styles.title}>{children}</BaseDialog.Title>;
}

interface AlertDialogDescriptionProps {
  children: ReactNode;
}

function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return <BaseDialog.Description className={styles.description}>{children}</BaseDialog.Description>;
}

interface AlertDialogCloseProps {
  children: ReactElement;
}

function AlertDialogClose({ children }: AlertDialogCloseProps) {
  return <BaseDialog.Close render={children} />;
}

export const AlertDialog = {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Content: AlertDialogContent,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Close: AlertDialogClose,
};
