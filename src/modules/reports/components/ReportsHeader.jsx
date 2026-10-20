/**
 * @file        ReportsHeader.jsx
 * @module      Reports
 * @purpose     Header for the Reports & Analytics dashboard with title, description,
 *              last refreshed timestamp, data refresh trigger, and export options.
 */

import { FiDownload, FiRefreshCw, FiClock, FiPrinter } from 'react-icons/fi';

const ReportsHeader = ({
  lastRefreshed,
  loading,
  onRefresh,
  onExport,
  onPrint,
}) => {
  const formattedTime = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-3">
      <div>
        <h1 className="reports-page-title">Reports &amp; Analytics</h1>
        <p className="reports-page-sub">
          Interactive Business Intelligence Dashboard · Cross-filtering, drill-through insights &amp; data export
        </p>
        <div className="reports-last-refresh d-flex align-items-center gap-1">
          <FiClock size={12} />
          <span>Last updated: {formattedTime}</span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Refresh Button */}
        <button
          type="button"
          className="rp-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Reload latest data from Firestore"
        >
          <FiRefreshCw size={14} className={loading ? 'spin' : ''} />
          <span className="d-none d-sm-inline">Refresh</span>
        </button>

        {/* Print / Save View */}
        <button
          type="button"
          className="rp-export-btn"
          onClick={onPrint}
          disabled={loading}
          title="Print or save as PDF"
        >
          <FiPrinter size={14} />
          <span className="d-none d-sm-inline">Print</span>
        </button>

        {/* Export Dropdown */}
        <div className="dropdown">
          <button
            className="rp-export-btn dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            disabled={loading}
            aria-expanded="false"
          >
            <FiDownload size={14} /> Export CSV
          </button>
          <ul
            className="dropdown-menu dropdown-menu-end shadow-sm"
            style={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '0.82rem', minWidth: '200px' }}
          >
            <li>
              <h6 className="dropdown-header text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                Transaction Reports
              </h6>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('sales')}>
                📊 Sales Transactions
              </button>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('topMedicines')}>
                💊 Top Selling Medicines
              </button>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('payment')}>
                💳 Payment Methods
              </button>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('purchases')}>
                📦 Purchases &amp; Orders
              </button>
            </li>
            <li><hr className="dropdown-divider my-1" /></li>
            <li>
              <h6 className="dropdown-header text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                Inventory &amp; Stock
              </h6>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('inventory')}>
                📋 Current Inventory
              </button>
            </li>
            <li>
              <button className="dropdown-item py-2" onClick={() => onExport('expiry')}>
                ⚠️ Expiry Risk Report
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsHeader;
