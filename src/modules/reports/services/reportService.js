/**
 * @file        reportService.js
 * @module      Reports
 * @purpose     Firestore data fetching for the Reports module.
 *              Reuses getSalesHistory from salesService wherever possible.
 *              All KPI calculations happen in reportCalculator.js, not here.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { getSalesHistory } from '../../sales/services/salesService';
import { REPORT_COLLECTIONS } from '../constants/reportsConstants';
import { MEDICINE_STATUS } from '../../inventory/constants/inventoryConstants';

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllSales
// Reuses the existing getSalesHistory function. Returns all fetched sales.
// Filtering by date range is handled by the hook so the trend chart
// can still access the last 7 days regardless of the selected filter.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchAllSales = async () => {
  return await getSalesHistory(1000);
};

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllMedicines
// Fetches all ACTIVE medicines in one read.
// Used for inventory KPIs, expiry report, and category analysis.
//
// @returns {Promise<object[]>}
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
// Mirrors the existing chunked pattern in salesService.getSalesHistory.
//
// @param {string[]} saleIds
// @returns {Promise<object[]>}
// ─────────────────────────────────────────────────────────────────────────────
export const fetchSaleItemsForSales = async (saleIds) => {
  if (!saleIds || saleIds.length === 0) return [];

  const CHUNK_SIZE = 30; // Firestore 'in' limit
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
