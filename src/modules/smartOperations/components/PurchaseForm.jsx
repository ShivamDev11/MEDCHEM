/**
 * @file        PurchaseForm.jsx
 * @module      SmartOperations
 * @purpose     3-step purchase form:
 *              Step 1 – Select Supplier + Medicine
 *              Step 2 – Enter Quantity & Price
 *              Step 3 – Review & Confirm
 *
 *              On confirm, calls onSubmit({ header, items }) and parent handles Firebase write.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronRight, FiChevronLeft, FiCheck, FiPackage } from 'react-icons/fi';

const STEPS = ['Select Medicine', 'Enter Details', 'Review & Confirm'];

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  return (
    <div className="so-step-indicator mb-4">
      {STEPS.map((label, idx) => (
        <React.Fragment key={label}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 80 }}>
            <div
              className={`so-step-dot ${
                idx < currentStep
                  ? 'so-step-done'
                  : idx === currentStep
                  ? 'so-step-active'
                  : ''
              }`}
            >
              {idx < currentStep ? <FiCheck size={14} /> : idx + 1}
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                marginTop: '0.35rem',
                color: idx === currentStep ? 'var(--so-primary-dark)' : 'var(--so-text-muted)',
                fontWeight: idx === currentStep ? 700 : 500,
                textAlign: 'center',
              }}
            >
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`so-step-line ${idx < currentStep ? 'so-step-line-done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PurchaseForm({
  suppliers = [],
  medicines = [],
  onSearchMedicine,
  onSubmit,
  onCancel,
  isSubmitting = false,
  prefillMedicine = null,    // from Reorder Suggestions "Create Purchase"
  prefillSupplier = null,
}) {
  const [step, setStep] = useState(0);

  // Step 1 state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [medicineSearch,   setMedicineSearch]   = useState('');
  const [medicineResults,  setMedicineResults]  = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isSearching,      setIsSearching]      = useState(false);

  // Step 2 state
  const [quantity,      setQuantity]      = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Step 1 errors
  const [step1Errors, setStep1Errors] = useState({});
  const [step2Errors, setStep2Errors] = useState({});

  // Pre-fill from reorder suggestion
  useEffect(() => {
    if (prefillMedicine) {
      setSelectedMedicine(prefillMedicine);
      setMedicineSearch(prefillMedicine.medicineName || '');
      setPurchasePrice(String(prefillMedicine.purchasePrice || ''));
    }
    if (prefillSupplier) {
      setSelectedSupplier(prefillSupplier);
    }
  }, [prefillMedicine, prefillSupplier]);

  const handleSearchMedicine = useCallback(async (term) => {
    setMedicineSearch(term);
    setSelectedMedicine(null);
    if (!term.trim()) { setMedicineResults([]); return; }
    setIsSearching(true);
    try {
      const results = await onSearchMedicine(term);
      setMedicineResults(results || []);
    } catch {
      setMedicineResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchMedicine]);

  const handleSelectMedicine = (med) => {
    setSelectedMedicine(med);
    setMedicineSearch(med.medicineName || med.name || '');
    setMedicineResults([]);
    if (!purchasePrice) setPurchasePrice(String(med.purchasePrice || ''));
    if (!selectedSupplier && med.supplier) setSelectedSupplier(med.supplier);
  };

  // ── Validation ──
  const validateStep1 = () => {
    const errs = {};
    if (!selectedMedicine) errs.medicine = 'Please select a medicine.';
    if (!selectedSupplier.trim()) errs.supplier = 'Please select or enter a supplier.';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    const qty = Number(quantity);
    const price = Number(purchasePrice);
    if (!quantity || qty < 1 || !Number.isInteger(qty)) errs.quantity = 'Quantity must be a whole number ≥ 1.';
    if (!purchasePrice || price <= 0) errs.purchasePrice = 'Purchase price must be > 0.';
    return errs;
  };

  const handleNext = () => {
    if (step === 0) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setStep1Errors(errs); return; }
      setStep1Errors({});
      setStep(1);
    } else if (step === 1) {
      const errs = validateStep2();
      if (Object.keys(errs).length) { setStep2Errors(errs); return; }
      setStep2Errors({});
      setStep(2);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const computedSubtotal = Number(quantity || 0) * Number(purchasePrice || 0);

  const handleConfirm = () => {
    const header = {
      supplierId:   '',
      supplierName: selectedSupplier,
      notes:        '',
    };
    const items = [{
      medicineId:    selectedMedicine.id,
      medicineName:  selectedMedicine.medicineName || selectedMedicine.name,
      batchNumber:   selectedMedicine.batchNumber || '',
      quantity:      Number(quantity),
      purchasePrice: Number(purchasePrice),
      subtotal:      computedSubtotal,
    }];
    onSubmit({ header, items });
  };

  // ─── Step Renders ─────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div>
      {/* Supplier */}
      <div className="so-form-group">
        <label className="so-label">Supplier *</label>
        <select
          className={`so-select ${step1Errors.supplier ? 'is-invalid' : ''}`}
          value={selectedSupplier}
          onChange={(e) => { setSelectedSupplier(e.target.value); setStep1Errors((p) => ({ ...p, supplier: '' })); }}
        >
          <option value="">— Select Supplier —</option>
          {suppliers.map((s) => (
            <option key={s.id || s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        {step1Errors.supplier && <span className="so-error-text">{step1Errors.supplier}</span>}
      </div>

      {/* Medicine search */}
      <div className="so-form-group">
        <label className="so-label">Medicine / Product *</label>
        <div className="position-relative">
          <input
            type="text"
            className={`so-input ${step1Errors.medicine ? 'is-invalid' : ''}`}
            value={medicineSearch}
            onChange={(e) => handleSearchMedicine(e.target.value)}
            placeholder="Search medicine name, generic name, barcode…"
          />
          <FiSearch
            size={15}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--so-text-muted)' }}
          />
        </div>
        {step1Errors.medicine && <span className="so-error-text">{step1Errors.medicine}</span>}

        {/* Search results dropdown */}
        {medicineResults.length > 0 && (
          <div
            className="bg-white border rounded-3 shadow-sm mt-1"
            style={{ maxHeight: 220, overflowY: 'auto', position: 'relative', zIndex: 10 }}
          >
            {isSearching && (
              <div className="text-center py-2 text-muted small">Searching…</div>
            )}
            {medicineResults.map((med) => (
              <div
                key={med.id}
                className="px-3 py-2 d-flex justify-content-between align-items-center"
                style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.87rem' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = ''}
                onClick={() => handleSelectMedicine(med)}
              >
                <div>
                  <div className="fw-semibold">{med.medicineName || med.name}</div>
                  <div style={{ color: 'var(--so-text-muted)', fontSize: '0.75rem' }}>
                    {med.category} {med.batchNumber ? `• Batch: ${med.batchNumber}` : ''}
                  </div>
                </div>
                <span className={`so-badge ${Number(med.quantity) <= Number(med.minimumStock) ? 'so-badge-warning' : 'so-badge-success'}`}>
                  Stock: {med.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Selected medicine preview */}
        {selectedMedicine && (
          <div className="so-purchase-summary-box mt-2">
            <div className="d-flex align-items-center gap-2 mb-1">
              <FiPackage size={14} className="text-primary" />
              <strong style={{ fontSize: '0.9rem' }}>{selectedMedicine.medicineName || selectedMedicine.name}</strong>
            </div>
            <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.8rem', color: 'var(--so-text-secondary)' }}>
              <span>Current Stock: <strong>{selectedMedicine.quantity}</strong></span>
              <span>Min Stock: <strong>{selectedMedicine.minimumStock}</strong></span>
              <span>Selling Price: <strong>₹{Number(selectedMedicine.sellingPrice || 0).toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      {/* Selected medicine info */}
      <div className="so-purchase-summary-box mb-3">
        <div className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>
          {selectedMedicine?.medicineName || selectedMedicine?.name}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--so-text-secondary)' }}>
          Supplier: {selectedSupplier} &nbsp;|&nbsp; Current Stock: {selectedMedicine?.quantity}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="so-form-group mb-0">
            <label className="so-label">Purchase Quantity *</label>
            <input
              type="number"
              min="1"
              step="1"
              className={`so-input ${step2Errors.quantity ? 'is-invalid' : ''}`}
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setStep2Errors((p) => ({ ...p, quantity: '' })); }}
              placeholder="e.g. 100"
            />
            {step2Errors.quantity && <span className="so-error-text">{step2Errors.quantity}</span>}
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="so-form-group mb-0">
            <label className="so-label">Purchase Price per Unit (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={`so-input ${step2Errors.purchasePrice ? 'is-invalid' : ''}`}
              value={purchasePrice}
              onChange={(e) => { setPurchasePrice(e.target.value); setStep2Errors((p) => ({ ...p, purchasePrice: '' })); }}
              placeholder="e.g. 80.00"
            />
            {step2Errors.purchasePrice && <span className="so-error-text">{step2Errors.purchasePrice}</span>}
          </div>
        </div>
      </div>

      {quantity && purchasePrice && Number(quantity) >= 1 && Number(purchasePrice) > 0 && (
        <div className="mt-3 p-3 rounded-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div className="d-flex justify-content-between">
            <span className="text-secondary" style={{ fontSize: '0.87rem' }}>Subtotal</span>
            <strong style={{ color: 'var(--so-primary-dark)' }}>
              ₹{computedSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h6 className="fw-bold mb-3 text-dark">Purchase Summary</h6>
      <div className="so-purchase-summary-box">
        <div className="so-summary-row">
          <span className="so-summary-label">Supplier</span>
          <span className="so-summary-value">{selectedSupplier}</span>
        </div>
        <div className="so-summary-row">
          <span className="so-summary-label">Medicine</span>
          <span className="so-summary-value">{selectedMedicine?.medicineName || selectedMedicine?.name}</span>
        </div>
        <div className="so-summary-row">
          <span className="so-summary-label">Previous Stock</span>
          <span className="so-summary-value">{selectedMedicine?.quantity} units</span>
        </div>
        <div className="so-summary-row">
          <span className="so-summary-label">Purchase Quantity</span>
          <span className="so-summary-value so-change-positive">+{quantity} units</span>
        </div>
        <div className="so-summary-row">
          <span className="so-summary-label">New Stock (After Purchase)</span>
          <span className="so-summary-value" style={{ color: 'var(--so-success)' }}>
            {Number(selectedMedicine?.quantity || 0) + Number(quantity)} units
          </span>
        </div>
        <div className="so-summary-row">
          <span className="so-summary-label">Unit Price</span>
          <span className="so-summary-value">₹{Number(purchasePrice).toFixed(2)}</span>
        </div>
        <div className="so-summary-row so-summary-total-row">
          <span className="so-summary-label">Total Amount</span>
          <span className="so-summary-value">
            ₹{computedSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      <p className="text-muted small mt-2">
        ⚠️ Once confirmed, the stock will be updated immediately and cannot be undone.
      </p>
    </div>
  );

  return (
    <div>
      <StepIndicator currentStep={step} />

      <div style={{ minHeight: 280 }}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>

      {/* Navigation buttons */}
      <div className="d-flex justify-content-between mt-4 pt-3" style={{ borderTop: '1px solid var(--so-border-light)' }}>
        <div>
          {step > 0 && (
            <button
              type="button"
              className="btn so-btn-secondary d-flex align-items-center gap-2"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <FiChevronLeft size={15} /> Back
            </button>
          )}
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn so-btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          {step < 2 ? (
            <button
              type="button"
              className="btn so-btn-primary d-flex align-items-center gap-2"
              onClick={handleNext}
            >
              Next <FiChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn so-btn-primary d-flex align-items-center gap-2"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Processing…
                </>
              ) : (
                <>
                  <FiCheck size={15} /> Confirm Purchase
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PurchaseForm;
