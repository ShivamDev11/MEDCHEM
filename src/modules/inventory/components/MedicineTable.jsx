/**
 * @file        MedicineTable.jsx
 * @module      Inventory
 * @purpose     Displays the list of medicines in a responsive Bootstrap 5 table.
 *              Supports sorting by clicking sortable column headers, pagination controls,
 *              dynamic stock status badges, expiry warnings, and row actions (View, Edit, Delete).
 *              Uses memoization to optimize row rendering and callback execution.
 * @dependencies react, react-icons, inventoryConstants, inventory.css
 * @exports     MedicineTable (default)
 */

import { useMemo, useCallback } from "react";
import { 
  FiEye, 
  FiEdit, 
  FiTrash2, 
  FiChevronUp, 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight,
  FiAlertTriangle
} from "react-icons/fi";
import { 
  TABLE_COLUMNS, 
  STOCK_STATUS, 
  STOCK_STATUS_COLORS, 
  EXPIRY_WARNING_DAYS 
} from "../constants/inventoryConstants";

/**
 * MedicineTable Component
 * 
 * @param {object}   props
 * @param {object[]} props.medicines        - Array of medicine objects to display on the current page
 * @param {string}   props.sortField        - Currently active sort field (from Firestore)
 * @param {string}   props.sortDir          - Sort direction: 'asc' | 'desc'
 * @param {Function} props.onSortChange     - Callback when a sortable column header is clicked
 * @param {number}   props.currentPage      - Current page number (1-indexed)
 * @param {boolean}  props.hasMore          - Whether there are more pages available
 * @param {Function} props.onPrevPage       - Callback to navigate to the previous page
 * @param {Function} props.onNextPage       - Callback to navigate to the next page
 * @param {Function} props.onViewDetails    - Callback when the View button is clicked (receives medicine ID)
 * @param {Function} props.onEdit           - Callback when the Edit button is clicked (receives medicine ID)
 * @param {Function} props.onDelete         - Callback when the Delete button is clicked (receives medicine ID)
 * @param {boolean}  [props.isLoading]      - Disables pagination and actions during asynchronous operations
 */
