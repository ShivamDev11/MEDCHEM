import React, { useState } from 'react';
import { getSaleItems } from '../services/salesService';
import { formatInvoiceDate } from '../utils/invoiceGenerator';
import { FiEye, FiSearch, FiFilter, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import Invoice from './Invoice';

// ---------------------------------------------------------------------------
// Helper: apply date filter client-side (mirrors Sales.jsx applyDateFilter)
// ---------------------------------------------------------------------------
const applyDateFilter = (sales, dateFilter, customStart, customEnd) => {
  if (!sales || sales.length === 0) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (dateFilter) {
    case 'ALL':
      return sales;
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
      return sales;
  }
};

// ---------------------------------------------------------------------------
// SalesHistory
// ---------------------------------------------------------------------------
const SalesHistory = ({
  allSales = [],
  isLoading = false,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice view state
  const [selectedSale,      setSelectedSale]      = useState(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState([]);
  const [isViewingInvoice,  setIsViewingInvoice]  = useState(false);
  const [isLoadingInvoice,  setIsLoadingInvoice]  = useState(false);

  const dateFiltered = applyDateFilter(allSales, dateFilter, customStart, customEnd);

  const filteredSales = searchTerm.trim()
    ? dateFiltered.filter(sale => {
        const term = searchTerm.toLowerCase();
        return (
          (sale.invoiceNumber  && sale.invoiceNumber.toLowerCase().includes(term))  ||
          (sale.customerName   && sale.customerName.toLowerCase().includes(term))   ||
          (sale.paymentMethod  && sale.paymentMethod.toLowerCase().includes(term))
        );
      })
    : dateFiltered;

  const handleViewInvoice = async (sale) => {
    setIsLoadingInvoice(true);
    setSelectedSale(sale);
    try {
      const items = await getSaleItems(sale.id);
      setSelectedSaleItems(items);
      setIsViewingInvoice(true);
    } catch (err) {
      alert('Failed to load invoice items.');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  return (
    <div className="card sales-history-card border-0 shadow-sm">
      <div className="card-body p-4">

        {/* Unified Search / Filter Toolbar */}
        <div className="d-flex align-items-center gap-3 flex-wrap mb-4">

          {/* Search */}
          <div style={{ flex: "1 1 280px" }}>
            <div className="input-group sales-search-input-group" style={{ background: "#f8fafc" }}>
              <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                <FiSearch size={14} />
              </span>
              <input
                type="text"
                className="form-control sales-search-input"
                placeholder="Search Invoice No, Customer, Payment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date range filter selector */}
          <div style={{ minWidth: "160px" }}>
            <div className="input-group sales-search-input-group" style={{ background: "#f8fafc" }}>
              <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                <FiFilter size={14} />
              </span>
              <select
                className="form-select sales-search-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Ranges */}
          {dateFilter === 'CUSTOM' && (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="input-group sales-search-input-group" style={{ width: "160px", background: "#f8fafc" }}>
                <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                  <FiCalendar size={13} />
                </span>
                <input
                  type="date"
                  className="form-control sales-search-input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  title="Start Date"
                />
              </div>
              <span className="text-muted small">to</span>
              <div className="input-group sales-search-input-group" style={{ width: "160px", background: "#f8fafc" }}>
                <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                  <FiCalendar size={13} />
                </span>
                <input
                  type="date"
                  className="form-control sales-search-input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  title="End Date"
                />
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="ms-auto" style={{ minWidth: "120px" }}>
            <button
              className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 fw-bold w-100 py-2"
              onClick={onRefresh}
              disabled={isLoading}
              style={{ fontSize: "0.85rem", borderRadius: "8px" }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <FiRefreshCw size={13} />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results summary */}
        {!isLoading && (
          <p className="text-muted small mb-3" style={{ fontSize: "0.8rem" }}>
            Showing <strong>{filteredSales.length}</strong> sale invoice{filteredSales.length !== 1 ? 's' : ''}
            {searchTerm ? ` matching "${searchTerm}"` : ''}
          </p>
        )}

        {/* Empty state */}
        {!isLoading && filteredSales.length === 0 && (
          <div className="text-center py-5 text-muted">
            <h5 className="fw-bold text-dark mb-1">No sales transaction history found</h5>
            <p className="small text-secondary">Adjust your custom search inputs or selected date range.</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredSales.length > 0 && (
          <div className="table-responsive border rounded overflow-hidden">
            <table className="table sales-history-table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead>
                <tr>
                  <th className="ps-4">Invoice No</th>
                  <th>Date Created</th>
                  <th>Customer Info</th>
                  <th>Payment Type</th>
                  <th className="text-end">Total Paid</th>
                  <th className="text-center">Status</th>
                  <th className="text-center pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="ps-4 fw-bold text-dark">{sale.invoiceNumber}</td>
                    <td>{formatInvoiceDate(sale.date)}</td>
                    <td className="fw-semibold text-secondary">{sale.customerName || 'Walk-in Customer'}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2.5 py-1 fw-bold" style={{ fontSize: "0.72rem" }}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-dark">₹{Number(sale.netAmount).toFixed(2)}</td>
                    <td className="text-center">
                      <span className={`badge ${sale.status === 'Completed' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-3 py-1 fw-bold`} style={{ fontSize: "0.72rem" }}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-center pe-4">
                      <button
                        className="btn btn-sm inv-btn-icon inv-btn-view"
                        onClick={() => handleViewInvoice(sale)}
                        disabled={isLoadingInvoice && selectedSale?.id === sale.id}
                        title="View Details"
                        style={{ width: "auto", height: "auto", padding: "0.35rem 0.75rem", display: "inline-flex", gap: "6px" }}
                      >
                        {isLoadingInvoice && selectedSale?.id === sale.id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <FiEye size={13} />
                            <span className="fw-bold" style={{ fontSize: "0.75rem" }}>View Invoice</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Invoice modal */}
      {isViewingInvoice && selectedSale && (
        <Invoice
          show={isViewingInvoice}
          onClose={() => setIsViewingInvoice(false)}
          saleDetails={selectedSale}
          cartItems={selectedSaleItems}
        />
      )}
    </div>
  );
};

export default SalesHistory;
