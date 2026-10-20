/**
 * @file        ReportsFilters.jsx
 * @module      Reports
 * @purpose     Controls section with date presets, custom date picker,
 *              category filter, supplier filter, payment method filter, and medicine search.
 */

import React, { useState } from 'react';
import { FiCalendar, FiSearch, FiRotateCcw } from 'react-icons/fi';
import { DATE_FILTERS, PAYMENT_METHODS } from '../constants/reportsConstants';
import { MEDICINE_CATEGORIES } from '../../inventory/constants/inventoryConstants';

const ReportsFilters = ({
  globalFilters,
  setPreset,
  setCustomDateRange,
  setCategory,
  setSupplier,
  setPaymentMethod,
  setMedicineSearch,
  resetFilters,
  suppliers = [],
  categories = [],
}) => {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd]     = useState('');
  const [customError, setCustomError] = useState('');

  // Combine static and dynamically detected categories
  const allCategories = Array.from(
    new Set([...MEDICINE_CATEGORIES, ...categories.map((c) => c.category || c)])
  ).filter(Boolean);

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      setCustomError('Please choose both start and end dates.');
      return;
    }
    const start = new Date(customStart);
    const end   = new Date(customEnd + 'T23:59:59.999');
    if (start > end) {
      setCustomError('Start date cannot be after end date.');
      return;
    }
    setCustomError('');
    setCustomDateRange(start, end);
  };

  return (
    <div className="rp-filter-card mb-3">
      {/* ── 1. Date Range Preset Buttons ─────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="d-flex flex-wrap align-items-center gap-1">
          <span className="me-2 text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <FiCalendar size={13} /> Period:
          </span>
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`rp-filter-btn ${globalFilters.preset === f.value ? 'active' : ''}`}
              onClick={() => setPreset(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          style={{ fontSize: '0.75rem', borderRadius: '8px' }}
          onClick={resetFilters}
          title="Reset all filters and selections"
        >
          <FiRotateCcw size={12} /> Reset
        </button>
      </div>

      {/* ── 2. Custom Date Range Pickers (conditional) ───────────────────── */}
      {globalFilters.preset === 'custom' && (
        <div className="d-flex flex-wrap align-items-end gap-2 py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div>
            <label className="form-label mb-1" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280' }}>
              FROM
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ borderRadius: '8px', fontSize: '0.8rem' }}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label mb-1" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280' }}>
              TO
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ borderRadius: '8px', fontSize: '0.8rem' }}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ borderRadius: '8px', fontSize: '0.8rem', padding: '6px 16px', fontWeight: 600 }}
            onClick={handleCustomApply}
          >
            Apply Range
          </button>
          {customError && (
            <span className="text-danger align-self-center ms-2" style={{ fontSize: '0.76rem' }}>
              {customError}
            </span>
          )}
        </div>
      )}

      {/* ── 3. Global Filters Dropdowns & Product Search ─────────────────── */}
      <div className="d-flex flex-wrap align-items-center gap-2 pt-2">
        {/* Category Filter */}
        <div>
          <select
            className="rp-filter-select"
            value={globalFilters.category || ''}
            onChange={(e) => setCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <select
            className="rp-filter-select"
            value={globalFilters.supplier || ''}
            onChange={(e) => setSupplier(e.target.value || null)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id || s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <select
            className="rp-filter-select"
            value={globalFilters.paymentMethod || ''}
            onChange={(e) => setPaymentMethod(e.target.value || null)}
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Medicine / Product Search */}
        <div className="ms-auto flex-grow-1" style={{ maxWidth: '280px', minWidth: '180px' }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-transparent border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
              <FiSearch size={13} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              style={{ borderRadius: '0 8px 8px 0', fontSize: '0.8rem' }}
              placeholder="Search medicine or generic..."
              value={globalFilters.medicineSearch}
              onChange={(e) => setMedicineSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsFilters;
