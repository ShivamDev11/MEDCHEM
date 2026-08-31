/**
 * @file        StockHistory.jsx
 * @module      SmartOperations
 * @purpose     Stock Movement & Purchase History page.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getStockMovements } from '../services/stockMovementService';
import InventoryHeader from '../../inventory/components/InventoryHeader';
import { DATE_FILTERS } from '../constants/smartOpsConstants';
import '../smartOps.css';

function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('7DAYS'); // default to last 7 days for performance
  const [actionFilter, setActionFilter] = useState('ALL');
  const [medicineSearch, setMedicineSearch] = useState('');

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStockMovements({
        dateFilter,
        action: actionFilter,
        medicineName: medicineSearch,
      });
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, actionFilter, medicineSearch]);

  // Use debouncing for medicine search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchMovements]);

  return (
    <div className="container-fluid py-4 so-page-container">
      <InventoryHeader
        title="Stock Movement History"
        subtitle="Track every stock change (Sales and Purchases) across the system."
        breadcrumbs={[{ label: 'Operations', path: '/stock-history' }, { label: 'Stock History' }]}
      />

      <div className="so-card mb-4">
        <div className="so-card-header bg-white">
          <h6 className="mb-0 fw-bold">Filters</h6>
        </div>
        <div className="so-card-body p-3">
          <div className="d-flex gap-3 flex-wrap align-items-center">
            <div className="flex-grow-1" style={{ maxWidth: 300 }}>
              <input
                type="text"
                className="so-input"
                placeholder="Search Medicine..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
              />
            </div>
            <select className="so-select w-auto" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              {DATE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select className="so-select w-auto" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="ALL">All Actions</option>
              <option value="Sale">Sale (Stock Deducted)</option>
              <option value="Purchase">Purchase (Stock Added)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="so-card">
        <div className="so-table-wrapper border-0">
          {isLoading ? (
            <div className="p-5 text-center text-muted">Loading stock history...</div>
          ) : (
            <table className="so-table mb-0">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Medicine / Product</th>
                  <th>Action</th>
                  <th className="text-end">Prev Stock</th>
                  <th className="text-end">Change</th>
                  <th className="text-end">New Stock</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {m.date ? m.date.toLocaleString() : '-'}
                    </td>
                    <td className="fw-semibold">{m.medicineName}</td>
                    <td>
                      <span className={`so-badge ${m.action === 'Purchase' ? 'so-badge-blue' : 'so-badge-warning'}`}>
                        {m.action}
                      </span>
                    </td>
                    <td className="text-end text-muted">{m.previousStock}</td>
                    <td className="text-end fw-bold">
                      <span className={m.change > 0 ? 'so-change-positive' : 'so-change-negative'}>
                        {m.change > 0 ? '+' : ''}{m.change}
                      </span>
                    </td>
                    <td className="text-end fw-bold">{m.newStock}</td>
                    <td className="text-muted small">{m.userId === 'System' ? 'System' : 'Staff'}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No stock movements found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockHistory;
