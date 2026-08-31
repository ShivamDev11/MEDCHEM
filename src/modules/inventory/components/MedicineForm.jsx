/**
 * @file        MedicineForm.jsx
 * @module      Inventory
 * @purpose     Reusable form for both Add and Edit medicine operations.
 *              Handles all 12 user-editable fields, full client-side validation
 *              using VALIDATION_RULES from constants, and double-submission guard.
 *              The parent page owns the service call, toast, and navigation —
 *              this component only validates and calls props.onSubmit(data).
 * @dependencies react, react-router-dom, react-icons,
 *               inventoryConstants, inventory.css
 * @exports     MedicineForm (default)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSave,
  FiX,
  FiAlertCircle,
  FiDollarSign,
  FiPackage,
  FiTag,
  FiCalendar,
  FiFileText,
  FiTruck,
} from "react-icons/fi";

import {
  MEDICINE_CATEGORIES,
  VALIDATION_RULES,
  FORM_DEFAULT_VALUES,
  TOAST_MESSAGES,
} from "../constants/inventoryConstants";
import { getSuppliers } from "../../smartOperations/services/supplierService";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const validateForm = (values) => {
  const errors = {};

  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const raw   = values[field];
    const value = typeof raw === "string" ? raw.trim() : raw;

    if (rules.required && (value === "" || value === null || value === undefined)) {
      errors[field] = `${rules.label} is required.`;
      continue;
    }

    if (value === "" || value === null || value === undefined) continue;

    if (rules.isCategory && !MEDICINE_CATEGORIES.includes(value)) {
      errors[field] = `Please select a valid ${rules.label}.`;
      continue;
    }

    if (rules.notPast) {
      const today = new Date().toISOString().split("T")[0];
      if (value < today) {
        errors[field] = `${rules.label} cannot be a past date.`;
        continue;
      }
    }

    if (rules.min !== undefined) {
      if (isNaN(Number(value)) || Number(value) < rules.min) {
        errors[field] =
          rules.min === 0
            ? `${rules.label} cannot be negative.`
            : `${rules.label} must be greater than 0.`;
        continue;
      }
    }

    if (rules.isInteger && !Number.isInteger(Number(value))) {
      errors[field] = `${rules.label} must be a whole number (no decimals).`;
      continue;
    }

    if (rules.gtField) {
      const otherRaw = values[rules.gtField];
      const other    = Number(otherRaw);
      if (!isNaN(other) && Number(value) <= other) {
        errors[field] = `${rules.label} must be greater than ${rules.gtFieldLabel}.`;
      }
    }
  }

  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD ERROR
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="inv-field-error" role="alert" aria-live="polite">
      <FiAlertCircle size={12} aria-hidden="true" />
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD — wraps a logical group of form fields in a subtle card
// ─────────────────────────────────────────────────────────────────────────────
function FormSectionCard({ icon: Icon, title, children }) {
  return (
    <div className="inv-form-section-card">
      <div className="inv-form-section-header">
        <Icon size={14} className="inv-section-icon" aria-hidden="true" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MedicineForm
 *
 * @param {object}   props
 * @param {object}   props.initialValues  - Pre-filled values for Edit mode.
 * @param {Function} props.onSubmit       - async (validatedData) => void
 * @param {boolean}  [props.isEditMode]   - true = Edit, false = Add (default)
 * @param {boolean}  [props.isLoading]    - true while Edit page loads existing doc
 */
