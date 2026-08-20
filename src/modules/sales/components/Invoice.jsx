import React from 'react';
import { formatInvoiceDate } from '../utils/invoiceGenerator';
import { FiPrinter, FiX, FiActivity } from 'react-icons/fi';

const Invoice = ({ show, onClose, saleDetails, cartItems }) => {
  if (!show || !saleDetails) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal d-block invoice-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "14px" }}>
          
          {/* Header - Hidden during print */}
          <div className="modal-header bg-white border-bottom px-4 py-3 d-print-none d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "1rem" }}>
              <div className="p-1 bg-success-subtle text-success rounded-circle" style={{ display: "inline-flex" }}>
                <FiActivity size={14} />
              </div>
              <span>Invoice Generated Successfully</span>
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 fw-bold" onClick={handlePrint}>
                <FiPrinter size={13} />
                <span>Print Invoice</span>
              </button>
              <button type="button" className="btn btn-sm btn-light border d-flex align-items-center gap-1" onClick={onClose}>
                <FiX size={13} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div className="modal-body p-5 bg-white" id="printable-invoice">
            
            {/* Pharmacy Header */}
            <div className="text-center mb-5 pb-4 border-bottom invoice-print-header">
              <h2 className="fw-extrabold text-primary mb-1 d-flex align-items-center justify-content-center gap-2" style={{ letterSpacing: "-0.03em" }}>
                <FiActivity size={24} />
                <span>MedChem Pharmacy</span>
              </h2>
              <p className="text-muted small mb-0 fw-medium">123 Health Avenue, Medical District, City - 400001</p>
              <p className="text-muted small mb-0 fw-medium">Phone: +91 98765 43210 | Email: billing@medchem.com</p>
              <p className="text-secondary small fw-bold mt-1 mb-0">GSTIN: 27AAAAA0000A1Z5</p>
            </div>

            {/* Invoice Details info row */}
            <div className="row mb-4" style={{ fontSize: "0.875rem" }}>
              <div className="col-6">
                <h6 className="text-muted mb-1.5 text-uppercase small fw-bold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>Billed To:</h6>
                <h5 className="fw-bold text-dark mb-1">{saleDetails.customerName || 'Walk-in Customer'}</h5>
                <p className="text-secondary mb-0">Payment Method: <strong>{saleDetails.paymentMethod}</strong></p>
              </div>
              <div className="col-6 text-end">
                <h6 className="text-muted mb-1.5 text-uppercase small fw-bold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>Invoice Info:</h6>
                <h5 className="fw-bold text-primary mb-1">{saleDetails.invoiceNumber}</h5>
                <p className="text-secondary mb-0">Date: {formatInvoiceDate(saleDetails.date || new Date())}</p>
                <div className="mt-1">
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 fw-bold" style={{ fontSize: "0.75rem" }}>
                    {saleDetails.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="table-responsive mb-4 border rounded">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light invoice-table-header">
                  <tr>
                    <th className="py-2.5 text-center text-secondary small" style={{ width: "60px" }}>Sl No.</th>
                    <th className="py-2.5 text-secondary small">Medicine Description</th>
                    <th className="py-2.5 text-center text-secondary small">Batch No</th>
                    <th className="py-2.5 text-end text-secondary small">Unit Price</th>
                    <th className="py-2.5 text-center text-secondary small" style={{ width: "70px" }}>Qty</th>
                    <th className="py-2.5 text-end text-secondary small">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="text-center text-muted">{index + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.name || item.medicineName}</div>
                        <div className="small text-muted" style={{ fontSize: "0.75rem" }}>Expiry: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("en-GB") : 'N/A'}</div>
                      </td>
                      <td className="text-center text-secondary font-monospace">{item.batchNumber || '—'}</td>
                      <td className="text-end">₹{Number(item.sellingPrice || item.unitPrice).toFixed(2)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end fw-bold text-dark">₹{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="row justify-content-end mb-4">
              <div className="col-6 col-md-5">
                <table className="table table-sm table-borderless mb-0" style={{ fontSize: "0.875rem" }}>
                  <tbody>
                    <tr>
                      <td className="text-muted py-1">Subtotal</td>
                      <td className="text-end fw-bold text-dark py-1">₹{Number(saleDetails.subtotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted py-1">Discount</td>
                      <td className="text-end text-success fw-bold py-1">-₹{Number(saleDetails.discount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted py-1 border-bottom pb-2">Tax Amount</td>
                      <td className="text-end text-danger py-1 border-bottom pb-2">+₹{Number(saleDetails.tax).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-dark fw-bold pt-3" style={{ fontSize: "1rem" }}>Grand Total</td>
                      <td className="text-end text-primary fw-extrabold pt-3" style={{ fontSize: "1.25rem" }}>₹{Number(saleDetails.netAmount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Rules */}
            <div className="text-center mt-5 pt-4 border-top text-muted" style={{ fontSize: "0.78rem" }}>
              <p className="fw-bold text-dark mb-1">Thank you for choosing MedChem!</p>
              <p className="mb-0">Goods once sold cannot be returned without a valid invoice receipt.</p>
              <p className="mb-0">Subject to local City Jurisdiction.</p>
            </div>
            
            {/* Signature Area */}
            <div className="d-flex justify-content-between mt-5 pt-4">
              <div className="text-center">
                <div className="invoice-signature-line" />
                <small className="text-secondary fw-bold" style={{ fontSize: "0.75rem" }}>Customer Signature</small>
              </div>
              <div className="text-center">
                <div className="invoice-signature-line" />
                <small className="text-secondary fw-bold" style={{ fontSize: "0.75rem" }}>Authorized Signatory</small>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            min-height: 550px;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default Invoice;
