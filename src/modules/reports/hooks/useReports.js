/**
 * @file        useReports.js
 * @module      Reports
 * @purpose     Custom hook that fetches data and runs all calculators.
 *              Components receive ready-to-render data — no Firestore or
 *              calculation logic inside any JSX file.
 *
 * Strategy: 2 Firestore fetches total (sales + medicines).
 * saleItems are fetched separately only for Top Medicines calculation.
 * All other KPIs are derived from the two main fetches.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAllSales, fetchAllMedicines, fetchSaleItemsForSales } from '../services/reportService';
import {
  calcSalesKPIs,
  calcInventoryKPIs,
  calcExpiryKPIs,
  calcTopMedicines,
  calcPaymentMethods,
  calcSalesTrend,
  calcCategoryStock,
} from '../utils/reportCalculator';

const useReports = (dateRange) => {
  const [salesKPIs,      setSalesKPIs]      = useState(null);
  const [inventoryKPIs,  setInventoryKPIs]  = useState(null);
  const [expiryKPIs,     setExpiryKPIs]     = useState(null);
  const [topMedicines,   setTopMedicines]   = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [salesTrend,     setSalesTrend]     = useState(null);
  const [categoryData,   setCategoryData]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ── Fetch 1: All Sales ──────────────────────────
      const allSales = await fetchAllSales();

      // Filter sales based on the selected date range for KPIs
      const filteredSales = allSales.filter((sale) => {
        const d = sale.date;
        return d >= dateRange.startDate && d <= dateRange.endDate;
      });

      // ── Fetch 2: All active medicines (not date-filtered) ─────────────────
      const medicines = await fetchAllMedicines();

      // ── Fetch 3: saleItems for filtered sales (for Top Medicines) ─────────
      const saleIds   = filteredSales.map((s) => s.id);
      const saleItems = await fetchSaleItemsForSales(saleIds);

      // ── Calculate all KPIs from fetched data ──────────────────────────────
      setSalesKPIs(calcSalesKPIs(filteredSales));
      setInventoryKPIs(calcInventoryKPIs(medicines));
      setExpiryKPIs(calcExpiryKPIs(medicines));
      setTopMedicines(calcTopMedicines(saleItems));
      setPaymentMethods(calcPaymentMethods(filteredSales));
      setCategoryData(calcCategoryStock(medicines));

      // Sales trend now dynamically reflects the selected date range.
      setSalesTrend(calcSalesTrend(filteredSales, dateRange));

    } catch (err) {
      console.error('Reports load error:', err);
      setError(err.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    salesKPIs,
    inventoryKPIs,
    expiryKPIs,
    topMedicines,
    paymentMethods,
    salesTrend,
    categoryData,
    loading,
    error,
    refresh: loadReports,
  };
};

export default useReports;
