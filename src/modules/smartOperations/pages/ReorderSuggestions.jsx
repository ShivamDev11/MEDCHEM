/**
 * @file        ReorderSuggestions.jsx
 * @module      SmartOperations
 * @purpose     Displays smart reorder suggestions based on minimumStock rule.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReorderSuggestions } from '../services/reorderService';
import InventoryHeader from '../../inventory/components/InventoryHeader';
import ReorderCard from '../components/ReorderCard';
import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import '../smartOps.css';

function ReorderSuggestions() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const data = await getReorderSuggestions();
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleCreatePurchase = (suggestion) => {
    // Navigate to Purchases tab and pre-fill form
    navigate('/purchases', { state: { medicine: suggestion, supplier: suggestion.supplier !== 'Not Specified' ? suggestion.supplier : null } });
  };

  return (
    <div className="container-fluid py-4 so-page-container">
      <InventoryHeader
        title="Smart Reorder Suggestions"
        subtitle="Medicines below minimum stock level that require immediate purchase."
        breadcrumbs={[{ label: 'Operations', path: '/reorder' }, { label: 'Reorder' }]}
      />

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0">Items to Reorder ({suggestions.length})</h5>
        <button className="btn so-btn-secondary d-flex align-items-center gap-2" onClick={fetchSuggestions}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="p-5 text-center text-muted">Loading suggestions...</div>
      ) : suggestions.length === 0 ? (
        <div className="so-card so-empty-state mx-auto" style={{ maxWidth: 600 }}>
          <div className="so-empty-icon-wrap" style={{ background: 'var(--so-success-light)', color: 'var(--so-success)' }}>
            <FiCheckCircle size={32} />
          </div>
          <h4 className="fw-bold text-dark">Stock Levels Optimal</h4>
          <p className="text-muted">No medicines are currently below their minimum stock threshold.</p>
        </div>
      ) : (
        <div className="row g-4">
          {suggestions.map(s => (
            <div key={s.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <ReorderCard suggestion={s} onCreatePurchase={handleCreatePurchase} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReorderSuggestions;
