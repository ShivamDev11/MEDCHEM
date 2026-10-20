/**
 * @file        FilterChips.jsx
 * @module      Reports
 * @purpose     Displays active filters and cross-filters as interactive chips/pills
 *              with remove buttons and a "Reset All" action.
 */

import { FiX, FiFilter } from 'react-icons/fi';

const FilterChips = ({
  globalFilters,
  crossFilters,
  clearGlobalFilter,
  clearCrossFilter,
  resetFilters,
  hasActiveFilters,
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="rp-filter-chips align-items-center">
      <span className="d-inline-flex align-items-center text-muted me-1" style={{ fontSize: '0.74rem' }}>
        <FiFilter className="me-1" /> Active Filters:
      </span>

      {/* Global Filter Chips */}
      {globalFilters.category && (
        <span className="rp-filter-chip">
          Category: <strong>{globalFilters.category}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearGlobalFilter('category')}
            title="Remove category filter"
          >
            <FiX />
          </button>
        </span>
      )}

      {globalFilters.supplier && (
        <span className="rp-filter-chip">
          Supplier: <strong>{globalFilters.supplier}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearGlobalFilter('supplier')}
            title="Remove supplier filter"
          >
            <FiX />
          </button>
        </span>
      )}

      {globalFilters.paymentMethod && (
        <span className="rp-filter-chip">
          Payment: <strong>{globalFilters.paymentMethod}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearGlobalFilter('paymentMethod')}
            title="Remove payment filter"
          >
            <FiX />
          </button>
        </span>
      )}

      {globalFilters.medicineSearch && (
        <span className="rp-filter-chip">
          Search: <strong>"{globalFilters.medicineSearch}"</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearGlobalFilter('medicineSearch')}
            title="Clear search"
          >
            <FiX />
          </button>
        </span>
      )}

      {/* Cross-Filter Chips from Chart Click Interactions */}
      {crossFilters.selectedPaymentMethod && (
        <span className="rp-filter-chip" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#059669' }}>
          Payment (Chart): <strong>{crossFilters.selectedPaymentMethod}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedPaymentMethod')}
            title="Clear payment selection"
          >
            <FiX />
          </button>
        </span>
      )}

      {crossFilters.selectedCategory && (
        <span className="rp-filter-chip" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#2563eb' }}>
          Category (Chart): <strong>{crossFilters.selectedCategory}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedCategory')}
            title="Clear category selection"
          >
            <FiX />
          </button>
        </span>
      )}

      {crossFilters.selectedDatePoint && (
        <span className="rp-filter-chip" style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#7c3aed' }}>
          Date: <strong>{crossFilters.selectedDatePoint}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedDatePoint')}
            title="Clear date selection"
          >
            <FiX />
          </button>
        </span>
      )}

      {crossFilters.selectedStockStatus && (
        <span className="rp-filter-chip" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#d97706' }}>
          Stock Status: <strong>{crossFilters.selectedStockStatus}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedStockStatus')}
            title="Clear stock status selection"
          >
            <FiX />
          </button>
        </span>
      )}

      {crossFilters.selectedExpiryBucket && (
        <span className="rp-filter-chip" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#dc2626' }}>
          Expiry Bucket: <strong>{crossFilters.selectedExpiryBucket}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedExpiryBucket')}
            title="Clear expiry selection"
          >
            <FiX />
          </button>
        </span>
      )}

      {crossFilters.selectedSupplier && (
        <span className="rp-filter-chip" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#0891b2' }}>
          Supplier (Chart): <strong>{crossFilters.selectedSupplier}</strong>
          <button
            type="button"
            className="chip-close"
            onClick={() => clearCrossFilter('selectedSupplier')}
            title="Clear supplier selection"
          >
            <FiX />
          </button>
        </span>
      )}

      <button
        type="button"
        className="rp-reset-all-btn ms-auto"
        onClick={resetFilters}
      >
        Reset All Filters
      </button>
    </div>
  );
};

export default FilterChips;
