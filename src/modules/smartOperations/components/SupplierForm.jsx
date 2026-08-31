/**
 * @file        SupplierForm.jsx
 * @module      SmartOperations
 * @purpose     Add / Edit supplier form with inline validation.
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser } from 'react-icons/fi';
import { SUPPLIER_STATUS, SUPPLIER_FORM_DEFAULTS } from '../constants/smartOpsConstants';

const FIELDS = [
  { key: 'name',          label: 'Supplier Name *', type: 'text',  placeholder: 'e.g. ABC Pharma Distributors', required: true },
  { key: 'contactNumber', label: 'Contact Number',  type: 'tel',   placeholder: 'e.g. +91 98765 43210',         required: false },
  { key: 'email',         label: 'Email Address',   type: 'email', placeholder: 'supplier@example.com',          required: false },
  { key: 'address',       label: 'Address',         type: 'textarea', placeholder: 'Full address of supplier', required: false },
];

function SupplierForm({ initialData = null, onSubmit, onCancel, isSaving = false }) {
  const [form,   setForm]   = useState(SUPPLIER_FORM_DEFAULTS);
  const [errors, setErrors] = useState({});

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setForm({
        name:          initialData.name          || '',
        contactNumber: initialData.contactNumber || '',
        email:         initialData.email         || '',
        address:       initialData.address       || '',
        status:        initialData.status        || SUPPLIER_STATUS.ACTIVE,
      });
    } else {
      setForm(SUPPLIER_FORM_DEFAULTS);
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())           errs.name  = 'Supplier name is required.';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        {FIELDS.map((field) => (
          <div key={field.key} className={`col-12 ${field.key === 'address' ? '' : 'col-md-6'}`}>
            <div className="so-form-group mb-0">
              <label className="so-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className={`so-textarea ${errors[field.key] ? 'is-invalid' : ''}`}
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <input
                  type={field.type}
                  className={`so-input ${errors[field.key] ? 'is-invalid' : ''}`}
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              {errors[field.key] && (
                <span className="so-error-text">{errors[field.key]}</span>
              )}
            </div>
          </div>
        ))}

        {/* Status (only in edit mode) */}
        {initialData && (
          <div className="col-12 col-md-6">
            <div className="so-form-group mb-0">
              <label className="so-label">Status</label>
              <select
                className="so-select"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value={SUPPLIER_STATUS.ACTIVE}>Active</option>
                <option value={SUPPLIER_STATUS.INACTIVE}>Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="d-flex gap-2 justify-content-end mt-4">
        <button
          type="button"
          className="btn so-btn-secondary d-flex align-items-center gap-2"
          onClick={onCancel}
          disabled={isSaving}
        >
          <FiX size={15} /> Cancel
        </button>
        <button
          type="submit"
          className="btn so-btn-primary d-flex align-items-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" />
              Saving…
            </>
          ) : (
            <>
              <FiSave size={15} />
              {initialData ? 'Update Supplier' : 'Add Supplier'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SupplierForm;
