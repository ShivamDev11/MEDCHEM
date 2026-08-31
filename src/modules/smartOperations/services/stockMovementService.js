/**
 * @file        stockMovementService.js
 * @module      SmartOperations
 * @purpose     Reads from the existing `inventoryLogs` collection to produce
 *              a clean stock movement history view.
 *
 *              The inventoryLogs collection is written by:
 *                - salesService.js (on sale) — fields: medicineId, previousStock, soldQuantity, newStock, saleId, userId, timestamp
 *                - purchaseService.js (on purchase) — same + action: 'Purchase', purchaseId, medicineName, purchaseQuantity
 *
 *              This service normalises both shapes into a unified movement row.
 */

import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { SO_COLLECTIONS, MED_STATUS } from '../constants/smartOpsConstants';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: safe date from Firestore timestamp or raw value
// ─────────────────────────────────────────────────────────────────────────────
const safeDate = (val) => {
  if (!val) return new Date(0);
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
};

// ─────────────────────────────────────────────────────────────────────────────
// getStockMovements
// Returns a list of normalised stock movement rows, enriched with medicine names.
//
// @param {object} filters – { dateFilter, customStart, customEnd, medicineName }
// @returns {Promise<Array<{
//   id, medicineId, medicineName, previousStock, change, newStock, action, date, userId
// }>>}
// ─────────────────────────────────────────────────────────────────────────────
export const getStockMovements = async (filters = {}) => {
  // Fetch all logs sorted by timestamp desc
  const logsRef = collection(db, SO_COLLECTIONS.INVENTORY_LOGS);
  const q = query(logsRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);

  // Build a medicine name lookup map
  const medsSnap = await getDocs(
    query(collection(db, SO_COLLECTIONS.MEDICINES))
  );
  const medicineNameMap = {};
  medsSnap.docs.forEach((d) => {
    const data = d.data();
    medicineNameMap[d.id] = data.medicineName || data.name || 'Unknown';
  });

  // Normalise each log entry
  let movements = snap.docs.map((d) => {
    const data = d.data();
    const date = safeDate(data.timestamp);

    // Determine action and change direction
    let action, change;
    if (data.action === 'Purchase' || data.purchaseQuantity) {
      action = 'Purchase';
      change = Number(data.purchaseQuantity || 0);
    } else {
      action = 'Sale';
      change = -(Number(data.soldQuantity || 0));
    }

    const medicineName =
      data.medicineName ||
      medicineNameMap[data.medicineId] ||
      'Unknown';

    return {
      id:            d.id,
      medicineId:    data.medicineId   || '',
      medicineName,
      previousStock: Number(data.previousStock ?? 0),
      change,
      newStock:      Number(data.newStock ?? 0),
      action,
      date,
      userId:        data.userId || 'System',
    };
  });

  // Apply medicine name filter
  if (filters.medicineName && filters.medicineName.trim()) {
    const lower = filters.medicineName.trim().toLowerCase();
    movements = movements.filter(
      (m) => m.medicineName.toLowerCase().includes(lower)
    );
  }

  // Apply action filter
  if (filters.action && filters.action !== 'ALL') {
    movements = movements.filter((m) => m.action === filters.action);
  }

  // Apply date filter
  movements = applyDateFilter(movements, filters);

  return movements;
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: date filter applied to movements array
// ─────────────────────────────────────────────────────────────────────────────
function applyDateFilter(movements, filters) {
  const { dateFilter, customStart, customEnd } = filters;
  if (!dateFilter || dateFilter === 'ALL') return movements;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (dateFilter) {
    case 'TODAY': {
      return movements.filter((m) => {
        const d = new Date(m.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === now.getTime();
      });
    }
    case '7DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      return movements.filter((m) => new Date(m.date) >= cutoff);
    }
    case '30DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return movements.filter((m) => new Date(m.date) >= cutoff);
    }
    case 'CUSTOM': {
      return movements.filter((m) => {
        const d = new Date(m.date);
        if (customStart && d < new Date(customStart)) return false;
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      });
    }
    default:
      return movements;
  }
}
