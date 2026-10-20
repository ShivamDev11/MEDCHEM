/**
 * @file        Reports.jsx
 * @module      Reports
 * @purpose     Main Reports & Analytics page upgraded to an interactive,
 *              Power BI-style Business Intelligence Dashboard.
 *              Centralises filter state, coordinates cross-filtering, and renders
 *              rich visualizations, KPI metrics, drill-through drawers, and exports.
 */

import React, { useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

import '../reports.css';
import useReports from '../hooks/useReports';
import useReportsFilters from '../hooks/useReportsFilters';
import { DRAWER_MODES } from '../constants/reportsConstants';

// ── Components ───────────────────────────────────────────────────────────────
import ReportsHeader          from '../components/ReportsHeader';
import ReportsFilters         from '../components/ReportsFilters';
import FilterChips            from '../components/FilterChips';
import SectionHeader          from '../components/SectionHeader';
import ExecutiveKpiCards      from '../components/ExecutiveKpiCards';
import SalesTrendChart        from '../components/SalesTrendChart';
import RevenueVsCostChart     from '../components/RevenueVsCostChart';
import PaymentMethodChart     from '../components/PaymentMethodChart';
import TopProductsChart       from '../components/TopProductsChart';
import CategoryInventoryChart from '../components/CategoryInventoryChart';
import InventoryStatusChart   from '../components/InventoryStatusChart';
import ExpiryBucketChart      from '../components/ExpiryBucketChart';
import SupplierAnalyticsChart from '../components/SupplierAnalyticsChart';
import ProfitAnalyticsSection from '../components/ProfitAnalyticsSection';
import ReportDetailDrawer     from '../components/ReportDetailDrawer';

// ── Export utilities ────────────────────────────────────────────────────────
import {
  exportSalesReport,
  exportInventoryReport,
  exportExpiryReport,
  exportTopMedicines,
  exportPaymentReport,
  exportPurchasesReport,
} from '../utils/csvExport';

function Reports() {
  // ── 1. Centralised Filter State (Global + Cross-Filters + Drawer) ──────────
  const {
    globalFilters,
    crossFilters,
    drawer,
    setPreset,
    setCustomDateRange,
    setCategory,
    setSupplier,
    setPaymentMethod,
    setMedicineSearch,
    selectPayment,
    selectCategory,
    selectProduct,
    selectDatePoint,
    selectExpiryBucket,
    selectStockStatus,
    selectSupplier,
    openDrawer,
    closeDrawer,
    resetFilters,
    clearCrossFilter,
    clearGlobalFilter,
    hasActiveFilters,
  } = useReportsFilters();

  // ── 2. Data fetching & calculations hook ──────────────────────────────────
  const {
    allSales,
    allMedicines,
    allPurchases,
    allSuppliers,
    filteredSales,
    salesKPIs,
    inventoryKPIs,
    expiryKPIs,
    purchaseKPIs,
    profitKPIs,
    topMedicines,
    paymentMethods,
    salesTrend,
    categoryData,
    stockStatusData,
    supplierStats,
    purchaseTrend,
    profitSummary,
    expiryDetail,
    loading,
    error,
    lastRefreshed,
    refresh,
  } = useReports(globalFilters);

  // ── 3. Drill-Through Handlers ─────────────────────────────────────────────

  // KPI card clicks
  const handleKpiCardClick = useCallback((mode, title, context = null) => {
    openDrawer(mode, title, context);
  }, [openDrawer]);

  // Chart element clicks
  const handleDateClick = useCallback((dateKey, label) => {
    selectDatePoint(dateKey);
    openDrawer(DRAWER_MODES.SALES_LIST, `Sales on ${label || dateKey}`, { dateStr: dateKey });
  }, [selectDatePoint, openDrawer]);

  const handlePaymentClick = useCallback((method) => {
    selectPayment(method);
  }, [selectPayment]);

  const handleCategoryClick = useCallback((cat) => {
    selectCategory(cat);
  }, [selectCategory]);

  const handleProductClick = useCallback((product) => {
    selectProduct(product);
    openDrawer(DRAWER_MODES.TOP_PRODUCTS, `Performance: ${product.medicineName}`, { product });
  }, [selectProduct, openDrawer]);

  const handleStockStatusClick = useCallback((status) => {
    selectStockStatus(status);
    if (status === 'Expired') {
      openDrawer(DRAWER_MODES.EXPIRY_LIST, 'Expired Medicines', { bucket: 'expired' });
    } else if (status === 'Low Stock') {
      openDrawer(DRAWER_MODES.LOW_STOCK_LIST, 'Low-Stock Medicines (Needs Reorder)');
    } else if (status === 'Out of Stock') {
      openDrawer(DRAWER_MODES.INVENTORY_LIST, 'Out of Stock Medicines', { filterStatus: 'outOfStock' });
    } else {
      openDrawer(DRAWER_MODES.INVENTORY_LIST, 'In-Stock Active Medicines');
    }
  }, [selectStockStatus, openDrawer]);

  const handleExpiryBucketClick = useCallback((bucket, label) => {
    selectExpiryBucket(bucket);
    openDrawer(DRAWER_MODES.EXPIRY_LIST, `Medicines: ${label}`, { bucket });
  }, [selectExpiryBucket, openDrawer]);

  const handleSupplierClick = useCallback((supplierName) => {
    selectSupplier(supplierName);
  }, [selectSupplier]);

  const handleViewSupplierOrders = useCallback(() => {
    openDrawer(DRAWER_MODES.PURCHASE_LIST, 'All Purchase Invoices & Orders');
  }, [openDrawer]);

  const handleOpenProfitDrawer = useCallback(() => {
    openDrawer(DRAWER_MODES.PROFIT_LIST, 'Full Product Profit & Margin Breakdown');
  }, [openDrawer]);

  // ── 4. Export Handlers ────────────────────────────────────────────────────
  const handleExport = useCallback((type) => {
    try {
      switch (type) {
        case 'sales':
          if (!filteredSales.length) return toast.info('No sales data to export.');
          exportSalesReport(filteredSales);
          toast.success('Sales report exported.');
          break;
        case 'inventory':
          if (!allMedicines.length) return toast.info('No inventory records to export.');
          exportInventoryReport(allMedicines);
          toast.success('Inventory report exported.');
          break;
        case 'expiry':
          if (!allMedicines.length) return toast.info('No medicines to export.');
          exportExpiryReport(allMedicines);
          toast.success('Expiry risk report exported.');
          break;
        case 'topMedicines':
          if (!topMedicines.length) return toast.info('No top medicines data to export.');
          exportTopMedicines(topMedicines);
          toast.success('Top medicines report exported.');
          break;
        case 'payment':
          if (!paymentMethods) return toast.info('No payment data to export.');
          exportPaymentReport(paymentMethods);
          toast.success('Payment methods report exported.');
          break;
        case 'purchases':
          if (!allPurchases.length) return toast.info('No purchase data to export.');
          exportPurchasesReport(allPurchases);
          toast.success('Purchases report exported.');
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Please try again.');
    }
  }, [filteredSales, allMedicines, topMedicines, paymentMethods, allPurchases]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center justify-content-between rounded-3 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <FiAlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={refresh}>
            <FiRefreshCw className="me-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── 5. Render Full Dashboard ──────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 px-3 px-md-4 reports-page">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <ReportsHeader
        lastRefreshed={lastRefreshed}
        loading={loading}
        onRefresh={() => {
          refresh();
          toast.info('Refreshing analytics data...');
        }}
        onExport={handleExport}
        onPrint={handlePrint}
      />

      {/* ── Global Filter Bar ─────────────────────────────────────────────── */}
      <ReportsFilters
        globalFilters={globalFilters}
        setPreset={setPreset}
        setCustomDateRange={setCustomDateRange}
        setCategory={setCategory}
        setSupplier={setSupplier}
        setPaymentMethod={setPaymentMethod}
        setMedicineSearch={setMedicineSearch}
        resetFilters={resetFilters}
        suppliers={allSuppliers}
        categories={categoryData}
      />

      {/* ── Filter Chips ──────────────────────────────────────────────────── */}
      <FilterChips
        globalFilters={globalFilters}
        crossFilters={crossFilters}
        clearGlobalFilter={clearGlobalFilter}
        clearCrossFilter={clearCrossFilter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Section A: Executive KPI Cards (Clickable) ────────────────────── */}
      <ExecutiveKpiCards
        salesKPIs={salesKPIs}
        inventoryKPIs={inventoryKPIs}
        expiryKPIs={expiryKPIs}
        purchaseKPIs={purchaseKPIs}
        profitKPIs={profitKPIs}
        loading={loading}
        onCardClick={handleKpiCardClick}
      />

      {/* ── Section B: Sales & Revenue Analytics ───────────────────────────── */}
      <SectionHeader
        title="Sales &amp; Revenue Analytics"
        subtitle="Revenue trajectories, cash inflows, and transaction payment breakdowns"
        badgeText="Core Performance"
        badgeColor="primary"
        actionLabel="View All Sales"
        onAction={() => openDrawer(DRAWER_MODES.SALES_LIST, 'All Filtered Sales Transactions')}
      />

      <div className="row g-4 mb-2">
        {/* Sales Revenue Trend Chart */}
        <div className="col-12 col-xl-8">
          <SalesTrendChart
            salesTrend={salesTrend}
            loading={loading}
            selectedDatePoint={crossFilters.selectedDatePoint}
            onDateClick={handleDateClick}
            onClearDateFilter={() => clearCrossFilter('selectedDatePoint')}
          />
        </div>

        {/* Payment Method Donut Chart */}
        <div className="col-12 col-xl-4">
          <PaymentMethodChart
            paymentMethods={paymentMethods}
            loading={loading}
            selectedPaymentMethod={crossFilters.selectedPaymentMethod}
            onSelectPayment={handlePaymentClick}
            onClearPayment={() => clearCrossFilter('selectedPaymentMethod')}
          />
        </div>
      </div>

      {/* Cash Flow: Revenue vs. Purchase Cost */}
      <div className="row g-4 mb-2">
        <div className="col-12">
          <RevenueVsCostChart
            salesTrend={salesTrend}
            purchaseTrend={purchaseTrend}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Section C: Product Performance Analytics ───────────────────────── */}
      <SectionHeader
        title="Product Performance Analytics"
        subtitle="Top dispensing medicines ranked by volume and revenue"
        badgeText="Product Ranking"
        badgeColor="info"
        actionLabel="Inspect All Products"
        onAction={() => openDrawer(DRAWER_MODES.TOP_PRODUCTS, 'Product Sales Ranking & Margins')}
      />

      <div className="row g-4 mb-2">
        <div className="col-12">
          <TopProductsChart
            topMedicines={topMedicines}
            loading={loading}
            onProductClick={handleProductClick}
          />
        </div>
      </div>

      {/* ── Section D: Inventory & Stock Health Analytics ──────────────────── */}
      <SectionHeader
        title="Inventory &amp; Stock Health Analytics"
        subtitle="Real-time pharmaceutical catalog status, category valuation, and replenishment"
        badgeText="Inventory Status"
        badgeColor="success"
        actionLabel="Full Inventory List"
        onAction={() => openDrawer(DRAWER_MODES.INVENTORY_LIST, 'All Active Medicines Catalog')}
      />

      <div className="row g-4 mb-2">
        {/* Category Stock & Valuation */}
        <div className="col-12 col-lg-8">
          <CategoryInventoryChart
            categoryData={categoryData}
            loading={loading}
            selectedCategory={crossFilters.selectedCategory}
            onSelectCategory={handleCategoryClick}
            onClearCategory={() => clearCrossFilter('selectedCategory')}
          />
        </div>

        {/* Stock Status Distribution */}
        <div className="col-12 col-lg-4">
          <InventoryStatusChart
            stockStatusData={stockStatusData}
            loading={loading}
            onStatusClick={handleStockStatusClick}
          />
        </div>
      </div>

      {/* ── Section E: Expiry Risk Horizon ─────────────────────────────────── */}
      <SectionHeader
        title="Expiry Risk Horizon"
        subtitle="Upcoming shelf-life degradation and regulatory disposal thresholds"
        badgeText="Quality &amp; Compliance"
        badgeColor="danger"
        actionLabel="Expiry Registry"
        onAction={() => openDrawer(DRAWER_MODES.EXPIRY_LIST, 'Full Expiry Tracking Registry', { bucket: 'all' })}
      />

      <div className="row g-4 mb-2">
        <div className="col-12">
          <ExpiryBucketChart
            expiryKPIs={expiryKPIs}
            loading={loading}
            onBucketClick={handleExpiryBucketClick}
          />
        </div>
      </div>

      {/* ── Section F: Supplier Procurement Analytics ──────────────────────── */}
      <SectionHeader
        title="Supplier &amp; Procurement Analytics"
        subtitle="Vendor relationship volume, invoice values, and supplier replenishment"
        badgeText="Supply Chain"
        badgeColor="primary"
        actionLabel="Supplier Purchase Invoices"
        onAction={handleViewSupplierOrders}
      />

      <div className="row g-4 mb-2">
        <div className="col-12">
          <SupplierAnalyticsChart
            supplierStats={supplierStats}
            loading={loading}
            selectedSupplier={crossFilters.selectedSupplier}
            onSelectSupplier={handleSupplierClick}
            onClearSupplier={() => clearCrossFilter('selectedSupplier')}
            onViewSupplierOrders={handleViewSupplierOrders}
          />
        </div>
      </div>

      {/* ── Section G: Profit & Margin Analytics ───────────────────────────── */}
      <SectionHeader
        title="Profit &amp; Gross Margin Analytics"
        subtitle="Profit contribution by category and highest-margin pharmacy items"
        badgeText="Financial Margin"
        badgeColor="success"
        actionLabel="Margin Details"
        onAction={handleOpenProfitDrawer}
      />

      <div className="row g-4 mb-4">
        <div className="col-12">
          <ProfitAnalyticsSection
            profitSummary={profitSummary}
            loading={loading}
            onOpenProfitDrawer={handleOpenProfitDrawer}
          />
        </div>
      </div>

      {/* ── Drill-Through Offcanvas Side Drawer ────────────────────────────── */}
      <ReportDetailDrawer
        drawer={drawer}
        closeDrawer={closeDrawer}
        sales={filteredSales}
        medicines={allMedicines}
        purchases={allPurchases}
        topMedicines={topMedicines}
        profitSummary={profitSummary}
        expiryDetail={expiryDetail}
      />
    </div>
  );
}

export default Reports;
