import { useEffect, useRef, useState } from 'react';
import { useRevalidator } from 'react-router';
import type { AiProcessingStatus } from '../types/wardrobe';
import { getItemProcessingStatus } from '../utils/aiProcessing';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes, then give up rather than poll forever

const TERMINAL_STATUSES = new Set<AiProcessingStatus>(['completed', 'failed']);
const ACTIVE_STATUSES = new Set<AiProcessingStatus>(['pending', 'processing']);

interface UseProcessingStatusOptions {
  /**
   * Poll even if the initial status isn't 'pending'/'processing' yet. Needed right after upload:
   * the item is created (status 'not_requested') before the Edge Function's own first status
   * write ('pending') has necessarily landed, so without this the UI would never start watching.
   */
  forceWatch?: boolean;
}

/** Polls an item's processing_status while it's in flight, and revalidates the route's loader
 *  data once it reaches a terminal state so the rest of the item (description, metadata) refreshes
 *  too. Stops polling on a terminal status or after MAX_POLL_ATTEMPTS. */
export function useProcessingStatus(
  itemId: string,
  initialStatus: AiProcessingStatus | undefined,
  options: UseProcessingStatusOptions = {},
): AiProcessingStatus | undefined {
  const { forceWatch = false } = options;
  const [status, setStatus] = useState(initialStatus);
  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator.revalidate);
  revalidateRef.current = revalidator.revalidate;

  // Loader data (e.g. after a revalidate elsewhere) should reset what we're tracking.
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (status && TERMINAL_STATUSES.has(status)) return;

    const alreadyActive = status !== undefined && ACTIVE_STATUSES.has(status);
    if (!forceWatch && !alreadyActive) return;

    let cancelled = false;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > MAX_POLL_ATTEMPTS) {
        console.error(
          `[useProcessingStatus] Gave up watching item ${itemId} after ${MAX_POLL_ATTEMPTS} attempts`,
        );
        clearInterval(interval);
        return;
      }

      try {
        const latest = await getItemProcessingStatus(itemId);
        if (cancelled || latest === undefined) return;
        setStatus(latest);
        if (TERMINAL_STATUSES.has(latest)) {
          clearInterval(interval);
          revalidateRef.current();
        }
      } catch (error) {
        console.error(`[useProcessingStatus] Failed to poll status for item ${itemId}:`, error);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [itemId, status, forceWatch]);

  return status;
}
