/**
 * @file        Purchases.jsx
 * @module      SmartOperations
 * @purpose     Purchase management page (List + Create Purchase).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { getPurchases, createPurchase } from '../services/purchaseService';
import { getSuppliers } from '../services/supplierService';
import { searchMedicines } from '../../sales/services/salesService'; // Reuse search logic
import { SO_TOAST, DATE_FILTERS } from '../constants/smartOpsConstants';
import PurchaseForm from '../components/PurchaseForm';
import InventoryHeader from '../../inventory/components/InventoryHeader';
import '../smartOps.css';

function Purchases() {
  const location = useLocation();
  const prefill = location.state || {}; // For prefilling from Reorder Suggestions
  
  const [activeTab, setActiveTab] = useState(prefill.medicine ? 'new' : 'history');
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPurchases({ dateFilter, supplierName: supplierFilter });
      setPurchases(data);
    } catch (err) {
      toast.error('Failed to load purchases.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, supplierFilter]);

  useEffect(() => {
    fetchPurchases();
    getSuppliers().then(setSuppliers).catch(console.error);
  }, [fetchPurchases]);

  const handlePurchaseSubmit = async ({ header, items }) => {
    setIsSubmitting(true);
    try {
      await createPurchase(header, items);
      toast.success(SO_TOAST.PURCHASE_CREATED);
      setActiveTab('history');
      fetchPurchases();
      
      // Clear location state if prefilled
      if (prefill.medicine) {
        window.history.replaceState({}, document.title);
      }
    } catch (err) {
      toast.error(err.message || SO_TOAST.SAVE_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4 so-page-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <InventoryHeader
        title="Purchase Management"
        subtitle="Record new stock purchases and view purchase history."
        breadcrumbs={[{ label: 'Operations', path: '/purchases' }, { label: 'Purchases' }]}
      />

      <div className="so-tab-group mb-4 d-inline-flex">
        <button
          className={`so-tab-btn ${activeTab === 'new' ? 'so-tab-active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New Purchase
        </button>
        <button
          className={`so-tab-btn ${activeTab === 'history' ? 'so-tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Purchase History
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="so-card p-4 mx-auto" style={{ maxWidth: 700 }}>
          <h5 className="fw-bold mb-4">Record New Purchase</h5>
          <PurchaseForm
            suppliers={suppliers}
            onSearchMedicine={searchMedicines}
            onSubmit={handlePurchaseSubmit}
            onCancel={() => setActiveTab('history')}
            isSubmitting={isSubmitting}
            prefillMedicine={prefill.medicine}
            prefillSupplier={prefill.supplier}
          />
        </div>
      ) : (
        <div className="so-card">
          <div className="so-card-header bg-white border-bottom">
            <div className="d-flex gap-3 flex-wrap align-items-center">
              <select className="so-select w-auto" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                {DATE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select className="so-select w-auto" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <option value="ALL">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button className="btn so-btn-secondary ms-auto" onClick={fetchPurchases}>Refresh</button>
            </div>
          </div>
          <div className="so-table-wrapper">
            {isLoading ? (
              <div className="p-5 text-center text-muted">Loading...</div>
            ) : (
              <table className="so-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id}>
                      <td>{p.createdAt ? p.createdAt.toLocaleString() : '-'}</td>
                      <td className="fw-semibold">{p.supplierName}</td>
                      <td className="fw-bold text-dark">₹{Number(p.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><span className="so-badge so-badge-success">{p.status}</span></td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No purchases found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;