function MedicineForm({
  initialValues,
  onSubmit,
  isEditMode   = false,
  isLoading    = false,
}) {
  const navigate = useNavigate();

  // ── Form State ─────────────────────────────────────────────────────────────
  const [values,         setValues]         = useState({ ...FORM_DEFAULT_VALUES });
  const [errors,         setErrors]         = useState({});
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        if (isMounted) setSuppliers(data);
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      } finally {
        if (isMounted) setIsLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (initialValues) {
      setValues({ ...FORM_DEFAULT_VALUES, ...initialValues });
    }
  }, [initialValues]);

  useEffect(() => {
    if (submitAttempted) {
      setErrors(validateForm(values));
    }
  }, [values, submitAttempted]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCancel = useCallback(() => {
    navigate("/inventory");
  }, [navigate]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitAttempted(true);

      const validationErrors = validateForm(values);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstErrorField = document.querySelector(".inv-input-error");
        firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const trimmedValues = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [
            k,
            typeof v === "string" ? v.trim() : v,
          ])
        );
        await onSubmit(trimmedValues);
      } catch {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, isSubmitting]
  );

  // ── Render: Loading skeleton ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="inv-form-skeleton-wrap" aria-busy="true" aria-label="Loading medicine data">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="inv-skeleton-field" />
            </div>
            <div className="col-md-6">
              <div className="inv-skeleton-field" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render: Form ───────────────────────────────────────────────────────────
  return (
    <form
      id="inv-medicine-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditMode ? "Edit medicine form" : "Add new medicine form"}
    >

      {/* ── SECTION 1: Medicine Information ─────────────────────────────── */}
      <FormSectionCard icon={FiPackage} title="Medicine Information">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="inv-f-medicineName" className="inv-form-label">
              Medicine Name <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-medicineName"
              name="medicineName"
              type="text"
              className={`form-control inv-form-control ${errors.medicineName ? "inv-input-error" : ""}`}
              value={values.medicineName}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Paracetamol 500mg"
              autoComplete="off"
              aria-required="true"
            />
            <FieldError message={errors.medicineName} />
          </div>

          <div className="col-md-6">
            <label htmlFor="inv-f-genericName" className="inv-form-label">
              Generic Name
              <span className="inv-optional-label"> (Optional)</span>
            </label>
            <input
              id="inv-f-genericName"
              name="genericName"
              type="text"
              className="form-control inv-form-control"
              value={values.genericName}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Acetaminophen"
              autoComplete="off"
            />
          </div>
        </div>
      </FormSectionCard>

      {/* ── SECTION 2: Manufacturer & Supplier ──────────────────────────── */}
      <FormSectionCard icon={FiTruck} title="Manufacturer & Supplier">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="inv-f-manufacturer" className="inv-form-label">
              Manufacturer <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-manufacturer"
              name="manufacturer"
              type="text"
              className={`form-control inv-form-control ${errors.manufacturer ? "inv-input-error" : ""}`}
              value={values.manufacturer}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Sun Pharma"
              autoComplete="off"
              aria-required="true"
            />
            <FieldError message={errors.manufacturer} />
          </div>

          <div className="col-md-6">
            <label htmlFor="inv-f-supplier" className="inv-form-label">
              Supplier <span className="inv-required">*</span>
            </label>
            <select
              id="inv-f-supplier"
              name="supplier"
              className={`form-select inv-form-control ${errors.supplier ? "inv-input-error" : ""}`}
              value={values.supplier}
              onChange={handleChange}
              disabled={isSubmitting || isLoadingSuppliers}
              aria-required="true"
            >
              <option value="">— Select Supplier —</option>
              {isLoadingSuppliers ? (
                 <option value="" disabled>Loading suppliers...</option>
              ) : suppliers.length === 0 ? (
                 <option value="" disabled>No suppliers available. Please add a supplier first.</option>
              ) : (
                 suppliers.map((s) => (
                   <option key={s.id} value={s.name}>{s.name}</option>
                 ))
              )}
            </select>
            <FieldError message={errors.supplier} />
          </div>
        </div>
      </FormSectionCard>

      {/* ── SECTION 3: Classification ────────────────────────────────────── */}
      <FormSectionCard icon={FiTag} title="Classification">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="inv-f-category" className="inv-form-label">
              Category <span className="inv-required">*</span>
            </label>
            <select
              id="inv-f-category"
              name="category"
              className={`form-select inv-form-control ${errors.category ? "inv-input-error" : ""}`}
              value={values.category}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-required="true"
            >
              <option value="">— Select category —</option>
              {MEDICINE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <FieldError message={errors.category} />
          </div>

          <div className="col-md-6">
            <label htmlFor="inv-f-batchNumber" className="inv-form-label">
              Batch Number <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-batchNumber"
              name="batchNumber"
              type="text"
              className={`form-control inv-form-control ${errors.batchNumber ? "inv-input-error" : ""}`}
              value={values.batchNumber}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. BT-2024-001"
              autoComplete="off"
              aria-required="true"
            />
            <FieldError message={errors.batchNumber} />
          </div>
        </div>
      </FormSectionCard>

      {/* ── SECTION 4: Expiry & Pricing ──────────────────────────────────── */}
      <FormSectionCard icon={FiDollarSign} title="Expiry & Pricing">
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="inv-f-expiryDate" className="inv-form-label">
              <FiCalendar size={12} className="me-1" aria-hidden="true" />
              Expiry Date <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-expiryDate"
              name="expiryDate"
              type="date"
              className={`form-control inv-form-control ${errors.expiryDate ? "inv-input-error" : ""}`}
              value={values.expiryDate}
              onChange={handleChange}
              disabled={isSubmitting}
              min={new Date().toISOString().split("T")[0]}
              aria-required="true"
            />
            <FieldError message={errors.expiryDate} />
          </div>

          <div className="col-md-4">
            <label htmlFor="inv-f-purchasePrice" className="inv-form-label">
              Purchase Price (₹) <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-purchasePrice"
              name="purchasePrice"
              type="number"
              className={`form-control inv-form-control ${errors.purchasePrice ? "inv-input-error" : ""}`}
              value={values.purchasePrice}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              aria-required="true"
            />
            <FieldError message={errors.purchasePrice} />
          </div>

          <div className="col-md-4">
            <label htmlFor="inv-f-sellingPrice" className="inv-form-label">
              Selling Price (₹) <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-sellingPrice"
              name="sellingPrice"
              type="number"
              className={`form-control inv-form-control ${errors.sellingPrice ? "inv-input-error" : ""}`}
              value={values.sellingPrice}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              aria-required="true"
            />
            <FieldError message={errors.sellingPrice} />
            {!errors.sellingPrice && values.purchasePrice && (
              <div className="inv-field-hint">
                Must be greater than ₹{Number(values.purchasePrice).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </FormSectionCard>

      {/* ── SECTION 5: Stock Levels ───────────────────────────────────────── */}
      <FormSectionCard icon={FiPackage} title="Stock Levels">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="inv-f-quantity" className="inv-form-label">
              Current Quantity <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-quantity"
              name="quantity"
              type="number"
              className={`form-control inv-form-control ${errors.quantity ? "inv-input-error" : ""}`}
              value={values.quantity}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0"
              min="0"
              step="1"
              aria-required="true"
            />
            <FieldError message={errors.quantity} />
          </div>

          <div className="col-md-6">
            <label htmlFor="inv-f-minimumStock" className="inv-form-label">
              Minimum Stock Level <span className="inv-required">*</span>
            </label>
            <input
              id="inv-f-minimumStock"
              name="minimumStock"
              type="number"
              className={`form-control inv-form-control ${errors.minimumStock ? "inv-input-error" : ""}`}
              value={values.minimumStock}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0"
              min="0"
              step="1"
              aria-required="true"
            />
            <FieldError message={errors.minimumStock} />
            <div className="inv-field-hint">
              Low stock alert triggers when quantity falls to or below this level.
            </div>
          </div>
        </div>
      </FormSectionCard>

      {/* ── SECTION 6: Additional Details ────────────────────────────────── */}
      <FormSectionCard icon={FiFileText} title="Additional Details">
        <div className="row g-3">
          <div className="col-12">
            <label htmlFor="inv-f-description" className="inv-form-label">
              Description
              <span className="inv-optional-label"> (Optional)</span>
            </label>
            <textarea
              id="inv-f-description"
              name="description"
              className="form-control inv-form-control inv-textarea"
              value={values.description}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Add any relevant notes about this medicine, dosage, storage requirements, etc."
              rows={3}
              maxLength={500}
            />
            <div className="inv-char-count">
              {(values.description || "").length} / 500 characters
            </div>
          </div>
        </div>
      </FormSectionCard>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────── */}
      <div className="inv-form-actions">
        <button
          type="button"
          id="inv-form-cancel-btn"
          className="btn inv-btn-secondary d-flex align-items-center gap-2"
          onClick={handleCancel}
          disabled={isSubmitting}
          aria-label="Cancel and go back to inventory list"
        >
          <FiX size={15} />
          Cancel
        </button>

        <button
          type="submit"
          id="inv-form-submit-btn"
          className="btn inv-btn-primary d-flex align-items-center gap-2"
          disabled={isSubmitting}
          aria-label={isEditMode ? "Save medicine changes" : "Add medicine to inventory"}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <FiSave size={15} aria-hidden="true" />
              <span>{isEditMode ? "Save Changes" : "Add Medicine"}</span>
            </>
          )}
        </button>
      </div>

      {/* Validation summary */}
      {submitAttempted && Object.keys(errors).length > 0 && (
        <div
          className="inv-validation-summary mt-3"
          role="alert"
          aria-live="assertive"
        >
          <FiAlertCircle size={15} aria-hidden="true" />
          {TOAST_MESSAGES.VALIDATION_FAILED}
        </div>
      )}
    </form>
  );
}

export default MedicineForm;
