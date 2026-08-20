/**
 * @file        Reports.jsx
 * @module      Reports
 * @purpose     Main Reports & Analytics page.
 *              Manages date filter state, wires useReports, assembles all
 *              report components, and handles global error state.
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

import '../reports.css';
import useReports from '../hooks/useReports';
import { buildInitialRange } from '../utils/dateRangeHelper';

import DateFilter        from '../components/DateFilter';
import KpiCards          from '../components/KpiCards';
import SalesTrendChart   from '../components/SalesTrendChart';
import TopMedicinesTable from '../components/TopMedicinesTable';
import PaymentMethodChart from '../components/PaymentMethodChart';
import CategoryAnalysis  from '../components/CategoryAnalysis';
import ExpiryReport      from '../components/ExpiryReport';

import {
  exportTopMedicines,
  exportPaymentReport,
} from '../utils/csvExport';

const fmtNum = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

function Reports() {
  const [dateRange, setDateRange] = useState(buildInitialRange());

  const {
    salesKPIs,
    inventoryKPIs,
    expiryKPIs,
    topMedicines,
    paymentMethods,
    salesTrend,
    categoryData,
    loading,
    error,
    refresh,
  } = useReports(dateRange);

  // ── Date filter change ────────────────────────────────────────────────────
  const handleFilterChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  // ── Export handlers ────────────────────────────────────────────────────────
  const handleExport = (type) => {
    try {
      switch (type) {
        case 'topMedicines':
          if (!topMedicines.length) return toast.info('No top medicines data to export.');
          exportTopMedicines(topMedicines);
          toast.success('Top medicines exported.');
          break;
        case 'payment':
          if (!paymentMethods) return toast.info('No payment data to export.');
          exportPaymentReport(paymentMethods);
          toast.success('Payment methods report exported.');
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Please try again.');
    }
  };

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center justify-content-between rounded-3">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={refresh}>
            <FiRefreshCw className="me-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-4 reports-page">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 gap-3">
        <div>
          <h1 className="reports-page-title">Reports &amp; Analytics</h1>
          <p className="reports-page-sub">Pharmacy performance overview · Data ready for CSV export</p>
        </div>

        {/* Export Dropdown */}
        <div className="dropdown">
          <button
            className="rp-export-btn dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            disabled={loading}
          >
            <FiDownload size={14} /> Export CSV
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.07)', fontSize: '0.82rem' }}>
            <li>
              <button className="dropdown-item" onClick={() => handleExport('topMedicines')}>
                Top Medicines
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => handleExport('payment')}>
                Payment Methods
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Date Filter ───────────────────────────────────────────────────── */}
      <DateFilter onFilterChange={handleFilterChange} />

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <KpiCards
        salesKPIs={salesKPIs}
        inventoryKPIs={inventoryKPIs}
        expiryKPIs={expiryKPIs}
        loading={loading}
      />

      {/* ── Sales Section ─────────────────────────────────────────────────── */}
      <p className="reports-section-label">Sales Overview</p>

      {/* Sales KPI detail row */}
      {!loading && salesKPIs && (
        <div className="row g-3 mb-4">
          {[
            { label: "Today's Sales",   value: salesKPIs.todaySalesCount, prefix: '' },
            { label: "Today's Revenue", value: salesKPIs.todayRevenue,    prefix: '₹' },
            { label: 'Monthly Revenue', value: salesKPIs.monthRevenue,    prefix: '₹' },
            { label: 'Avg Sale Value',  value: salesKPIs.avgSaleValue,    prefix: '₹' },
          ].map((item) => (
            <div key={item.label} className="col-6 col-md-3">
              <div className="rp-detail-card">
                <p className="rp-detail-label">{item.label}</p>
                <p className="rp-detail-value">{item.prefix}{fmtNum(item.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <SalesTrendChart salesTrend={salesTrend} loading={loading} />

      {/* ── Top Medicines + Payment Method ────────────────────────────────── */}
      <p className="reports-section-label">Product &amp; Payment Analysis</p>
      <div className="row g-4 mb-2">
        <div className="col-12 col-lg-7">
          <TopMedicinesTable topMedicines={topMedicines} loading={loading} />
        </div>
        <div className="col-12 col-lg-5">
          <PaymentMethodChart paymentMethods={paymentMethods} loading={loading} />
        </div>
      </div>

      {/* ── Inventory + Category ──────────────────────────────────────────── */}
      <p className="reports-section-label">Inventory Analysis</p>

      {/* Inventory KPI detail row */}
      {!loading && inventoryKPIs && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Stock Units', value: inventoryKPIs.totalStock,     prefix: '' },
            { label: 'Out of Stock',      value: inventoryKPIs.outOfStock,     prefix: '' },
            { label: 'Inventory Value',   value: inventoryKPIs.inventoryValue, prefix: '₹' },
          ].map((item) => (
            <div key={item.label} className="col-6 col-md-4">
              <div className="rp-detail-card">
                <p className="rp-detail-label">{item.label}</p>
                <p className="rp-detail-value">{item.prefix}{fmtNum(item.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryAnalysis categoryData={categoryData} loading={loading} />

      {/* ── Expiry ────────────────────────────────────────────────────────── */}
      <p className="reports-section-label">Expiry Risk</p>
      <ExpiryReport expiryKPIs={expiryKPIs} loading={loading} />

    </div>
  );
}

export default Reports;
