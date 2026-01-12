import { IoTrashOutline } from "react-icons/io5";
import { AlertDialog } from "./ui/AlertDialog";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
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
            <IoTrashOutline /> Delete
          </Button>
        )}
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {description}
        </AlertDialog.Description>
        <Flex gap="3" style={{ marginTop: "1rem" }} justify="end">
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
