/**
 * @file        MedicineCard.jsx
 * @module      Inventory
 * @purpose     Renders a single medicine item as a clean, highly styled Bootstrap 5 card.
 *              Used as a mobile-friendly alternative to the table layout, ensuring
 *              flawless responsiveness on smaller screens. Includes action buttons,
 *              expiry alerts, and stock status badges.
 * @dependencies react, react-icons, inventoryConstants, inventory.css
 * @exports     MedicineCard (default)
 */

import { useCallback } from "react";
import { 
  FiEye, 
  FiEdit, 
  FiTrash2, 
  FiAlertTriangle, 
  FiCalendar, 
  FiFolder, 
  FiTrendingUp, 
  FiAlertCircle 
} from "react-icons/fi";
import { 
  STOCK_STATUS, 
  STOCK_STATUS_COLORS, 
  EXPIRY_WARNING_DAYS 
} from "../constants/inventoryConstants";

/**
 * MedicineCard Component
 * 
 * @param {object}   props
 * @param {object}   props.medicine       - Individual medicine document object
 * @param {Function} props.onViewDetails  - Callback to view detailed information
 * @param {Function} props.onEdit         - Callback to navigate to edit screen
 * @param {Function} props.onDelete       - Callback to trigger soft deletion
 * @param {boolean}  [props.isLoading]    - Disables action buttons during operations
 */
function MedicineCard({
  medicine,
  onViewDetails,
  onEdit,
  onDelete,
  isLoading = false
}) {
  const {
    id,
    medicineName,
    genericName,
    manufacturer,
    supplier,
    category,
    batchNumber,
    expiryDate,
    purchasePrice,
    sellingPrice,
    quantity,
    minimumStock
  } = medicine;

  // ── Helper: Determine stock status ─────────────────────────────────────────
  const getStockStatus = useCallback((qty, minStock) => {
    const q = Number(qty) || 0;
    const m = Number(minStock) || 0;
    
    if (q === 0) return STOCK_STATUS.OUT_OF_STOCK;
    if (q <= m) return STOCK_STATUS.LOW;
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

  // ── Derived variables ──────────────────────────────────────────────────────
  const status = getStockStatus(quantity, minimumStock);
  const badgeClass = STOCK_STATUS_COLORS[status] || "bg-secondary";
  
  const expired = isExpired(expiryDate);
  const expiringSoon = isExpiringSoon(expiryDate);

  return (
    <div className="card inv-medicine-card border-0 shadow-sm h-100 overflow-hidden">
      {/* ── Top Header Bar ── */}
      <div className="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-start">
        <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
          <FiFolder size={12} />
          {category}
        </span>
        <span className={`badge ${badgeClass} inv-status-badge`}>
          {status}
        </span>
      </div>

      {/* ── Main Info ── */}
      <div className="card-body py-3">
        <h5 className="card-title text-dark fw-bold mb-1 inv-card-title text-truncate" title={medicineName}>
          {medicineName}
        </h5>
        <h6 className="card-subtitle text-muted mb-3 inv-card-subtitle text-truncate" title={genericName}>
          {genericName || "No generic name specified"}
        </h6>

        {/* Expiry Alerts */}
        {expired ? (
          <div className="alert alert-danger py-1 px-2 mb-3 d-flex align-items-center gap-1 small rounded border-0" role="alert">
            <FiAlertCircle size={14} className="flex-shrink-0" />
            <span className="fw-semibold">Expired! Do not sell.</span>
          </div>
        ) : expiringSoon ? (
          <div className="alert alert-warning py-1 px-2 mb-3 d-flex align-items-center gap-1 small rounded border-0 text-dark" role="alert">
            <FiAlertTriangle size={14} className="flex-shrink-0" />
            <span className="fw-semibold">Expiring soon ({expiryDate})</span>
          </div>
        ) : null}

        {/* Info Grid */}
        <div className="row g-2 mb-3 small text-secondary">
          <div className="col-6">
            <div className="text-muted">Batch No.</div>
            <div className="font-monospace text-dark text-truncate">{batchNumber}</div>
          </div>
          <div className="col-6">
            <div className="text-muted d-flex align-items-center gap-1">
              <FiCalendar size={12} />
              Expiry
            </div>
            <div className={`text-dark ${expired ? "text-danger fw-bold" : expiringSoon ? "text-warning fw-bold" : ""}`}>
              {expiryDate}
            </div>
          </div>
          <div className="col-12 border-top my-2"></div>
          <div className="col-6">
            <div className="text-muted">Manufacturer</div>
            <div className="text-dark text-truncate">{manufacturer}</div>
          </div>
          <div className="col-6">
            <div className="text-muted">Supplier</div>
            <div className="text-dark text-truncate">{supplier}</div>
          </div>
        </div>

        {/* Financials & Stock Panel */}
        <div className="inv-card-stock-panel p-2 rounded bg-light d-flex align-items-center justify-content-between mb-1">
          <div>
            <div className="text-muted small">Qty</div>
            <div className="fw-bold text-dark">{Number(quantity).toLocaleString()} units</div>
          </div>
          <div className="text-end">
            <div className="text-muted small d-flex align-items-center gap-1 justify-content-end">
              <FiTrendingUp size={12} />
              Price (₹)
            </div>
            <div className="fw-bold text-dark">{Number(sellingPrice).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons Footer ── */}
      <div className="card-footer bg-white border-0 pb-3 pt-0">
        <div className="row g-2">
          {/* View Details */}
          <div className="col-4">
            <button
              type="button"
              className="btn btn-outline-secondary w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
              onClick={() => onViewDetails(id)}
              disabled={isLoading}
              aria-label={`View details of ${medicineName}`}
            >
              <FiEye size={14} />
              <span>Details</span>
            </button>
          </div>
          {/* Edit */}
          <div className="col-4">
            <button
              type="button"
              className="btn btn-outline-primary w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
              onClick={() => onEdit(id)}
              disabled={isLoading}
              aria-label={`Edit ${medicineName}`}
            >
              <FiEdit size={14} />
              <span>Edit</span>
            </button>
          </div>
          {/* Delete */}
          <div className="col-4">
            <button
              type="button"
              className="btn btn-outline-danger w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
              onClick={() => onDelete(id)}
              disabled={isLoading}
              aria-label={`Delete ${medicineName}`}
            >
              <FiTrash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicineCard;
