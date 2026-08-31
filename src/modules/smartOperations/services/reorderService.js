/**
 * @file        reorderService.js
 * @module      SmartOperations
 * @purpose     Computes smart reorder suggestions using a transparent business rule.
 *
 *              Rule:
 *                A medicine requires reorder when currentStock <= minimumStock.
 *                suggestedReorder = (minimumStock * 2) - currentStock
 *
 *              No AI or machine learning — pure business arithmetic.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { SO_COLLECTIONS, MED_STATUS, REORDER_MULTIPLIER } from '../constants/smartOpsConstants';

// ─────────────────────────────────────────────────────────────────────────────
// getReorderSuggestions
// Returns all medicines that require reorder, with computed suggested quantity.
//
// @returns {Promise<Array<{
//   id, medicineName, supplier, quantity, minimumStock,
//   suggestedReorder, stockStatus
// }>>}
// ─────────────────────────────────────────────────────────────────────────────
export const getReorderSuggestions = async () => {
  const medicinesRef = collection(db, SO_COLLECTIONS.MEDICINES);
  const q = query(medicinesRef, where('status', '==', MED_STATUS.ACTIVE));
  const snap = await getDocs(q);

  const suggestions = [];

  snap.docs.forEach((d) => {
    const data         = d.data();
    const currentStock = Number(data.quantity ?? data.currentStock ?? 0);
    const minimumStock = Number(data.minimumStock ?? 0);

    // Only include medicines that need reorder
    if (currentStock > minimumStock) return;

    const suggestedReorder = Math.max(
      (minimumStock * REORDER_MULTIPLIER) - currentStock,
      1
    );

    const stockStatus =
      currentStock === 0
        ? 'Out of Stock'
        : currentStock <= minimumStock
        ? 'Low Stock'
        : 'Normal';

    suggestions.push({
      id:             d.id,
      medicineName:   data.medicineName || data.name || 'Unknown',
      genericName:    data.genericName  || '',
      category:       data.category     || '',
      supplier:       data.supplier     || 'Not Specified',
      batchNumber:    data.batchNumber  || '',
      currentStock,
      minimumStock,
      suggestedReorder,
      stockStatus,
      sellingPrice:   Number(data.sellingPrice  || 0),
      purchasePrice:  Number(data.purchasePrice || 0),
    });
  });

  // Sort: Out of Stock first, then by how far below minimum
  suggestions.sort((a, b) => {
    if (a.currentStock === 0 && b.currentStock !== 0) return -1;
    if (b.currentStock === 0 && a.currentStock !== 0) return 1;
    // Lower stock relative to minimum = higher priority
    const ratioA = a.currentStock / (a.minimumStock || 1);
    const ratioB = b.currentStock / (b.minimumStock || 1);
    return ratioA - ratioB;
  });

  return suggestions;
};
