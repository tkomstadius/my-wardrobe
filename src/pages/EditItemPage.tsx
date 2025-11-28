import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button } from '@radix-ui/themes';
import { useNavigate, useParams } from 'react-router';
import styles from './EditItemPage.module.css';

export function EditItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // TODO: Fetch item data by ID from storage

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeftIcon />
        </Button>
        <h2 className={styles.title}>Edit Item</h2>
        <div style={{ width: '32px' }} /> {/* Spacer */}
      </div>

      <div className={styles.placeholder}>
        <p>Edit functionality coming soon...</p>
        <p className={styles.itemId}>Item ID: {id}</p>
      </div>
    </div>
  );
}
