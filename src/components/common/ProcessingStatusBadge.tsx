import type { AiProcessingStatus } from '../../types/wardrobe';
import styles from './ProcessingStatusBadge.module.css';

interface ProcessingStatusBadgeProps {
  status: AiProcessingStatus | undefined;
  onRetry?: () => void;
}

const LABELS: Partial<Record<AiProcessingStatus, string>> = {
  pending: 'Queued for analysis…',
  processing: 'Analyzing…',
  failed: 'Analysis failed',
};

export function ProcessingStatusBadge({ status, onRetry }: ProcessingStatusBadgeProps) {
  if (!status || status === 'not_requested' || status === 'completed') {
    return null;
  }

  const isFailed = status === 'failed';

  return (
    <div className={`${styles.badge} ${isFailed ? styles.failed : styles.active}`}>
      <span>{LABELS[status]}</span>
      {isFailed && onRetry && (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
