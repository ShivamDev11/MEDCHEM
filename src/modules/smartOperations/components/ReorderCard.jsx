/**
 * @file        ReorderCard.jsx
 * @module      SmartOperations
 * @purpose     Displays a single reorder suggestion card.
 */

import React from 'react';
import { FiShoppingCart, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

function ReorderCard({ suggestion, onCreatePurchase }) {
  const isOutOfStock = suggestion.currentStock === 0;

  return (
    <div className={`so-reorder-card ${isOutOfStock ? 'so-out-of-stock' : ''}`}>
      <div className="so-reorder-header">
        <div>
          <h3 className="so-reorder-medicine-name">
            {isOutOfStock ? (
              <FiXCircle className="text-danger me-2" size={16} />
            ) : (
              <FiAlertTriangle className="text-warning me-2" size={16} />
            )}
            {suggestion.medicineName}
          </h3>
          <p className="so-reorder-supplier">Supplier: <strong>{suggestion.supplier}</strong></p>
        </div>
        <span className={`so-badge ${isOutOfStock ? 'so-badge-danger' : 'so-badge-warning'}`}>
          {suggestion.stockStatus}
        </span>
      </div>

      <div className="so-reorder-stats">
        <div className="so-reorder-stat-item">
          <div className={`so-reorder-stat-value ${isOutOfStock ? 'so-reorder-current-zero' : 'so-reorder-current-low'}`}>
            {suggestion.currentStock}
          </div>
          <div className="so-reorder-stat-label">Current</div>
        </div>
        <div className="so-reorder-stat-item">
          <div className="so-reorder-stat-value">{suggestion.minimumStock}</div>
          <div className="so-reorder-stat-label">Minimum</div>
        </div>
        <div className="so-reorder-stat-item">
          <div className="so-reorder-stat-value so-reorder-suggested-value">
            {suggestion.suggestedReorder}
          </div>
          <div className="so-reorder-stat-label">Suggested</div>
        </div>
      </div>

      <button
        className="btn so-btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
        onClick={() => onCreatePurchase(suggestion)}
      >
        <FiShoppingCart size={15} />
        Create Purchase
      </button>
    </div>
  );
}

export default ReorderCard;
