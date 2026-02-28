import type { ReactElement } from 'react';
import { useState } from 'react';
import { IoArchiveOutline } from 'react-icons/io5';
import type { ArchiveReason } from '../../types/wardrobe';
import styles from './ArchiveDialog.module.css';
import { AlertDialog } from './ui/AlertDialog';
import { Button } from './ui/Button';
import { Flex } from './ui/Flex';

const ARCHIVE_REASONS: { value: ArchiveReason; label: string }[] = [
  { value: 'thrown_away', label: 'Thrown away' },
  { value: 'donated', label: 'Donated' },
  { value: 'sold', label: 'Sold' },
];

interface ArchiveDialogProps {
  onConfirm: (reason: ArchiveReason, notes: string) => Promise<void>;
  isArchiving?: boolean;
  triggerButton?: ReactElement;
}

export function ArchiveDialog({
  onConfirm,
  isArchiving = false,
  triggerButton,
}: ArchiveDialogProps) {
  const [reason, setReason] = useState<ArchiveReason>('donated');
  const [notes, setNotes] = useState('');

  const handleConfirm = async () => {
    await onConfirm(reason, notes);
    setNotes('');
    setReason('donated');
  };

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        {triggerButton || (
          <Button>
            <IoArchiveOutline /> Archive
          </Button>
        )}
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Archive Item</AlertDialog.Title>
        <AlertDialog.Description>
          Why are you archiving this item? It will be hidden from your wardrobe but preserved with
          its history.
        </AlertDialog.Description>

        <div className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Reason</legend>
            {ARCHIVE_REASONS.map(({ value, label }) => (
              <label key={value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="archive-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className={styles.radioInput}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <label className={styles.notesLabel}>
            <span className={styles.notesLabelText}>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. gave to charity shop, sold on Vinted..."
              className={styles.notesTextarea}
              rows={3}
            />
          </label>
        </div>

        <Flex gap="3" style={{ marginTop: '1rem' }} justify="end">
          <AlertDialog.Close>
            <Button>Cancel</Button>
          </AlertDialog.Close>
          <Button onClick={handleConfirm} disabled={isArchiving}>
            <IoArchiveOutline />
            {isArchiving ? 'Archiving...' : 'Archive'}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
