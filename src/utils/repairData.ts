// Data repair utilities to fix inconsistencies

import type { ItemCategory } from "../types/wardrobe";
import { loadAllItems, saveItem } from "./indexedDB";
import { CATEGORY_IDS } from "./categories";

/**
 * Repair all data issues in items
 * Fixes: wear counts, invalid categories, missing required fields
 */
export async function repairWearCountMismatches(): Promise<{
  itemsChecked: number;
  itemsRepaired: number;
}> {
  const items = await loadAllItems();
  let repairedCount = 0;

  for (const item of items) {
    let needsRepair = false;
    const repairs: string[] = [];

    // Check 1: Wear count mismatch
    const historyLength = item.wearHistory?.length || 0;
    const initialWearCount = item.initialWearCount ?? 0;
    const currentWearCount = item.wearCount || 0;
    const expectedWearCount = initialWearCount + historyLength;

    if (currentWearCount !== expectedWearCount) {
      needsRepair = true;
      repairs.push(`wearCount: ${currentWearCount} → ${expectedWearCount}`);
    }

    // Check 2: Invalid or missing category
    if (!item.category || !CATEGORY_IDS.includes(item.category)) {
      needsRepair = true;
      repairs.push(`invalid category: "${item.category}" → "tops"`);
      item.category = "tops"; // Default to tops if invalid
    }

    // Check 3: Missing required fields
    if (!item.id) {
      console.error("Item missing ID - cannot repair:", item);
      continue;
    }

    if (!item.imageUrl) {
      needsRepair = true;
      repairs.push("missing imageUrl");
      // Can't fix missing image, but log it
    }

    if (!item.createdAt) {
      needsRepair = true;
      repairs.push("missing createdAt");
      item.createdAt = new Date();
    }

    if (!item.updatedAt) {
      needsRepair = true;
      repairs.push("missing updatedAt");
      item.updatedAt = new Date();
    }

    // Check 4: Ensure wearHistory is an array
    if (!Array.isArray(item.wearHistory)) {
      needsRepair = true;
      repairs.push("invalid wearHistory");
      item.wearHistory = [];
    }

    // Apply repairs if needed
    if (needsRepair) {
      console.log(`Repairing item ${item.id}:`, repairs.join(", "));

      await saveItem({
        ...item,
        wearCount: expectedWearCount,
        category: item.category as ItemCategory,
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

/**
 * Diagnostic function to log all items to console for debugging
 */
export async function diagnoseAllItems(): Promise<void> {
  const items = await loadAllItems();

  console.log("=== WARDROBE DIAGNOSTIC REPORT ===");
  console.log(`Total items in database: ${items.length}`);
  console.log("");

  // Group by category
  const byCategory: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || "UNDEFINED";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  console.log("Items by category:");
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log("");

  // Check for issues
  const issues: string[] = [];
  for (const item of items) {
    const itemIssues: string[] = [];

    if (!item.category || !CATEGORY_IDS.includes(item.category)) {
      itemIssues.push(`invalid category: "${item.category}"`);
    }

    if (!item.id) {
      itemIssues.push("missing id");
    }

    if (!item.imageUrl) {
      itemIssues.push("missing imageUrl");
    }

    const historyLength = item.wearHistory?.length || 0;
    const initialWearCount = item.initialWearCount ?? 0;
    const expectedWearCount = initialWearCount + historyLength;
    if (item.wearCount !== expectedWearCount) {
      itemIssues.push(
        `wear count: ${item.wearCount} (should be ${expectedWearCount})`
      );
    }

    if (itemIssues.length > 0) {
      issues.push(`Item ${item.id}: ${itemIssues.join(", ")}`);
    }
  }

  if (issues.length > 0) {
    console.log("Issues found:");
    for (const issue of issues) {
      console.log(`  ❌ ${issue}`);
    }
  } else {
    console.log("✅ No issues found!");
  }

  console.log("");
  console.log("Full item data:");
  console.table(
    items.map((item) => ({
      id: item.id.substring(0, 8),
      category: item.category,
      wearCount: item.wearCount,
      initial: item.initialWearCount ?? 0,
      history: item.wearHistory?.length || 0,
      brand: item.brand || "—",
      notes: item.notes?.substring(0, 20) || "—",
    }))
  );
  console.log("=== END DIAGNOSTIC ===");
}
