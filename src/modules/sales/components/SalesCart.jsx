import React from 'react';
import { FiTrash2, FiShoppingCart } from 'react-icons/fi';

const SalesCart = ({ cart, updateQuantity, removeFromCart }) => {
  if (!cart || cart.length === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body text-center py-5 text-muted">
          <div className="d-flex justify-content-center mb-3">
            <div className="p-3 bg-light rounded-circle text-secondary opacity-50" style={{ width: "64px", height: "64px", display: "flex", alignItems: "center", justify: "center" }}>
              <FiShoppingCart size={28} />
            </div>
          </div>
          <h5 className="fw-bold text-dark mb-1">POS Cart is Empty</h5>
          <p className="mb-0 small text-secondary">Search and select medicines to add items to this sale invoice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card sales-cart-card border-0 mb-4">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table sales-cart-table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="ps-4">Medicine Description</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th className="text-end">Unit Price</th>
                <th className="text-center" style={{ width: '160px' }}>Quantity</th>
                <th className="text-end">Subtotal</th>
                <th className="text-center pe-4">Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => {
                const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("en-GB") : 'N/A';
                const availableStock = item.currentStock ?? item.quantity ?? 0;
                const displayName = item.medicineName || item.name;
                
                return (
                  <tr key={item.id || index}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{displayName}</div>
                      <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
                        {item.genericName || "Generic Formulation"}
                      </div>
                    </td>
                    <td>
                      <span className="font-monospace text-secondary" style={{ fontSize: "0.82rem" }}>
                        {item.batchNumber || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
                        {expiryDate}
                      </span>
                    </td>
                    <td className="text-end fw-semibold text-dark">
                      ₹{Number(item.sellingPrice).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <div className="sales-qty-group">
                        <button 
                          className="sales-qty-btn" 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          className="form-control sales-qty-input" 
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          max={availableStock}
                        />
                        <button 
                          className="sales-qty-btn" 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= availableStock}
                        >
                          +
                        </button>
                      </div>
                      {item.quantity >= availableStock && (
                        <div className="text-danger small mt-1" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                          Stock limit reached
                        </div>
                      )}
                    </td>
                    <td className="text-end fw-bold text-dark">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                    <td className="text-center pe-4">
                      <button 
                        type="button"
                        className="btn btn-sm sales-btn-delete" 
                        onClick={() => removeFromCart(item.id)}
                        title="Remove from Cart"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesCart;
