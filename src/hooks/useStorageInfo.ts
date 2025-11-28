import { useEffect, useState } from 'react';
import { getStorageEstimate } from '../utils/indexedDB';

interface StorageInfo {
  usageInMB: number;
  quotaInMB: number;
  percentageUsed: number;
}

export function useStorageInfo() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    async function fetchStorageInfo() {
      const estimate = await getStorageEstimate();
      setStorageInfo({
        usageInMB: estimate.usageInMB,
        quotaInMB: estimate.quotaInMB,
        percentageUsed:
          estimate.quota > 0 ? Math.round((estimate.usage / estimate.quota) * 100) : 0,
      });
    }

    fetchStorageInfo();
  }, []);

  return storageInfo;
}
