// Data repair utilities to fix inconsistencies

import { loadAllItems, saveItem } from "./indexedDB";

/**
 * Repair items with mismatched wearCount and wearHistory
 * Ensures wearCount = initialWearCount + wearHistory.length
 */
export async function repairWearCountMismatches(): Promise<{
  itemsChecked: number;
  itemsRepaired: number;
}> {
  const items = await loadAllItems();
  let repairedCount = 0;

  for (const item of items) {
    const historyLength = item.wearHistory?.length || 0;
    const initialWearCount = item.initialWearCount ?? 0;
    const currentWearCount = item.wearCount || 0;
    const expectedWearCount = initialWearCount + historyLength;

    // Check if there's a mismatch
    if (currentWearCount !== expectedWearCount) {
      console.log(
        `Repairing item ${item.id}: wearCount=${currentWearCount}, expected=${expectedWearCount} (initial=${initialWearCount} + history=${historyLength})`
      );

      // Fix by recalculating the correct wear count
      await saveItem({
        ...item,
        wearCount: expectedWearCount,
        updatedAt: new Date(),
      });

      repairedCount++;
    }
  }

  return {
    itemsChecked: items.length,
    itemsRepaired: repairedCount,
  };
}

/**
 * Find items with data inconsistencies
 */
export async function findInconsistentItems(): Promise<
  Array<{
    id: string;
    issue: string;
    wearCount: number;
    expectedWearCount: number;
    initialWearCount: number;
    wearHistoryLength: number;
  }>
> {
  const items = await loadAllItems();
  const inconsistencies: Array<{
    id: string;
    issue: string;
    wearCount: number;
    expectedWearCount: number;
    initialWearCount: number;
    wearHistoryLength: number;
  }> = [];

  for (const item of items) {
    const historyLength = item.wearHistory?.length || 0;
    const initialWearCount = item.initialWearCount ?? 0;
    const currentWearCount = item.wearCount || 0;
    const expectedWearCount = initialWearCount + historyLength;

    if (currentWearCount !== expectedWearCount) {
      inconsistencies.push({
        id: item.id,
        issue: `Wear count mismatch: count=${currentWearCount}, expected=${expectedWearCount} (initial=${initialWearCount} + history=${historyLength})`,
        wearCount: currentWearCount,
        expectedWearCount,
        initialWearCount,
        wearHistoryLength: historyLength,
      });
    }
  }

  return inconsistencies;
}
