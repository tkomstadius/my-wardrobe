import { TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface DeleteConfirmDialogProps {
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  confirmText?: string;
  triggerButton?: ReactNode;
}

export function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  isDeleting = false,
  confirmText = "Delete",
  triggerButton,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        {triggerButton || (
          <Button size="3" variant="soft" color="red">
            <TrashIcon /> Delete
          </Button>
        )}
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {description}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : confirmText}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
