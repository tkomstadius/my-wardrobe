import styles from './MissingAnalysisBadge.module.css';

/** Marks items that have no AI description yet and aren't currently being worked on (that case
 *  is already covered by ProcessingStatusBadge's pending/processing/failed states) — mainly
 *  legacy items added before AI processing existed, or ones that never got triggered. */
export function MissingAnalysisBadge() {
  return (
    <div className={styles.badge}>
      <span>No AI analysis</span>
    </div>
  );
}
