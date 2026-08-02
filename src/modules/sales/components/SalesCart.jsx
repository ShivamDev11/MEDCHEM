import React from 'react';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';

const SalesCart = ({ cart, updateQuantity, removeFromCart }) => {
  if (!cart || cart.length === 0) {
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-body text-center py-5 text-muted">
          <FaShoppingCart className="fs-1 mb-3 opacity-25" />
          <h5>Cart is Empty</h5>
          <p className="mb-0">Search and select medicines to add them to the cart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover table-striped mb-0 align-middle">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">Medicine Name</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th className="text-end">Unit Price</th>
                <th className="text-center" style={{ width: '150px' }}>Quantity</th>
                <th className="text-end">Subtotal</th>
                <th className="text-center pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => {
                const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
                const availableStock = item.currentStock ?? item.quantity ?? 0;
                const displayName = item.medicineName || item.name;
                
                return (
                  <tr key={item.id || index}>
                    <td className="ps-4 fw-bold text-primary">{displayName}</td>
                    <td><small className="text-muted">{item.batchNumber || 'N/A'}</small></td>
                    <td><small className="text-muted">{expiryDate}</small></td>
                    <td className="text-end">₹{Number(item.sellingPrice).toFixed(2)}</td>
                    <td className="text-center">
                      <div className="input-group input-group-sm w-100">
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          className="form-control text-center" 
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          max={availableStock}
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= availableStock}
                        >
                          +
                        </button>
                      </div>
                      {item.quantity >= availableStock && (
                        <div className="text-danger small mt-1" style={{ fontSize: '0.7rem' }}>
                          Max stock reached
                        </div>
                      )}
                    </td>
                    <td className="text-end fw-bold">₹{item.subtotal.toFixed(2)}</td>
                    <td className="text-center pe-4">
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => removeFromCart(item.id)}
                        title="Remove from Cart"
                      >
                        <FaTrash />
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
