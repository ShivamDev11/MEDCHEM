/**
 * @file        useReports.js
 * @module      Reports
 * @purpose     Custom hook that fetches all data and runs all calculators.
 *              Components receive ready-to-render data — no Firestore or
 *              calculation logic inside any JSX file.
 *
 *              Strategy: 4 base Firestore fetches (sales, medicines, purchases, suppliers).
 *              SaleItems fetched once for top-products and profit calculations.
 *              Everything else computed client-side from the base fetches.
 *              Data is cached — filters re-compute without re-fetching.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchAllSales,
  fetchAllMedicines,
  fetchAllPurchases,
  fetchAllSuppliers,
  fetchSaleItemsForSales,
} from '../services/reportService';
import {
  calcSalesKPIs,
  calcInventoryKPIs,
  calcExpiryKPIs,
  calcTopMedicines,
  calcPaymentMethods,
  calcSalesTrend,
  calcCategoryStock,
  calcStockStatus,
  calcPurchaseKPIs,
  calcSupplierStats,
  calcPurchaseTrend,
  calcProfitSummary,
  calcExpiryDetail,
} from '../utils/reportCalculator';
import { isInRange } from '../utils/dateRangeHelper';

const useReports = (globalFilters) => {
  // ── Raw fetched data (cached) ───────────────────────────────────────────────
  const [allSales,     setAllSales]     = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allSaleItems, setAllSaleItems] = useState([]);

  // ── Loading / error states ─────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // loadData — fetches all base collections once
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch of all base collections
      const [sales, medicines, purchases, suppliers] = await Promise.all([
        fetchAllSales(),
        fetchAllMedicines(),
        fetchAllPurchases(),
        fetchAllSuppliers(),
      ]);

      setAllSales(sales);
      setAllMedicines(medicines);
      setAllPurchases(purchases);
      setAllSuppliers(suppliers);

      // Fetch sale items for ALL sales (used for top products + profit)
      // We fetch for the most recent 500 to avoid over-reading
      const recentSaleIds = sales.slice(0, 500).map((s) => s.id);
      const saleItems = await fetchSaleItemsForSales(recentSaleIds);
      setAllSaleItems(saleItems);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Reports load error:', err);
      setError(err.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED DATA — all computed from cached raw data + current filters
  // No re-fetch on filter change; useMemo recalculates only affected slices.
  // ─────────────────────────────────────────────────────────────────────────

  const { startDate, endDate } = globalFilters.dateRange;

  // ── 1. Date-filtered sales ─────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      const d = sale.date;
      if (!isInRange(d, startDate, endDate)) return false;
      if (globalFilters.paymentMethod && sale.paymentMethod !== globalFilters.paymentMethod) return false;
      return true;
    });
  }, [allSales, startDate, endDate, globalFilters.paymentMethod]);

  // ── 2. Date-filtered purchases ────────────────────────────────────────────
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter((p) => {
      if (!isInRange(p.createdAt, startDate, endDate)) return false;
      if (globalFilters.supplier && p.supplierName !== globalFilters.supplier) return false;
      return true;
    });
  }, [allPurchases, startDate, endDate, globalFilters.supplier]);

  // ── 3. Category-filtered medicines ────────────────────────────────────────
  const filteredMedicines = useMemo(() => {
    let meds = allMedicines;
    if (globalFilters.category) {
      meds = meds.filter((m) => m.category === globalFilters.category);
    }
    if (globalFilters.supplier) {
      meds = meds.filter((m) =>
        (m.supplier || '').toLowerCase() === (globalFilters.supplier || '').toLowerCase()
      );
    }
    if (globalFilters.medicineSearch) {
      const term = globalFilters.medicineSearch.toLowerCase();
      meds = meds.filter(
        (m) =>
          (m.medicineName || '').toLowerCase().includes(term) ||
          (m.genericName  || '').toLowerCase().includes(term)
      );
    }
    return meds;
  }, [allMedicines, globalFilters.category, globalFilters.supplier, globalFilters.medicineSearch]);

  // ── 4. Sale items for filtered sales ─────────────────────────────────────
  const filteredSaleItems = useMemo(() => {
    const filteredIds = new Set(filteredSales.map((s) => s.id));
    let items = allSaleItems.filter((item) => filteredIds.has(item.saleId));
    if (globalFilters.category) {
      // Filter items by category using medicine lookup
      const catMedIds = new Set(
        allMedicines.filter((m) => m.category === globalFilters.category).map((m) => m.id)
      );
      items = items.filter((item) => catMedIds.has(item.medicineId));
    }
    return items;
  }, [allSaleItems, filteredSales, globalFilters.category, allMedicines]);

  // ── 5. Sales KPIs ─────────────────────────────────────────────────────────
  const salesKPIs = useMemo(
    () => (loading ? null : calcSalesKPIs(filteredSales)),
    [filteredSales, loading]
  );

  // ── 6. Inventory KPIs (current state, not date-filtered) ─────────────────
  const inventoryKPIs = useMemo(
    () => (loading ? null : calcInventoryKPIs(allMedicines)),
    [allMedicines, loading]
  );

  // ── 7. Expiry KPIs ────────────────────────────────────────────────────────
  const expiryKPIs = useMemo(
    () => (loading ? null : calcExpiryKPIs(allMedicines)),
    [allMedicines, loading]
  );

  // ── 8. Purchase KPIs ─────────────────────────────────────────────────────
  const purchaseKPIs = useMemo(
    () => (loading ? null : calcPurchaseKPIs(filteredPurchases)),
    [filteredPurchases, loading]
  );

  // ── 9. Gross Profit ───────────────────────────────────────────────────────
  const profitKPIs = useMemo(() => {
    if (loading || !salesKPIs || !purchaseKPIs) return null;
    const grossProfit = salesKPIs.totalRevenue - purchaseKPIs.totalPurchaseValue;
    const margin = salesKPIs.totalRevenue > 0
      ? (grossProfit / salesKPIs.totalRevenue) * 100
      : 0;
    return { grossProfit, margin };
  }, [salesKPIs, purchaseKPIs, loading]);

  // ── 10. Top Medicines ─────────────────────────────────────────────────────
  const topMedicines = useMemo(
    () => (loading ? [] : calcTopMedicines(filteredSaleItems, allMedicines)),
    [filteredSaleItems, allMedicines, loading]
  );

  // ── 11. Payment Methods ───────────────────────────────────────────────────
  const paymentMethods = useMemo(
    () => (loading ? null : calcPaymentMethods(filteredSales)),
    [filteredSales, loading]
  );

  // ── 12. Sales Trend ───────────────────────────────────────────────────────
  const salesTrend = useMemo(
    () => (loading ? null : calcSalesTrend(filteredSales, globalFilters.dateRange)),
    [filteredSales, globalFilters.dateRange, loading]
  );

  // ── 13. Category Stock ────────────────────────────────────────────────────
  const categoryData = useMemo(
    () => (loading ? [] : calcCategoryStock(allMedicines)),
    [allMedicines, loading]
  );

  // ── 14. Stock Status Distribution ────────────────────────────────────────
  const stockStatusData = useMemo(
    () => (loading ? [] : calcStockStatus(allMedicines)),
    [allMedicines, loading]
  );

  // ── 15. Supplier Stats ────────────────────────────────────────────────────
  const supplierStats = useMemo(
    () => (loading ? [] : calcSupplierStats(allPurchases, allSuppliers, allMedicines)),
    [allPurchases, allSuppliers, allMedicines, loading]
  );

  // ── 16. Purchase Trend ────────────────────────────────────────────────────
  const purchaseTrend = useMemo(
    () => (loading ? null : calcPurchaseTrend(filteredPurchases, globalFilters.dateRange)),
    [filteredPurchases, globalFilters.dateRange, loading]
  );

  // ── 17. Profit Summary ────────────────────────────────────────────────────
  const profitSummary = useMemo(
    () => (loading ? null : calcProfitSummary(filteredSaleItems, allMedicines)),
    [filteredSaleItems, allMedicines, loading]
  );

  // ── 18. Expiry Detail ─────────────────────────────────────────────────────
  const expiryDetail = useMemo(
    () => (loading ? null : calcExpiryDetail(allMedicines)),
    [allMedicines, loading]
  );

  // ── 19. Low-stock medicines list ──────────────────────────────────────────
  const lowStockMedicines = useMemo(() => {
    if (loading) return [];
    return allMedicines.filter(
      (m) => Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock || 0)
    );
  }, [allMedicines, loading]);

  const outOfStockMedicines = useMemo(() => {
    if (loading) return [];
    return allMedicines.filter((m) => Number(m.quantity) === 0);
  }, [allMedicines, loading]);

  return {
    // Raw data (for drawers and tables)
    allSales,
    allMedicines,
    allPurchases,
    allSuppliers,
    allSaleItems,
    filteredSales,
    filteredPurchases,
    filteredMedicines,
    filteredSaleItems,
    lowStockMedicines,
    outOfStockMedicines,

    // Computed KPIs
    salesKPIs,
    inventoryKPIs,
    expiryKPIs,
    purchaseKPIs,
    profitKPIs,

    // Chart data
    topMedicines,
    paymentMethods,
    salesTrend,
    categoryData,
    stockStatusData,
    supplierStats,
    purchaseTrend,
    profitSummary,
    expiryDetail,

    // Meta
    loading,
    error,
    lastRefreshed,
    refresh: loadData,
  };
};

export default useReports;
