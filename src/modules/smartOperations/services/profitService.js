/**
 * @file        profitService.js
 * @module      SmartOperations
 * @purpose     Computes profit & margin analysis from real Firebase data.
 *
 *              Data sources:
 *                - saleItems  → medicineId, quantity, unitPrice (selling price at sale time)
 *                - medicines  → purchasePrice (current; joined by medicineId)
 *
 *              Calculations:
 *                revenue     = sum(saleItem.unitPrice × saleItem.quantity)
 *                cost        = sum(saleItem.quantity × medicine.purchasePrice)
 *                profit      = revenue - cost
 *                margin      = (profit / revenue) × 100
 *
 *              LIMITATION (noted in UI): purchasePrice is current value, not
 *              historical price at time of sale. This is a known student-project
 *              limitation and is clearly communicated in the UI.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import db from '../../../firebase/firestore';
import { SO_COLLECTIONS, MED_STATUS } from '../constants/smartOpsConstants';

// ─────────────────────────────────────────────────────────────────────────────
// getProfitAnalysis
// Returns overall KPI totals + per-medicine breakdown.
//
// @returns {Promise<{
//   kpi: { totalRevenue, totalCost, grossProfit, profitMargin },
//   products: Array<{ medicineId, medicineName, revenue, cost, profit, margin, unitsSold }>
// }>}
// ─────────────────────────────────────────────────────────────────────────────
export const getProfitAnalysis = async () => {
  // 1. Fetch all sale items
  const saleItemsSnap = await getDocs(collection(db, SO_COLLECTIONS.SALE_ITEMS));
  const saleItems = saleItemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (saleItems.length === 0) {
    return {
      kpi: { totalRevenue: 0, totalCost: 0, grossProfit: 0, profitMargin: 0 },
      products: [],
    };
  }

  // 2. Fetch all ACTIVE medicines for purchasePrice lookup
  const medsSnap = await getDocs(
    query(collection(db, SO_COLLECTIONS.MEDICINES), where('status', '==', MED_STATUS.ACTIVE))
  );
  const medicineMap = {};
  medsSnap.docs.forEach((d) => {
    medicineMap[d.id] = { ...d.data(), id: d.id };
  });

  // 3. Aggregate per medicine
  const productMap = {};

  saleItems.forEach((item) => {
    const qty          = Number(item.quantity   || 1);
    const unitPrice    = Number(item.unitPrice   || item.sellingPrice || 0);
    const medicineId   = item.medicineId || '';
    const medicineName = item.medicineName || 'Unknown';

    const medicine     = medicineMap[medicineId];
    const purchasePrice = medicine ? Number(medicine.purchasePrice || 0) : 0;

    const itemRevenue = unitPrice * qty;
    const itemCost    = purchasePrice * qty;
    const itemProfit  = itemRevenue - itemCost;

    if (!productMap[medicineId]) {
      productMap[medicineId] = {
        medicineId,
        medicineName,
        revenue:   0,
        cost:      0,
        profit:    0,
        unitsSold: 0,
      };
    }

    productMap[medicineId].revenue   += itemRevenue;
    productMap[medicineId].cost      += itemCost;
    productMap[medicineId].profit    += itemProfit;
    productMap[medicineId].unitsSold += qty;
  });

  // 4. Compute margins per product
  const products = Object.values(productMap).map((p) => ({
    ...p,
    margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
  }));

  // Sort by revenue descending
  products.sort((a, b) => b.revenue - a.revenue);

  // 5. Overall KPIs
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalCost    = products.reduce((s, p) => s + p.cost,    0);
  const grossProfit  = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    kpi: { totalRevenue, totalCost, grossProfit, profitMargin },
    products,
  };
};
