import React from 'react';
import { formatInvoiceDate } from '../utils/invoiceGenerator';
import { FaPrint, FaTimes } from 'react-icons/fa';

const Invoice = ({ show, onClose, saleDetails, cartItems }) => {
  if (!show || !saleDetails) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal d-block invoice-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          {/* Header - Hidden during print */}
          <div className="modal-header bg-light border-bottom d-print-none">
            <h5 className="modal-title fw-bold text-primary">Invoice Generated Successfully</h5>
            <div>
              <button className="btn btn-outline-primary me-2" onClick={handlePrint}>
                <FaPrint className="me-2" /> Print
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                <FaTimes /> Close
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div className="modal-body p-5 bg-white" id="printable-invoice">
            {/* Pharmacy Header */}
            <div className="text-center mb-5 border-bottom pb-4">
              <h1 className="fw-bold text-primary mb-1">MedChem Pharmacy</h1>
              <p className="text-muted mb-0">123 Health Avenue, Medical District, City - 400001</p>
              <p className="text-muted mb-0">Phone: +91 98765 43210 | Email: contact@medchem.com</p>
              <p className="text-muted fw-bold">GSTIN: 27AAAAA0000A1Z5</p>
            </div>

            {/* Invoice Details */}
            <div className="row mb-4">
              <div className="col-sm-6">
                <h6 className="text-muted mb-1 text-uppercase small fw-bold">Billed To:</h6>
                <h5 className="fw-bold mb-1">{saleDetails.customerName || 'Walk-in Customer'}</h5>
                <p className="text-muted mb-0">Payment Method: <strong>{saleDetails.paymentMethod}</strong></p>
              </div>
              <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
                <h6 className="text-muted mb-1 text-uppercase small fw-bold">Invoice Details:</h6>
                <h5 className="fw-bold text-primary mb-1">{saleDetails.invoiceNumber}</h5>
                <p className="text-muted mb-0">Date: {formatInvoiceDate(saleDetails.date || new Date())}</p>
                <p className="text-muted mb-0">Status: <span className="badge bg-success">{saleDetails.status}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <div className="table-responsive mb-4">
              <table className="table table-bordered mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="py-3">Sl No.</th>
                    <th className="py-3">Medicine Description</th>
                    <th className="py-3 text-center">Batch No</th>
                    <th className="py-3 text-end">Unit Price</th>
                    <th className="py-3 text-center">Qty</th>
                    <th className="py-3 text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="text-center text-muted">{index + 1}</td>
                      <td className="fw-bold">
                        {item.name || item.medicineName}
                        <div className="small text-muted fw-normal">Expiry: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="text-center text-muted">{item.batchNumber || 'N/A'}</td>
                      <td className="text-end">₹{Number(item.sellingPrice || item.unitPrice).toFixed(2)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end fw-bold">₹{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="row justify-content-end">
              <div className="col-sm-6 col-md-5">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted">Subtotal</td>
                      <td className="text-end fw-bold">₹{Number(saleDetails.subtotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Discount</td>
                      <td className="text-end text-success fw-bold">-₹{Number(saleDetails.discount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted border-bottom pb-2">Tax Amount</td>
                      <td className="text-end border-bottom pb-2">₹{Number(saleDetails.tax).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="fs-5 text-primary fw-bold pt-3">Grand Total</td>
                      <td className="text-end fs-4 text-primary fw-bold pt-3">₹{Number(saleDetails.netAmount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-5 pt-4 border-top">
              <p className="fw-bold text-muted mb-1">Thank you for your business!</p>
              <p className="small text-muted mb-0">Goods once sold cannot be returned without a valid receipt.</p>
              <p className="small text-muted">Subject to City Jurisdiction.</p>
            </div>
            
            {/* Signature Area */}
            <div className="d-flex justify-content-between mt-5 pt-5 px-4">
              <div className="text-center border-top border-dark pt-2" style={{ width: '200px' }}>
                <small className="text-muted fw-bold">Customer Signature</small>
              </div>
              <div className="text-center border-top border-dark pt-2" style={{ width: '200px' }}>
                <small className="text-muted fw-bold">Authorized Signatory</small>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* 
        This style block handles the print layout directly inside the component.
        It hides everything except the modal body when printing.
      */}
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
