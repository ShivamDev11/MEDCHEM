import React, { useState } from 'react';
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
    // Reset form after attempting (the parent will clear cart if successful)
    setCustomerName('');
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title text-primary mb-4 border-bottom pb-2">Sale Summary & Checkout</h5>
        
        <div className="row mb-4">
          <div className="col-6">
            <p className="text-muted mb-1">Subtotal:</p>
            <h5 className="mb-0">₹{totals.subtotal.toFixed(2)}</h5>
          </div>
          <div className="col-6 text-end">
            <p className="text-muted mb-1">Discount:</p>
            <h5 className="mb-0 text-success">-₹{totals.discountAmount.toFixed(2)}</h5>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-6">
            <p className="text-muted mb-1">Tax:</p>
            <h5 className="mb-0 text-danger">+₹{totals.taxAmount.toFixed(2)}</h5>
          </div>
          <div className="col-6 text-end">
            <p className="text-muted mb-1">Grand Total:</p>
            <h3 className="mb-0 text-primary fw-bold">₹{totals.grandTotal.toFixed(2)}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small fw-bold">Customer Name (Optional)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isProcessing || cartLength === 0}
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small fw-bold">Payment Method</label>
            <select 
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={isProcessing || cartLength === 0}
            >
              {Object.values(PAYMENT_METHODS).map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-bold fs-5 shadow-sm"
            disabled={isProcessing || cartLength === 0}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing Sale...
              </>
            ) : (
              'Complete Sale'
            )}
          </button>
        </form>
      </div>

      {/* Bootstrap Modal for Confirmation */}
      {showConfirm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold">Confirm Sale</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirm(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="fs-5 text-center mb-0">
                  Are you sure you want to complete this sale for 
                  <strong className="text-primary d-block mt-2 fs-2">₹{totals.grandTotal.toFixed(2)}</strong>
                </p>
                <div className="text-center mt-3 text-muted">
                  <small>Payment Method: <strong>{paymentMethod}</strong></small>
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={confirmSale}>Confirm & Print</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleForm;
