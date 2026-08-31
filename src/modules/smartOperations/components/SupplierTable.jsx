/**
 * @file        SupplierTable.jsx
 * @module      SmartOperations
 * @purpose     Displays a table of suppliers with actions.
 */

import React from 'react';
import { FiEdit2, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi';
import { SUPPLIER_STATUS } from '../constants/smartOpsConstants';

function SupplierTable({ suppliers = [], isLoading, onViewDetails, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="so-spinner-wrap">
        <div className="so-brand-spinner" />
        <p className="mt-3 text-muted small">Loading suppliers...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="so-empty-state so-card">
        <div className="so-empty-icon-wrap">
          <FiAlertCircle size={28} />
        </div>
        <h5 className="fw-bold text-dark">No Suppliers Found</h5>
        <p className="text-muted small">There are no suppliers matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="so-table-wrapper so-card">
      <table className="so-table">
        <thead>
          <tr>
            <th>Supplier Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="fw-semibold text-dark">{supplier.name}</td>
              <td>{supplier.contactNumber || '-'}</td>
              <td>{supplier.email || '-'}</td>
              <td>
                <span className={`so-badge ${supplier.status === SUPPLIER_STATUS.ACTIVE ? 'so-badge-success' : 'so-badge-secondary'}`}>
                  {supplier.status === SUPPLIER_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-end">
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-sm btn-light border"
                    onClick={() => onViewDetails(supplier.id)}
                    title="View Details"
                  >
                    <FiEye size={14} className="text-primary" />
                  </button>
                  <button
                    className="btn btn-sm btn-light border"
                    onClick={() => onEdit(supplier)}
                    title="Edit Supplier"
                  >
                    <FiEdit2 size={14} className="text-secondary" />
                  </button>
                  <button
                    className="btn btn-sm btn-light border"
                    onClick={() => onDelete(supplier.id, supplier.name)}
                    title="Delete Supplier"
                  >
                    <FiTrash2 size={14} className="text-danger" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierTable;
