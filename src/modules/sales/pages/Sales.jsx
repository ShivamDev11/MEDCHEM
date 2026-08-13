import React, { useState, useEffect, useCallback } from 'react';
import useSales from '../hooks/useSales';
import SalesDashboardCards from '../components/SalesDashboardCards';
import SearchMedicine from '../components/SearchMedicine';
import SalesCart from '../components/SalesCart';
import SaleForm from '../components/SaleForm';
import Invoice from '../components/Invoice';
import SalesHistory from '../components/SalesHistory';
import { getSalesHistory, getInventoryMetrics } from '../services/salesService';
import { playSale, playError } from '../../../shared/services/audioService';

// ---------------------------------------------------------------------------
// Helper: apply date filter to a list of sales documents
// ---------------------------------------------------------------------------
const applyDateFilter = (sales, dateFilter, customStart, customEnd) => {
  if (!sales || sales.length === 0) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (dateFilter) {
    case 'TODAY': {
      return sales.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === now.getTime();
      });
    }
    case 'YESTERDAY': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return sales.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === yesterday.getTime();
      });
    }
    case '7DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      return sales.filter(s => new Date(s.date) >= cutoff);
    }
    case '30DAYS': {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return sales.filter(s => new Date(s.date) >= cutoff);
    }
    case 'CUSTOM': {
      if (!customStart && !customEnd) return sales;
      return sales.filter(s => {
        const d = new Date(s.date);
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
      return sales; // ALL
  }
};

// ---------------------------------------------------------------------------
// Helper: compute dashboard stats from a filtered list of sales
// ---------------------------------------------------------------------------
const computeStats = (filteredSales, inventoryMetrics) => {
  const completed = filteredSales.filter(s => s.status === 'Completed');
  const totalRevenue = completed.reduce((acc, s) => acc + Number(s.netAmount || 0), 0);
  const totalItems   = completed.reduce((acc, s) => acc + Number(s.totalItems || 0), 0);

  return {
    todaySales:     completed.length,
    todayRevenue:   totalRevenue,
    totalItemsSold: totalItems,
    lowStockCount:  inventoryMetrics?.lowStockCount  ?? 0,
    expiredCount:   inventoryMetrics?.expiredCount   ?? 0,
  };
};

// ---------------------------------------------------------------------------
// Label helper for dashboard card titles
// ---------------------------------------------------------------------------
const filterLabel = (dateFilter) => {
  switch (dateFilter) {
    case 'TODAY':     return "Today's";
    case 'YESTERDAY': return "Yesterday's";
    case '7DAYS':     return '7-Day';
    case '30DAYS':    return '30-Day';
    case 'CUSTOM':    return 'Custom';
    default:          return 'All Time';
  }
};

// ---------------------------------------------------------------------------
// Sales page
// ---------------------------------------------------------------------------
const Sales = () => {
  const {
    cart,
    totals,
    isProcessing,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleCompleteSale,
    handleSearch
  } = useSales();

  const [activeTab, setActiveTab] = useState('pos');
  const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });

  // ── Shared filter state (lifted from SalesHistory) ───────────────────────
  const [dateFilter,   setDateFilter]   = useState('TODAY');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');

  // ── Raw data (single source of truth) ────────────────────────────────────
  const [allSales,          setAllSales]          = useState([]);
  const [inventoryMetrics,  setInventoryMetrics]  = useState({ lowStockCount: 0, expiredCount: 0 });
  const [isDataLoading,     setIsDataLoading]     = useState(false);

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredSales = applyDateFilter(allSales, dateFilter, customStart, customEnd);
  const stats         = computeStats(filteredSales, inventoryMetrics);
  const label         = filterLabel(dateFilter);

  // Invoice state
  const [showInvoice,     setShowInvoice]     = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState(null);
  const [lastSaleItems,   setLastSaleItems]   = useState([]);

  // ── Data fetch (runs once on mount and whenever activeTab switches to history) ──
  const fetchAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [history, metrics] = await Promise.all([
        getSalesHistory(500),   // generous limit; all filtering is client-side
        getInventoryMetrics()
      ]);
      setAllSales(history);
      setInventoryMetrics(metrics);
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (error) showToast(error, 'danger');
  }, [error]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    if (type === 'danger' || type === 'error') {
      playError();
    }
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const onSelectMedicine = (medicine) => {
    const success = addToCart(medicine, 1);
    if (success) {
      const medName = medicine.medicineName || medicine.name;
      showToast(`${medName} added to cart`, 'success');
    }
  };

  const onCompleteSale = async (paymentMethod, customerName) => {
    const currentCart = [...cart];
    const result = await handleCompleteSale(paymentMethod, customerName);

    if (result.success) {
      playSale();
      showToast('Sale completed successfully!', 'success');
      setLastSaleDetails({
        invoiceNumber: result.invoiceNumber,
        customerName:  customerName || 'Walk-in Customer',
        paymentMethod,
        date:          new Date(),
        status:        'Completed',
        subtotal:      totals.subtotal,
        discount:      totals.discountAmount,
        tax:           totals.taxAmount,
        netAmount:     totals.grandTotal
      });
      setLastSaleItems(currentCart);
      setShowInvoice(true);
      // Refresh raw data so the new sale appears in both cards and history
      fetchAllData();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4">
      {/* Toast */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <div
          className={`toast align-items-center text-white bg-${toast.type} border-0 ${toast.show ? 'show' : 'hide'}`}
          role="alert" aria-live="assertive" aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body fw-bold">{toast.message}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => setToast({ ...toast, show: false })}
              aria-label="Close"
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">Sales Management</h2>
        <div className="btn-group shadow-sm">
          <button
            className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('pos')}
          >
            Point of Sale
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('history')}
          >
            Sales History
          </button>
        </div>
      </div>

      {/* Dashboard cards — always reflect the active filter */}
      <SalesDashboardCards
        stats={stats}
        isLoading={isDataLoading}
        filterLabel={label}
      />

      {/* Main content */}
      {activeTab === 'pos' ? (
        <div className="row">
          <div className="col-lg-8">
            <SearchMedicine onSearch={handleSearch} onSelect={onSelectMedicine} />
            <SalesCart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
          </div>
          <div className="col-lg-4">
            <SaleForm
              totals={totals}
              onCompleteSale={onCompleteSale}
              isProcessing={isProcessing}
              cartLength={cart.length}
            />
          </div>
        </div>
      ) : (
        /* Pass shared state DOWN so SalesHistory never fetches independently */
        <SalesHistory
          allSales={allSales}
          isLoading={isDataLoading}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          onRefresh={fetchAllData}
        />
      )}

      {/* Invoice modal */}
      <Invoice
        show={showInvoice}
        onClose={() => setShowInvoice(false)}
        saleDetails={lastSaleDetails}
        cartItems={lastSaleItems}
      />
    </div>
  );
};

export default Sales;
