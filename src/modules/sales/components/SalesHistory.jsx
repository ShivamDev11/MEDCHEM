import React, { useState, useEffect } from 'react';
import { getSaleItems } from '../services/salesService';
import { formatInvoiceDate } from '../utils/invoiceGenerator';
import { FaEye, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import Invoice from './Invoice';

// ---------------------------------------------------------------------------
// Helper: apply date filter client-side (mirrors Sales.jsx applyDateFilter)
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
// SalesHistory — controlled component; filter state lives in parent Sales.jsx
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

  // ── Derived: filter then search ──────────────────────────────────────────
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

  // ── Invoice view ─────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">

        {/* Filter bar */}
        <div className="row mb-4 align-items-end g-2">

          {/* Search */}
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white"><FaSearch className="text-muted" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search Invoice No, Customer, Payment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white"><FaFilter className="text-muted" /></span>
              <select
                className="form-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
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

          {/* Custom date range (only when CUSTOM is selected) */}
          {dateFilter === 'CUSTOM' && (
            <>
              <div className="col-md-2">
                <input
                  type="date"
                  className="form-control"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  placeholder="From"
                />
              </div>
              <div className="col-md-2">
                <input
                  type="date"
                  className="form-control"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  placeholder="To"
                />
              </div>
            </>
          )}

          {/* Refresh */}
          <div className="col-md-2 ms-auto">
            <button
              className="btn btn-outline-primary w-100"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading
                ? <><span className="spinner-border spinner-border-sm me-1" role="status" /> Loading...</>
                : <><FaSync className="me-1" /> Refresh</>
              }
            </button>
          </div>
        </div>

        {/* Results summary */}
        {!isLoading && (
          <p className="text-muted small mb-3">
            Showing <strong>{filteredSales.length}</strong> sale{filteredSales.length !== 1 ? 's' : ''}
            {searchTerm ? ` matching "${searchTerm}"` : ''}
          </p>
        )}

        {/* Empty state */}
        {!isLoading && filteredSales.length === 0 && (
          <div className="text-center py-5 text-muted">
            <h5 className="mb-1">No sales history found.</h5>
            <p className="small">Try adjusting your filters or date range.</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredSales.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th className="text-end">Total Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="fw-bold text-primary">{sale.invoiceNumber}</td>
                    <td>{formatInvoiceDate(sale.date)}</td>
                    <td>{sale.customerName || 'Walk-in'}</td>
                    <td><span className="badge bg-light text-dark border">{sale.paymentMethod}</span></td>
                    <td className="text-end fw-bold">₹{Number(sale.netAmount).toFixed(2)}</td>
                    <td className="text-center">
                      <span className={`badge ${sale.status === 'Completed' ? 'bg-success' : 'bg-warning'}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewInvoice(sale)}
                        disabled={isLoadingInvoice && selectedSale?.id === sale.id}
                      >
                        {isLoadingInvoice && selectedSale?.id === sale.id
                          ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          : <><FaEye className="me-1" /> View</>
                        }
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
