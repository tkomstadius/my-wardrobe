import { Toast } from '@base-ui/react/toast';
import type { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import { toastManager } from '../../../utils/toast';
import styles from './Toast.module.css';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={styles.viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.toast}>
      <Toast.Content className={styles.content}>
        <Toast.Title className={styles.title} />
        <Toast.Description className={styles.description} />
      </Toast.Content>
      <Toast.Action className={styles.action} />
      <Toast.Close className={styles.close} aria-label="Dismiss">
        <IoClose size={16} />
      </Toast.Close>
    </Toast.Root>
  ));
}
