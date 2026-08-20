import React, { useState } from 'react';
import { FiCheckCircle, FiUser, FiCreditCard } from 'react-icons/fi';
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from '../constants/salesConstants';

const SaleForm = ({ totals, onCompleteSale, isProcessing, cartLength }) => {
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartLength === 0) return;
    setShowConfirm(true);
  };

  const confirmSale = () => {
    setShowConfirm(false);
    onCompleteSale(paymentMethod, customerName);
    setCustomerName('');
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
  };

  return (
    <div className="card sales-checkout-card border-0 mb-4">
      <div className="card-body p-4">
        <h5 className="card-title text-dark fw-bold mb-4 pb-2 border-bottom" style={{ fontSize: "1.05rem" }}>
          Sale Summary & Checkout
        </h5>
        
        {/* Financial calculations */}
        <div className="sales-summary-row mb-3">
          <span className="sales-summary-label">Subtotal</span>
          <span className="sales-summary-val text-dark">₹{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="sales-summary-row mb-3">
          <span className="sales-summary-label">Discount</span>
          <span className="sales-summary-val text-success">-₹{totals.discountAmount.toFixed(2)}</span>
        </div>
        <div className="sales-summary-row mb-3">
          <span className="sales-summary-label">Tax Amount</span>
          <span className="sales-summary-val text-danger">+₹{totals.taxAmount.toFixed(2)}</span>
        </div>
        
        <div className="sales-summary-divider" />
        
        <div className="sales-summary-row mb-4">
          <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>Grand Total</span>
          <span className="fw-extrabold text-primary" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            ₹{totals.grandTotal.toFixed(2)}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="mb-3">
            <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: "0.82rem" }}>
              Customer Name <span className="text-muted fw-normal">(Optional)</span>
            </label>
            <div className="input-group sales-search-input-group" style={{ background: "#f8fafc" }}>
              <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                <FiUser size={14} />
              </span>
              <input 
                type="text" 
                className="form-control sales-search-input py-2" 
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isProcessing || cartLength === 0}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: "0.82rem" }}>
              Payment Method
            </label>
            <div className="input-group sales-search-input-group" style={{ background: "#f8fafc" }}>
              <span className="input-group-text border-0 bg-transparent text-muted pe-1">
                <FiCreditCard size={14} />
              </span>
              <select 
                className="form-select sales-search-input py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isProcessing || cartLength === 0}
                style={{ cursor: "pointer" }}
              >
                {Object.values(PAYMENT_METHODS).map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn inv-btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
            disabled={isProcessing || cartLength === 0}
            style={{ fontSize: "0.95rem" }}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Processing Sale...</span>
              </>
            ) : (
              <>
                <FiCheckCircle size={16} />
                <span>Complete Sale</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "14px" }}>
              <div className="modal-body p-4 text-center">
                <div className="d-flex justify-content-center mb-3">
                  <div className="p-3 bg-primary-subtle text-primary rounded-circle" style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justify: "center" }}>
                    <FiCheckCircle size={28} />
                  </div>
                </div>
                <h5 className="fw-bold text-dark mb-2">Confirm Sale Transaction</h5>
                <p className="text-secondary small mb-4">
                  Please confirm to deduct stock items and complete the transaction.
                </p>
                <div className="p-3 bg-light rounded border text-start mb-4" style={{ fontSize: "0.85rem" }}>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted">Total Due:</span>
                    <strong className="text-dark">₹{totals.grandTotal.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment:</span>
                    <strong className="text-dark">{paymentMethod}</strong>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-light border w-100 fw-bold py-2" 
                    onClick={() => setShowConfirm(false)}
                    style={{ fontSize: "0.875rem" }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn inv-btn-primary w-100 fw-bold py-2" 
                    onClick={confirmSale}
                    style={{ fontSize: "0.875rem" }}
                  >
                    Confirm & Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleForm;
