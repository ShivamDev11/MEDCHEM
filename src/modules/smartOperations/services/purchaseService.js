/**
 * @file        purchaseService.js
 * @module      SmartOperations
 * @purpose     Firestore service for purchase management.
 *              createPurchase uses an atomic transaction to:
 *                1. Write purchase header
 *                2. Write purchase items
 *                3. Update medicine stock (quantity += purchased)
 *                4. Write inventory log entry
 *                5. Write activity log entry
 *
 *              Stock is NEVER updated outside this transaction.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import db from '../../../firebase/firestore';
import {
  SO_COLLECTIONS,
  PURCHASE_STATUS,
  SO_ACTION_TYPES,
} from '../constants/smartOpsConstants';

const purchasesRef     = collection(db, SO_COLLECTIONS.PURCHASES);
const purchaseItemsRef = collection(db, SO_COLLECTIONS.PURCHASE_ITEMS);

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const mapDoc = (d) => ({ id: d.id, ...d.data() });

const safeDate = (val) => {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. createPurchase  ← ATOMIC FIRESTORE TRANSACTION
//
// @param {object} purchaseHeader  – { supplierId, supplierName, totalAmount, notes }
// @param {Array}  items           – [{ medicineId, medicineName, quantity, purchasePrice, subtotal }]
// @param {string} userId
// ─────────────────────────────────────────────────────────────────────────────
export const createPurchase = async (purchaseHeader, items, userId = 'system') => {
  if (!items || items.length === 0) throw new Error('No items in purchase.');

  // Validate quantities
  items.forEach((item) => {
    if (!item.medicineId) throw new Error('Missing medicine ID.');
    if (Number(item.quantity) < 1) throw new Error(`Quantity must be at least 1 for ${item.medicineName}.`);
    if (Number(item.purchasePrice) <= 0) throw new Error(`Purchase price must be > 0 for ${item.medicineName}.`);
  });

  const purchaseId  = doc(purchasesRef).id;
  const timestamp   = serverTimestamp();
  const totalAmount = items.reduce((sum, i) => sum + Number(i.subtotal || 0), 0);

  await runTransaction(db, async (transaction) => {
    // ── Phase 1: Read all medicine docs (reads BEFORE writes) ──────────────
    const medRefs = items.map((item) => doc(db, SO_COLLECTIONS.MEDICINES, item.medicineId));
    const medSnaps = await Promise.all(medRefs.map((ref) => transaction.get(ref)));

    medSnaps.forEach((snap, idx) => {
      if (!snap.exists()) {
        throw new Error(`Medicine "${items[idx].medicineName}" not found in inventory.`);
      }
    });

    // ── Phase 2: Write purchase header ────────────────────────────────────
    const purchaseRef = doc(db, SO_COLLECTIONS.PURCHASES, purchaseId);
    transaction.set(purchaseRef, {
      id:           purchaseId,
      supplierId:   purchaseHeader.supplierId   || '',
      supplierName: purchaseHeader.supplierName || '',
      totalAmount,
      notes:        purchaseHeader.notes        || '',
      status:       PURCHASE_STATUS.COMPLETED,
      createdBy:    userId,
      createdAt:    timestamp,
    });

    // ── Phase 3: Write purchase items + update stock + write inventory log ─
    items.forEach((item, idx) => {
      const medSnap    = medSnaps[idx];
      const medData    = medSnap.data();
      const prevStock  = Number(medData.quantity ?? medData.currentStock ?? 0);
      const newStock   = prevStock + Number(item.quantity);

      // Purchase item doc
      const piRef = doc(purchaseItemsRef);
      transaction.set(piRef, {
        purchaseId,
        medicineId:    item.medicineId,
        medicineName:  item.medicineName,
        batchNumber:   item.batchNumber || '',
        quantity:      Number(item.quantity),
        purchasePrice: Number(item.purchasePrice),
        subtotal:      Number(item.subtotal || item.quantity * item.purchasePrice),
        createdAt:     timestamp,
      });

      // Update medicine stock
      transaction.update(medRefs[idx], {
        quantity:     newStock,
        currentStock: newStock,
      });

      // Inventory log (same structure as salesService logs for consistency)
      const logRef = doc(collection(db, SO_COLLECTIONS.INVENTORY_LOGS));
      transaction.set(logRef, {
        medicineId:    item.medicineId,
        medicineName:  item.medicineName,
        previousStock: prevStock,
        soldQuantity:  0,
        purchaseQuantity: Number(item.quantity),
        newStock,
        action:        'Purchase',
        purchaseId,
        userId,
        timestamp,
      });
    });

    // ── Phase 4: Activity log ──────────────────────────────────────────────
    const actRef = doc(collection(db, SO_COLLECTIONS.ACTIVITY_LOGS));
    transaction.set(actRef, {
      action:      SO_ACTION_TYPES.PURCHASE_CREATED,
      module:      'SmartOperations',
      performedBy: userId,
      date:        timestamp,
      details:     `Purchase from ${purchaseHeader.supplierName} — ₹${totalAmount.toFixed(2)}`,
    });
  });

  return { success: true, purchaseId };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. getPurchases
// Returns purchases ordered by date desc, with optional filters applied client-side.
// @param {object} filters – { supplierName, medicineId, dateFilter, customStart, customEnd }
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchases = async (filters = {}) => {
  const q = query(purchasesRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  let purchases = snap.docs.map((d) => ({
    ...mapDoc(d),
    createdAt: safeDate(d.data().createdAt),
  }));

  // Apply supplier filter
  if (filters.supplierName && filters.supplierName !== 'ALL') {
    const lower = filters.supplierName.toLowerCase();
    purchases = purchases.filter(
      (p) => (p.supplierName || '').toLowerCase().includes(lower)
    );
  }

  // Apply date filter
  purchases = applyDateFilter(purchases, filters);

  return purchases;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. getPurchaseItems
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchaseItems = async (purchaseId) => {
  const q    = query(purchaseItemsRef, where('purchaseId', '==', purchaseId));
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. getPurchasesForSupplier
// Returns all purchases for a given supplier name.
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchasesForSupplier = async (supplierName) => {
  const q = query(
    purchasesRef,
    where('supplierName', '==', supplierName),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...mapDoc(d),
    createdAt: safeDate(d.data().createdAt),
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. getPurchaseSummaryBySupplier
// Returns a map: { [supplierNameLower]: { totalAmount, lastDate } }
// Used to enrich supplier list with purchase statistics.
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchaseSummaryBySupplier = async () => {
  const snap = await getDocs(purchasesRef);
  const map  = {};

  snap.docs.forEach((d) => {
    const data  = d.data();
    const key   = (data.supplierName || '').toLowerCase();
    const amt   = Number(data.totalAmount || 0);
    const date  = safeDate(data.createdAt);

    if (!map[key]) {
      map[key] = { totalAmount: 0, lastDate: null };
    }
    map[key].totalAmount += amt;
    if (!map[key].lastDate || date > map[key].lastDate) {
      map[key].lastDate = date;
    }
  });

  return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: applyDateFilter
// ─────────────────────────────────────────────────────────────────────────────
function applyDateFilter(purchases, filters) {
  const { dateFilter, customStart, customEnd } = filters;
  if (!dateFilter || dateFilter === 'ALL') return purchases;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (dateFilter) {
    case 'TODAY': {
      return purchases.filter((p) => {
        const d = new Date(p.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === now.getTime();
      });
    }
    case '7DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      return purchases.filter((p) => new Date(p.createdAt) >= cutoff);
    }
    case '30DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return purchases.filter((p) => new Date(p.createdAt) >= cutoff);
    }
    case 'CUSTOM': {
      return purchases.filter((p) => {
        const d = new Date(p.createdAt);
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
      return purchases;
  }
}
