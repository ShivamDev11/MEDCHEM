/**
 * @file        ExpiryTable.jsx
 * @module      Expiry
 * @purpose     Displays the list of medicines relevant to expiry tracking.
 *              Includes all required columns and action button.
 * @dependencies react, react-icons, expiryConstants, ExpiryStatusBadge, expiry.css
 * @exports     ExpiryTable (default)
 */

import { useMemo } from "react";
import { FiEye, FiCalendar } from "react-icons/fi";
import { EXPIRY_TABLE_COLUMNS } from "../constants/expiryConstants";
import ExpiryStatusBadge from "./ExpiryStatusBadge";

/**
 * ExpiryTable
 */
function ExpiryTable({ medicines, onViewDetails, loading }) {
  // ── Render header columns ──────────────────────────────────────────────────
  const headers = useMemo(() => {
    return EXPIRY_TABLE_COLUMNS.map((col) => (
      <th key={col.key}>
        {col.label}
      </th>
    ));
  }, []);

  // ── Render table rows ──────────────────────────────────────────────────────
  const rows = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={EXPIRY_TABLE_COLUMNS.length} className="text-center py-5">
            <div className="inv-spinner-wrap">
              <div className="inv-brand-spinner" role="status" aria-label="Loading list" />
              <p className="text-muted small mb-0 mt-2">Loading expiry list…</p>
            </div>
          </td>
        </tr>
      );
    }

    if (!medicines || medicines.length === 0) {
      return (
        <tr>
          <td colSpan={EXPIRY_TABLE_COLUMNS.length} className="text-center py-5">
            <div className="exp-empty-card border-0 py-4 text-center">
              <div className="exp-empty-icon-wrap" aria-hidden="true">
                <FiCalendar size={24} />
              </div>
              <h5 className="fw-bold text-dark mb-1">No medicines monitored</h5>
              <p className="text-secondary small mb-0">No records match your selected expiry status filter.</p>
            </div>
          </td>
        </tr>
      );
    }

    return medicines.map((med) => {
      // Accentuate styling for expired or critical status
      const isExpired = med.daysRemaining < 0;
      const isCritical = med.daysRemaining >= 0 && med.daysRemaining <= 30;
      
      let rowHighlightClass = "";
      let daysRemainingClass = "text-dark fw-semibold";

      if (isExpired) {
        rowHighlightClass = "table-danger-subtle";
        daysRemainingClass = "text-danger fw-bold";
      } else if (isCritical) {
        rowHighlightClass = "table-warning-subtle";
        daysRemainingClass = "text-warning-dark fw-bold";
      }

      return (
        <tr key={med.id} className={`align-middle ${rowHighlightClass}`}>
          {/* Medicine Name */}
          <td className="fw-semibold text-dark">{med.medicineName}</td>
          
          {/* Generic Name */}
          <td className="text-muted" style={{ fontSize: "0.875rem" }}>
            {med.genericName || "—"}
          </td>
          
          {/* Batch */}
          <td className="font-monospace text-secondary" style={{ fontSize: "0.82rem" }}>
            {med.batchNumber}
          </td>
          
          {/* Category */}
          <td>
            <span className="inv-cat-badge">{med.category}</span>
          </td>
          
          {/* Stock */}
          <td className="text-end fw-semibold text-dark">
            {Number(med.quantity).toLocaleString()}
          </td>
          
          {/* Expiry Date */}
          <td className="text-nowrap text-secondary" style={{ fontSize: "0.875rem" }}>
            {med.expiryDate}
          </td>
          
          {/* Days Left */}
          <td className={`text-end ${daysRemainingClass}`}>
            {med.daysRemaining}
          </td>
          
          {/* Status Badge */}
          <td>
            <ExpiryStatusBadge status={med.expiryStatus} />
          </td>
          
          {/* Action */}
          <td>
            <button
              type="button"
              className="btn btn-sm inv-btn-icon inv-btn-view"
              onClick={() => onViewDetails(med.id)}
              title="View Details"
              style={{ width: "auto", height: "auto", padding: "0.35rem 0.65rem", display: "inline-flex", gap: "4px" }}
            >
              <FiEye size={13} />
              <span className="fw-bold" style={{ fontSize: "0.75rem" }}>View</span>
            </button>
          </td>
        </tr>
      );
    });
  }, [medicines, loading, onViewDetails]);

  return (
    <div className="card exp-table-card border-0 shadow-sm mb-4">
      <div className="table-responsive">
        <table className="table exp-table table-hover mb-0">
          <thead>
            <tr>{headers}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      
      {/* Footer count */}
      {!loading && medicines && medicines.length > 0 && (
        <div className="card-footer bg-white border-top text-muted small py-3 px-4">
          Total Monitored Batches: <strong>{medicines.length}</strong>
        </div>
      )}
    </div>
  );
}

export default ExpiryTable;
