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
  FiLoader,
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

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE
// Runs every VALIDATION_RULES entry against the current form values.
// Returns an errors object: { fieldName: "Human-readable error message" }
// Empty object means the form is valid.
// ─────────────────────────────────────────────────────────────────────────────
const validateForm = (values) => {
  const errors = {};

  for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
    const raw   = values[field];
    const value = typeof raw === "string" ? raw.trim() : raw;

    // 1. Required check
    if (rules.required && (value === "" || value === null || value === undefined)) {
      errors[field] = `${rules.label} is required.`;
      continue; // skip further checks for this field
    }

    // Skip remaining checks if field is empty and not required
    if (value === "" || value === null || value === undefined) continue;

    // 2. Valid category check
    if (rules.isCategory && !MEDICINE_CATEGORIES.includes(value)) {
      errors[field] = `Please select a valid ${rules.label}.`;
      continue;
    }

    // 3. Date not in past
    if (rules.notPast) {
      const today = new Date().toISOString().split("T")[0];
      if (value < today) {
        errors[field] = `${rules.label} cannot be a past date.`;
        continue;
      }
    }

    // 4. Minimum numeric value
    if (rules.min !== undefined) {
      if (isNaN(Number(value)) || Number(value) < rules.min) {
        errors[field] =
          rules.min === 0
            ? `${rules.label} cannot be negative.`
            : `${rules.label} must be greater than 0.`;
        continue;
      }
    }

    // 5. Integer check
    if (rules.isInteger && !Number.isInteger(Number(value))) {
      errors[field] = `${rules.label} must be a whole number (no decimals).`;
      continue;
    }

    // 6. Greater-than-another-field check (sellingPrice > purchasePrice)
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
// FIELD ERROR MESSAGE
// Small reusable inline error text under each invalid field.
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="inv-field-error" role="alert" aria-live="polite">
      <FiAlertCircle size={12} className="me-1" aria-hidden="true" />
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// Visual divider between logical form sections.
// ─────────────────────────────────────────────────────────────────────────────
function FormSection({ icon: Icon, title }) {
  return (
    <div className="inv-form-section-header">
      <Icon size={15} className="inv-section-icon" aria-hidden="true" />
      <span>{title}</span>
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
 *                                          Use FORM_DEFAULT_VALUES for Add mode.
 * @param {Function} props.onSubmit       - async (validatedData) => void
 *                                          Called only after validation passes.
 *                                          Parent handles service call + toast.
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
  const [values,      setValues]      = useState({ ...FORM_DEFAULT_VALUES });
  const [errors,      setErrors]      = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /**
   * Sync form values whenever initialValues prop changes.
   * On Edit page: initialValues arrives asynchronously after Firestore fetch.
   * On Add page:  initialValues is always FORM_DEFAULT_VALUES (no-op on change).
   */
  useEffect(() => {
    if (initialValues) {
      setValues({ ...FORM_DEFAULT_VALUES, ...initialValues });
    }
  }, [initialValues]);

  /**
   * Re-validate live after the first submit attempt.
   * This gives real-time feedback as the user corrects errors
   * without being annoying on untouched fields.
   */
  useEffect(() => {
    if (submitAttempted) {
      setErrors(validateForm(values));
    }
  }, [values, submitAttempted]);

  // ── Generic field change handler ───────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // ── Cancel — navigate back to inventory list ───────────────────────────────
  const handleCancel = useCallback(() => {
    navigate("/inventory");
  }, [navigate]);

  // ── Submit Handler ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitAttempted(true);

      // Run full validation
      const validationErrors = validateForm(values);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        // Scroll to first error field
        const firstErrorField = document.querySelector(".inv-input-error");
        firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      // Guard: prevent double submission
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        // Trim all string values before submitting
        const trimmedValues = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [
            k,
            typeof v === "string" ? v.trim() : v,
          ])
        );
        await onSubmit(trimmedValues);
        // Navigation is handled by the parent after successful submission
      } catch {
        // Parent shows error toast; re-enable the form for correction
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, isSubmitting]
  );

  // ── Render: Loading skeleton (Edit page fetching existing doc) ─────────────
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — Medicine Information
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiPackage} title="Medicine Information" />

      <div className="row g-3 mb-3">
        {/* Medicine Name */}
        <div className="col-md-6">
          <label htmlFor="inv-f-medicineName" className="inv-form-label">
            Medicine Name <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-medicineName"
            name="medicineName"
            type="text"
            className={`form-control inv-form-control ${
              errors.medicineName ? "inv-input-error" : ""
            }`}
            value={values.medicineName}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Paracetamol 500mg"
            autoComplete="off"
            aria-required="true"
            aria-describedby={errors.medicineName ? "inv-err-medicineName" : undefined}
          />
          <FieldError message={errors.medicineName} />
        </div>

        {/* Generic Name */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — Manufacturer & Supplier
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiTruck} title="Manufacturer & Supplier" />

      <div className="row g-3 mb-3">
        {/* Manufacturer */}
        <div className="col-md-6">
          <label htmlFor="inv-f-manufacturer" className="inv-form-label">
            Manufacturer <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-manufacturer"
            name="manufacturer"
            type="text"
            className={`form-control inv-form-control ${
              errors.manufacturer ? "inv-input-error" : ""
            }`}
            value={values.manufacturer}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Sun Pharma"
            autoComplete="off"
            aria-required="true"
          />
          <FieldError message={errors.manufacturer} />
        </div>

        {/* Supplier */}
        <div className="col-md-6">
          <label htmlFor="inv-f-supplier" className="inv-form-label">
            Supplier <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-supplier"
            name="supplier"
            type="text"
            className={`form-control inv-form-control ${
              errors.supplier ? "inv-input-error" : ""
            }`}
            value={values.supplier}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Apollo Distributor"
            autoComplete="off"
            aria-required="true"
          />
          <FieldError message={errors.supplier} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Classification
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiTag} title="Classification" />

      <div className="row g-3 mb-3">
        {/* Category */}
        <div className="col-md-6">
          <label htmlFor="inv-f-category" className="inv-form-label">
            Category <span className="inv-required">*</span>
          </label>
          <select
            id="inv-f-category"
            name="category"
            className={`form-select inv-form-control ${
              errors.category ? "inv-input-error" : ""
            }`}
            value={values.category}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-required="true"
          >
            <option value="">— Select category —</option>
            {MEDICINE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>

        {/* Batch Number */}
        <div className="col-md-6">
          <label htmlFor="inv-f-batchNumber" className="inv-form-label">
            Batch Number <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-batchNumber"
            name="batchNumber"
            type="text"
            className={`form-control inv-form-control ${
              errors.batchNumber ? "inv-input-error" : ""
            }`}
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — Expiry & Pricing
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiDollarSign} title="Expiry & Pricing" />

      <div className="row g-3 mb-3">
        {/* Expiry Date */}
        <div className="col-md-4">
          <label htmlFor="inv-f-expiryDate" className="inv-form-label">
            <FiCalendar size={13} className="me-1" aria-hidden="true" />
            Expiry Date <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-expiryDate"
            name="expiryDate"
            type="date"
            className={`form-control inv-form-control ${
              errors.expiryDate ? "inv-input-error" : ""
            }`}
            value={values.expiryDate}
            onChange={handleChange}
            disabled={isSubmitting}
            min={new Date().toISOString().split("T")[0]}
            aria-required="true"
          />
          <FieldError message={errors.expiryDate} />
        </div>

        {/* Purchase Price */}
        <div className="col-md-4">
          <label htmlFor="inv-f-purchasePrice" className="inv-form-label">
            Purchase Price (₹) <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-purchasePrice"
            name="purchasePrice"
            type="number"
            className={`form-control inv-form-control ${
              errors.purchasePrice ? "inv-input-error" : ""
            }`}
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

        {/* Selling Price */}
        <div className="col-md-4">
          <label htmlFor="inv-f-sellingPrice" className="inv-form-label">
            Selling Price (₹) <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-sellingPrice"
            name="sellingPrice"
            type="number"
            className={`form-control inv-form-control ${
              errors.sellingPrice ? "inv-input-error" : ""
            }`}
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Stock Levels
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiPackage} title="Stock Levels" />

      <div className="row g-3 mb-3">
        {/* Quantity */}
        <div className="col-md-6">
          <label htmlFor="inv-f-quantity" className="inv-form-label">
            Current Quantity <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-quantity"
            name="quantity"
            type="number"
            className={`form-control inv-form-control ${
              errors.quantity ? "inv-input-error" : ""
            }`}
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

        {/* Minimum Stock */}
        <div className="col-md-6">
          <label htmlFor="inv-f-minimumStock" className="inv-form-label">
            Minimum Stock Level <span className="inv-required">*</span>
          </label>
          <input
            id="inv-f-minimumStock"
            name="minimumStock"
            type="number"
            className={`form-control inv-form-control ${
              errors.minimumStock ? "inv-input-error" : ""
            }`}
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — Additional Details
      ════════════════════════════════════════════════════════════════════ */}
      <FormSection icon={FiFileText} title="Additional Details" />

      <div className="row g-3 mb-4">
        {/* Description */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          ACTION BUTTONS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="inv-form-actions">
        {/* Cancel */}
        <button
          type="button"
          id="inv-form-cancel-btn"
          className="btn inv-btn-secondary d-flex align-items-center gap-2"
          onClick={handleCancel}
          disabled={isSubmitting}
          aria-label="Cancel and go back to inventory list"
        >
          <FiX size={16} />
          Cancel
        </button>

        {/* Submit */}
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
              <FiSave size={16} aria-hidden="true" />
              <span>{isEditMode ? "Save Changes" : "Add Medicine"}</span>
            </>
          )}
        </button>
      </div>

      {/* Validation summary — shown only after first submit attempt */}
      {submitAttempted && Object.keys(errors).length > 0 && (
        <div
          className="inv-validation-summary mt-3"
          role="alert"
          aria-live="assertive"
        >
          <FiAlertCircle size={15} className="me-2" aria-hidden="true" />
          {TOAST_MESSAGES.VALIDATION_FAILED}
        </div>
      )}
    </form>
  );
}

export default MedicineForm;
