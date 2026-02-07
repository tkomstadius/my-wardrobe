import type { ReactElement, ReactNode } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { AlertDialog } from './ui/AlertDialog';
import { Button } from './ui/Button';
import { Flex } from './ui/Flex';

interface DeleteConfirmDialogProps {
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  confirmText?: string;
  triggerButton?: ReactElement;
}

export function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  isDeleting = false,
  confirmText = 'Delete',
  triggerButton,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        {triggerButton || (
          <Button variant="destructive">
            <IoTrashOutline /> Delete
          </Button>
        )}
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>
        <Flex gap="3" style={{ marginTop: '1rem' }} justify="end">
          <AlertDialog.Close>
            <Button>Cancel</Button>
          </AlertDialog.Close>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : confirmText}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