function MedicineTable({
  medicines,
  sortField,
  sortDir,
  onSortChange,
  currentPage,
  hasMore,
  onPrevPage,
  onNextPage,
  onViewDetails,
  onEdit,
  onDelete,
  isLoading = false
}) {
  
  // ── Helper: Determine stock status based on quantities ─────────────────────
  const getStockStatus = useCallback((quantity, minimumStock) => {
    const qty = Number(quantity) || 0;
    const min = Number(minimumStock) || 0;
    
    if (qty === 0) return STOCK_STATUS.OUT_OF_STOCK;
    if (qty <= min) return STOCK_STATUS.LOW;
    return STOCK_STATUS.NORMAL;
  }, []);

  // ── Helper: Check if medicine is expiring soon (within 30 days) ───────────
  const isExpiringSoon = useCallback((expiryDateStr) => {
    if (!expiryDateStr) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= EXPIRY_WARNING_DAYS;
  }, []);

  // ── Helper: Check if medicine is already expired ───────────────────────────
  const isExpired = useCallback((expiryDateStr) => {
    if (!expiryDateStr) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    return expiry < today;
  }, []);

  // ── Column Header Click Handler ────────────────────────────────────────────
  const handleHeaderClick = useCallback((columnKey, sortable) => {
    if (!sortable || isLoading) return;
    
    let newDir = "asc";
    if (sortField === columnKey) {
      newDir = sortDir === "asc" ? "desc" : "asc";
    }
    
    onSortChange(columnKey, newDir);
  }, [sortField, sortDir, onSortChange, isLoading]);

  // ── Render header columns ──────────────────────────────────────────────────
  const headers = useMemo(() => {
    return TABLE_COLUMNS.map((col) => {
      const isSorted = sortField === col.key;
      return (
        <th
          key={col.key}
          className={`${col.sortable ? "inv-sortable-header" : ""} text-nowrap`}
          onClick={() => handleHeaderClick(col.key, col.sortable)}
          style={{ cursor: col.sortable ? "pointer" : "default" }}
          role={col.sortable ? "columnheader" : undefined}
          aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
        >
          <div className="d-flex align-items-center gap-1">
            <span>{col.label}</span>
            {col.sortable && (
              <span className="inv-sort-icon-wrap">
                {isSorted ? (
                  sortDir === "asc" ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                ) : (
                  <FiChevronDown size={14} className="opacity-25" />
                )}
              </span>
            )}
          </div>
        </th>
      );
    });
  }, [sortField, sortDir, handleHeaderClick]);

  // ── Render table rows ──────────────────────────────────────────────────────
  const rows = useMemo(() => {
    if (!medicines || medicines.length === 0) {
      return (
        <tr>
          <td colSpan={TABLE_COLUMNS.length} className="text-center py-5">
            <div className="inv-empty-table-state">
              <p className="text-muted mb-0">No medicines available in this view.</p>
            </div>
          </td>
        </tr>
      );
    }

    return medicines.map((med) => {
      const status = getStockStatus(med.quantity, med.minimumStock);
      const badgeClass = STOCK_STATUS_COLORS[status] || "bg-secondary";
      
      const expired = isExpired(med.expiryDate);
      const expiringSoon = isExpiringSoon(med.expiryDate);
      
      // Determine expiry styling helper
      let expiryLabelClass = "";
      let expiryWarningIcon = null;
      if (expired) {
        expiryLabelClass = "text-danger fw-bold";
        expiryWarningIcon = (
          <span className="badge bg-danger text-white me-1 inv-alert-badge" title="Expired!">
            Expired
          </span>
        );
      } else if (expiringSoon) {
        expiryLabelClass = "text-warning fw-bold";
        expiryWarningIcon = (
          <FiAlertTriangle 
            className="text-warning me-1 inv-warning-icon" 
            title="Expiring soon!" 
            size={14} 
          />
        );
      }

      return (
        <tr key={med.id} className="inv-table-row align-middle">
          {/* Medicine Name */}
          <td className="fw-semibold text-dark inv-cell-name">
            {med.medicineName}
          </td>
          
          {/* Generic Name */}
          <td className="text-muted inv-cell-generic">
            {med.genericName || "—"}
          </td>
          
          {/* Category */}
          <td className="inv-cell-category">
            <span className="badge bg-light text-dark border">{med.category}</span>
          </td>
          
          {/* Manufacturer */}
          <td className="text-secondary inv-cell-manufacturer">
            {med.manufacturer}
          </td>
          
          {/* Supplier */}
          <td className="text-secondary inv-cell-supplier">
            {med.supplier}
          </td>
          
          {/* Batch Number */}
          <td className="font-monospace inv-cell-batch">
            {med.batchNumber}
          </td>
          
          {/* Expiry Date */}
          <td className={`inv-cell-expiry text-nowrap ${expiryLabelClass}`}>
            <div className="d-flex align-items-center">
              {expiryWarningIcon}
              <span>{med.expiryDate}</span>
            </div>
          </td>
          
          {/* Quantity */}
          <td className="text-end fw-medium inv-cell-qty">
            {Number(med.quantity).toLocaleString()}
          </td>
          
          {/* Price */}
          <td className="text-end fw-semibold text-dark inv-cell-price">
            {Number(med.sellingPrice).toFixed(2)}
          </td>
          
          {/* Stock Status Badge */}
          <td className="inv-cell-status">
            <span className={`badge ${badgeClass} inv-status-badge`}>
              {status}
            </span>
          </td>
          
          {/* Actions */}
          <td className="inv-cell-actions">
            <div className="d-flex align-items-center gap-1">
              {/* View Details */}
              <button
                type="button"
                className="btn btn-sm inv-btn-icon inv-btn-view"
                onClick={() => onViewDetails(med.id)}
                disabled={isLoading}
                title="View Details"
                aria-label={`View details of ${med.medicineName}`}
              >
                <FiEye size={15} />
              </button>
              
              {/* Edit */}
              <button
                type="button"
                className="btn btn-sm inv-btn-icon inv-btn-edit"
                onClick={() => onEdit(med.id)}
                disabled={isLoading}
                title="Edit Medicine"
                aria-label={`Edit ${med.medicineName}`}
              >
                <FiEdit size={15} />
              </button>
              
              {/* Delete */}
              <button
                type="button"
                className="btn btn-sm inv-btn-icon inv-btn-delete"
                onClick={() => onDelete(med.id)}
                disabled={isLoading}
                title="Soft Delete Medicine"
                aria-label={`Delete ${med.medicineName}`}
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }, [medicines, getStockStatus, isExpired, isExpiringSoon, onViewDetails, onEdit, onDelete, isLoading]);

  return (
    <div className="inv-table-container card border-0 shadow-sm overflow-hidden mb-4">
      <div className="table-responsive">
        <table className="table table-hover table-striped mb-0">
          <thead className="table-light text-secondary">
            <tr>{headers}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      
      {/* ── Pagination Footer ── */}
      {medicines && medicines.length > 0 && (
        <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between py-3 px-4">
          <div className="text-muted small">
            Page <strong>{currentPage}</strong>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm inv-btn-pagination d-flex align-items-center gap-1"
              onClick={onPrevPage}
              disabled={currentPage === 1 || isLoading}
              aria-label="Previous Page"
            >
              <FiChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="btn btn-sm inv-btn-pagination d-flex align-items-center gap-1"
              onClick={onNextPage}
              disabled={!hasMore || isLoading}
              aria-label="Next Page"
            >
              <span>Next</span>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineTable;
