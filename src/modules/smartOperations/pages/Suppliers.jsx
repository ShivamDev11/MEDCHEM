import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { FiRefreshCw } from 'react-icons/fi';

import { getSuppliers, createSupplier, updateSupplier, softDeleteSupplier, syncSuppliersFromMedicines } from '../services/supplierService';
import { getPurchaseSummaryBySupplier } from '../services/purchaseService';
import { SO_TOAST } from '../constants/smartOpsConstants';
import SupplierForm from '../components/SupplierForm';
import SupplierTable from '../components/SupplierTable';
import InventoryHeader from '../../inventory/components/InventoryHeader'; // Reuse header
import '../smartOps.css';

function Suppliers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form'
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active suppliers
      const data = await getSuppliers();
      // Fetch purchase summary to enrich list
      const purchaseMap = await getPurchaseSummaryBySupplier();
      
      const enriched = data.map(s => {
        const key = (s.name || '').toLowerCase();
        const pInfo = purchaseMap[key] || {};
        return {
          ...s,
          totalPurchaseAmount: pInfo.totalAmount || 0,
        };
      });
      setSuppliers(enriched);
    } catch (err) {
      toast.error(SO_TOAST.LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAddClick = () => {
    setEditingSupplier(null);
    setActiveTab('form');
  };

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setActiveTab('form');
  };

  const handleCancelForm = () => {
    setEditingSupplier(null);
    setActiveTab('list');
  };

  const handleFormSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success(SO_TOAST.SUPPLIER_UPDATED);
      } else {
        await createSupplier(formData);
        toast.success(SO_TOAST.SUPPLIER_ADDED);
      }
      setActiveTab('list');
      fetchSuppliers();
    } catch (err) {
      if (err.code === 'DUPLICATE') {
        toast.error(SO_TOAST.DUPLICATE_SUPPLIER);
      } else {
        toast.error(SO_TOAST.SAVE_ERROR);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove supplier "${name}"?`)) return;
    try {
      await softDeleteSupplier(id);
      toast.success(SO_TOAST.SUPPLIER_DELETED);
      fetchSuppliers();
    } catch (err) {
      toast.error(SO_TOAST.DELETE_ERROR);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const addedCount = await syncSuppliersFromMedicines();
      if (addedCount > 0) {
        toast.success(`Successfully imported ${addedCount} new suppliers from inventory.`);
        fetchSuppliers();
      } else {
        toast.info('No new suppliers found to import. All are up to date.');
      }
    } catch (err) {
      toast.error('Failed to sync suppliers: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container-fluid py-4 so-page-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <InventoryHeader
        title="Supplier Management"
        subtitle="Manage pharmacy suppliers and distributors."
        breadcrumbs={[{ label: 'Operations', path: '/suppliers' }, { label: 'Suppliers' }]}
      />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="so-tab-group">
          <button
            className={`so-tab-btn ${activeTab === 'list' ? 'so-tab-active' : ''}`}
            onClick={() => { setActiveTab('list'); setEditingSupplier(null); }}
          >
            Supplier List
          </button>
          <button
            className={`so-tab-btn ${activeTab === 'form' ? 'so-tab-active' : ''}`}
            onClick={handleAddClick}
          >
            {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
          </button>
        </div>
        
        {activeTab === 'list' && (
          <button
            className="btn so-btn-secondary d-flex align-items-center gap-2"
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            title="Import existing suppliers from medicine records"
          >
            {isSyncing ? (
              <span className="spinner-border spinner-border-sm" role="status" />
            ) : (
              <FiRefreshCw size={14} />
            )}
            Sync from Inventory
          </button>
        )}
      </div>

      {activeTab === 'list' ? (
        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoading}
          onViewDetails={(id) => navigate(`/suppliers/${id}`)}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      ) : (
        <div className="so-card p-4 mx-auto" style={{ maxWidth: 800 }}>
          <h4 className="fw-bold mb-4">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h4>
          <SupplierForm
            initialData={editingSupplier}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}

export default Suppliers;
