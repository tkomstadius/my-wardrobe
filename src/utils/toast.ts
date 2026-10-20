import { Toast } from '@base-ui/react/toast';

// Global manager so toasts can be raised from loaders/actions and non-component code too.
export const toastManager = Toast.createToastManager();

interface ShowToastOptions {
  title: string;
  description?: string;
  /** Adds an Undo button. Prefer this over confirmation dialogs for easily reversible actions. */
  onUndo?: () => Promise<void> | void;
}

export function showToast({ title, description, onUndo }: ShowToastOptions) {
  const id = toastManager.add({
    title,
    description,
    // Give a bit longer to reach the Undo button
    timeout: onUndo ? 6000 : 3000,
    actionProps: onUndo
      ? {
          children: 'Undo',
          onClick: async () => {
            toastManager.close(id);
            try {
              await onUndo();
            } catch (error) {
              console.error('Undo failed:', error);
              showError('Could not undo. Please try again.');
            }
          },
        }
      : undefined,
  });
}

export function showError(message: string) {
  toastManager.add({ title: message, type: 'error', priority: 'high', timeout: 5000 });
}
