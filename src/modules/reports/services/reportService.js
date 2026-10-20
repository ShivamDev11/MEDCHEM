/**
 * @file        reportService.js
 * @module      Reports
 * @purpose     Firestore data fetching for the Reports module.
 *              Reuses existing service functions wherever possible.
 *              All KPI calculations happen in reportCalculator.js, not here.
 */

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { getSalesHistory } from '../../sales/services/salesService';
import { REPORT_COLLECTIONS } from '../constants/reportsConstants';
import { MEDICINE_STATUS } from '../../inventory/constants/inventoryConstants';

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllSales
// Reuses the existing getSalesHistory function. Returns up to 2000 recent sales.
// Filtering by date range is handled in the hook / calculator.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAllSales = async () => {
  return await getSalesHistory(2000);
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllMedicines
// Fetches all ACTIVE medicines in one read.
// Used for inventory KPIs, expiry report, category analysis.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAllMedicines = async () => {
  const medicinesRef = collection(db, REPORT_COLLECTIONS.MEDICINES);
  const q = query(medicinesRef, where('status', '==', MEDICINE_STATUS.ACTIVE));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchSaleItemsForSales
// Batch-fetches saleItems for the given saleIds using chunked 'in' queries.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchSaleItemsForSales = async (saleIds) => {
  if (!saleIds || saleIds.length === 0) return [];

  const CHUNK_SIZE = 30;
  const chunks = [];
  for (let i = 0; i < saleIds.length; i += CHUNK_SIZE) {
    chunks.push(saleIds.slice(i, i + CHUNK_SIZE));
  }

  const itemsRef = collection(db, REPORT_COLLECTIONS.SALE_ITEMS);
  const results = [];

  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(itemsRef, where('saleId', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
    })
  );

  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllPurchases
// Fetches all purchases ordered by date desc.
// Reuses the 'purchases' collection from SmartOperations.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAllPurchases = async () => {
  try {
    const purchasesRef = collection(db, REPORT_COLLECTIONS.PURCHASES);
    const q = query(purchasesRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0);
      return { id: doc.id, ...data, createdAt };
    });
  } catch (err) {
    console.warn('fetchAllPurchases error (purchases collection may be empty):', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllSuppliers
// Fetches all ACTIVE suppliers from the suppliers collection.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAllSuppliers = async () => {
  try {
    const suppliersRef = collection(db, REPORT_COLLECTIONS.SUPPLIERS);
    const q = query(suppliersRef, where('status', '==', 'ACTIVE'));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('fetchAllSuppliers error:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchPurchaseItemsForPurchases
// Batch-fetches purchaseItems for the given purchaseIds.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchPurchaseItemsForPurchases = async (purchaseIds) => {
  if (!purchaseIds || purchaseIds.length === 0) return [];

  const CHUNK_SIZE = 30;
  const chunks = [];
  for (let i = 0; i < purchaseIds.length; i += CHUNK_SIZE) {
    chunks.push(purchaseIds.slice(i, i + CHUNK_SIZE));
  }

  const itemsRef = collection(db, REPORT_COLLECTIONS.PURCHASE_ITEMS);
  const results = [];

  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(itemsRef, where('purchaseId', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
    })
  );

  return results;
};
