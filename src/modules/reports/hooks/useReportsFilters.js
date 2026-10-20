/**
 * @file        useReportsFilters.js
 * @module      Reports
 * @purpose     Single source of truth for ALL report filters and cross-filter
 *              selections. Every chart, table, and KPI card reads from this hook.
 *
 *              Filter types:
 *                globalFilters   – date range, category, supplier, payment method,
 *                                  medicine search (applied to queries)
 *                crossFilters    – selections made by clicking chart elements
 *                                  (applied to compatible visualisations only)
 *                drawerState     – what the detail drawer is showing
 */

import { useState, useCallback } from 'react';
import { buildRangeFromPreset, buildInitialRange } from '../utils/dateRangeHelper';

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_GLOBAL = {
  dateRange:     buildInitialRange(),   // { startDate, endDate, preset }
  preset:        'last30days',
  category:      null,                  // string | null
  supplier:      null,                  // string | null
  paymentMethod: null,                  // 'Cash' | 'UPI' | 'Card' | null
  medicineSearch:'',                    // free-text search
};

const INITIAL_CROSS = {
  selectedPaymentMethod:  null,   // clicked payment segment
  selectedCategory:       null,   // clicked category bar
  selectedProduct:        null,   // clicked product bar or table row
  selectedDatePoint:      null,   // clicked trend chart date string
  selectedExpiryBucket:   null,   // 'expired'|'within30'|'within60'|'within90'
  selectedStockStatus:    null,   // 'In Stock'|'Low Stock'|'Out of Stock'|'Expired'
  selectedSupplier:       null,   // clicked supplier bar
};

const INITIAL_DRAWER = {
  open: false,
  mode: null,    // from DRAWER_MODES constants
  title: '',
  context: null, // any extra context for the drawer (e.g. saleId, supplierName)
};

// ─────────────────────────────────────────────────────────────────────────────
// useReportsFilters
// ─────────────────────────────────────────────────────────────────────────────
const useReportsFilters = () => {
  const [globalFilters, setGlobalFilters] = useState(INITIAL_GLOBAL);
  const [crossFilters,  setCrossFilters]  = useState(INITIAL_CROSS);
  const [drawer,        setDrawer]        = useState(INITIAL_DRAWER);

  // ── Global filter setters ──────────────────────────────────────────────────

  const setPreset = useCallback((preset) => {
    if (preset === 'custom') {
      setGlobalFilters((prev) => ({ ...prev, preset: 'custom' }));
      return;
    }
    const dateRange = buildRangeFromPreset(preset);
    setGlobalFilters((prev) => ({ ...prev, preset, dateRange }));
    // Clear date-point cross-filter when range changes
    setCrossFilters((prev) => ({ ...prev, selectedDatePoint: null }));
  }, []);

  const setCustomDateRange = useCallback((startDate, endDate) => {
    setGlobalFilters((prev) => ({
      ...prev,
      preset:    'custom',
      dateRange: { startDate, endDate, preset: 'custom' },
    }));
    setCrossFilters((prev) => ({ ...prev, selectedDatePoint: null }));
  }, []);

  const setCategory = useCallback((cat) => {
    setGlobalFilters((prev) => ({ ...prev, category: cat || null }));
    setCrossFilters((prev) => ({ ...prev, selectedCategory: null }));
  }, []);

  const setSupplier = useCallback((sup) => {
    setGlobalFilters((prev) => ({ ...prev, supplier: sup || null }));
    setCrossFilters((prev) => ({ ...prev, selectedSupplier: null }));
  }, []);

  const setPaymentMethod = useCallback((method) => {
    setGlobalFilters((prev) => ({ ...prev, paymentMethod: method || null }));
    setCrossFilters((prev) => ({ ...prev, selectedPaymentMethod: null }));
  }, []);

  const setMedicineSearch = useCallback((text) => {
    setGlobalFilters((prev) => ({ ...prev, medicineSearch: text }));
  }, []);

  // ── Cross-filter setters (chart click interactions) ───────────────────────

  const toggleCrossFilter = useCallback((key, value) => {
    setCrossFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,  // toggle off if same value
    }));
  }, []);

  const selectPayment = useCallback((method) =>
    toggleCrossFilter('selectedPaymentMethod', method), [toggleCrossFilter]);

  const selectCategory = useCallback((cat) =>
    toggleCrossFilter('selectedCategory', cat), [toggleCrossFilter]);

  const selectProduct = useCallback((product) => {
    setCrossFilters((prev) => ({ ...prev, selectedProduct: product }));
  }, []);

  const selectDatePoint = useCallback((dateStr) =>
    toggleCrossFilter('selectedDatePoint', dateStr), [toggleCrossFilter]);

  const selectExpiryBucket = useCallback((bucket) =>
    toggleCrossFilter('selectedExpiryBucket', bucket), [toggleCrossFilter]);

  const selectStockStatus = useCallback((status) =>
    toggleCrossFilter('selectedStockStatus', status), [toggleCrossFilter]);

  const selectSupplier = useCallback((supplier) =>
    toggleCrossFilter('selectedSupplier', supplier), [toggleCrossFilter]);

  // ── Drawer controls ────────────────────────────────────────────────────────

  const openDrawer = useCallback((mode, title, context = null) => {
    setDrawer({ open: true, mode, title, context });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer(INITIAL_DRAWER);
  }, []);

  // ── Reset all ─────────────────────────────────────────────────────────────

  const resetFilters = useCallback(() => {
    setGlobalFilters(INITIAL_GLOBAL);
    setCrossFilters(INITIAL_CROSS);
    setDrawer(INITIAL_DRAWER);
  }, []);

  // ── Clear individual cross-filter ─────────────────────────────────────────

  const clearCrossFilter = useCallback((key) => {
    setCrossFilters((prev) => ({ ...prev, [key]: null }));
  }, []);

  const clearGlobalFilter = useCallback((key) => {
    setGlobalFilters((prev) => ({ ...prev, [key]: key === 'medicineSearch' ? '' : null }));
  }, []);

  // ── Derived: active filter count (for "Reset" badge) ─────────────────────

  const activeGlobalCount =
    (globalFilters.category      ? 1 : 0) +
    (globalFilters.supplier      ? 1 : 0) +
    (globalFilters.paymentMethod ? 1 : 0) +
    (globalFilters.medicineSearch ? 1 : 0);

  const activeCrossCount = Object.values(crossFilters).filter(Boolean).length;

  return {
    globalFilters,
    crossFilters,
    drawer,

    // Global filter setters
    setPreset,
    setCustomDateRange,
    setCategory,
    setSupplier,
    setPaymentMethod,
    setMedicineSearch,

    // Cross-filter setters
    selectPayment,
    selectCategory,
    selectProduct,
    selectDatePoint,
    selectExpiryBucket,
    selectStockStatus,
    selectSupplier,

    // Drawer
    openDrawer,
    closeDrawer,

    // Reset / clear
    resetFilters,
    clearCrossFilter,
    clearGlobalFilter,

    // Derived
    activeGlobalCount,
    activeCrossCount,
    hasActiveFilters: activeGlobalCount > 0 || activeCrossCount > 0,
  };
};

export default useReportsFilters;
