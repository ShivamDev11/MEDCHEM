/**
 * @file        ExpiryTable.jsx
 * @module      Expiry
 * @purpose     Displays the list of medicines relevant to expiry tracking.
 *              Includes all required columns and action button.
 * @dependencies react, react-icons, expiryConstants, ExpiryStatusBadge, inventory.css
 * @exports     ExpiryTable (default)
 */

import { useMemo } from "react";
import { FiEye } from "react-icons/fi";
import { EXPIRY_TABLE_COLUMNS } from "../constants/expiryConstants";
import ExpiryStatusBadge from "./ExpiryStatusBadge";

/**
 * ExpiryTable
 *
 * @param {object}   props
 * @param {object[]} props.medicines     - Array of enriched medicine objects
 * @param {Function} props.onViewDetails - Callback for View action
 * @param {boolean}  props.loading       - Loading state
 */
function ExpiryTable({ medicines, onViewDetails, loading }) {
  // ── Render header columns ──────────────────────────────────────────────────
  const headers = useMemo(() => {
    return EXPIRY_TABLE_COLUMNS.map((col) => (
      <th key={col.key} className="text-nowrap text-secondary font-weight-bold">
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
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (!medicines || medicines.length === 0) {
      return (
        <tr>
          <td colSpan={EXPIRY_TABLE_COLUMNS.length} className="text-center py-5">
            <p className="text-muted mb-0">No medicines found.</p>
          </td>
        </tr>
      );
    }

    return medicines.map((med) => (
      <tr key={med.id} className="align-middle">
        <td className="fw-semibold text-dark">{med.medicineName}</td>
        <td className="text-muted">{med.genericName || "—"}</td>
        <td className="font-monospace">{med.batchNumber}</td>
        <td>
          <span className="badge bg-light text-dark border">{med.category}</span>
        </td>
        <td className="text-end fw-medium">{Number(med.quantity).toLocaleString()}</td>
        <td className="text-nowrap">{med.expiryDate}</td>
        <td className="text-end fw-bold">
          {med.daysRemaining < 0 ? (
            <span className="text-danger">{med.daysRemaining}</span>
          ) : (
            med.daysRemaining
          )}
        </td>
        <td>
          <ExpiryStatusBadge status={med.expiryStatus} />
        </td>
        <td>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => onViewDetails(med.id)}
            title="View Details"
          >
            <FiEye size={14} /> View
          </button>
        </td>
      </tr>
    ));
  }, [medicines, loading, onViewDetails]);

  return (
    <div className="card border-0 shadow-sm overflow-hidden mb-4">
      <div className="table-responsive">
        <table className="table table-hover table-striped mb-0">
          <thead className="table-light">
            <tr>{headers}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      {/* Simple footer count */}
      {!loading && medicines && medicines.length > 0 && (
        <div className="card-footer bg-white border-top text-muted small py-2">
          Total Records: <strong>{medicines.length}</strong>
        </div>
      )}
    </div>
  );
}

export default ExpiryTable;
