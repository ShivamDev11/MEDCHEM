/**
 * @file        SupplierDetails.jsx
 * @module      SmartOperations
 * @purpose     View supplier details, their medicines, low stock, and purchase history.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { getSupplierById, getSupplierStats } from '../services/supplierService';
import { getPurchasesForSupplier } from '../services/purchaseService';
import InventoryHeader from '../../inventory/components/InventoryHeader';
import '../smartOps.css';

function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const sup = await getSupplierById(id);
        if (sup) {
          setSupplier(sup);
          const p = await getPurchasesForSupplier(sup.name);
          setPurchases(p);
          
          const totalAmount = p.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
          const lastDate = p.length > 0 ? p[0].createdAt : null;
          
          const s = await getSupplierStats(sup, { [sup.name.toLowerCase()]: { totalAmount, lastDate } });
          setStats(s);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (isLoading) {
    return <div className="p-5 text-center">Loading supplier details...</div>;
  }

  if (!supplier) {
    return <div className="p-5 text-center text-danger">Supplier not found.</div>;
  }

  return (
    <div className="container-fluid py-4 so-page-container">
      <InventoryHeader
        title={supplier.name}
        subtitle="Supplier Profile & Statistics"
        breadcrumbs={[
          { label: 'Operations', path: '/suppliers' },
          { label: 'Suppliers', path: '/suppliers' },
          { label: supplier.name }
        ]}
      />

      <div className="mb-4">
        <button className="btn so-btn-secondary d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Suppliers
        </button>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-xl-4">
          <div className="so-card h-100">
            <div className="so-card-header">
              <h5 className="so-card-title">Supplier Information</h5>
            </div>
            <div className="so-card-body">
              <p className="mb-2 text-muted small text-uppercase">Contact</p>
              <p className="fw-semibold">{supplier.contactNumber || 'N/A'}</p>
              
              <p className="mb-2 text-muted small text-uppercase mt-3">Email</p>
              <p className="fw-semibold">{supplier.email || 'N/A'}</p>
              
              <p className="mb-2 text-muted small text-uppercase mt-3">Address</p>
              <p className="fw-semibold">{supplier.address || 'N/A'}</p>
              
              <p className="mb-2 text-muted small text-uppercase mt-3">Status</p>
              <span className={`so-badge ${supplier.status === 'ACTIVE' ? 'so-badge-success' : 'so-badge-secondary'}`}>
                {supplier.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="col-12 col-xl-8">
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-md-4">
              <div className="so-stat-card so-stat-blue">
                <div className="so-stat-icon-wrap"><FiPackage size={20} /></div>
                <div className="so-stat-value">{stats?.totalProducts || 0}</div>
                <div className="so-stat-label">Products Supplied</div>
              </div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="so-stat-card so-stat-orange">
                <div className="so-stat-icon-wrap"><FiAlertTriangle size={20} /></div>
                <div className="so-stat-value">{stats?.lowStockProducts || 0}</div>
                <div className="so-stat-label">Low Stock Products</div>
              </div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="so-stat-card so-stat-green">
                <div className="so-stat-icon-wrap"><FiDollarSign size={20} /></div>
                <div className="so-stat-value">₹{(stats?.totalPurchaseAmount || 0).toLocaleString()}</div>
                <div className="so-stat-label">Total Purchased</div>
              </div>
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="so-card">
            <div className="so-card-header">
              <h5 className="so-card-title">Recent Purchases</h5>
            </div>
            <div className="so-table-wrapper border-0">
              <table className="so-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>{p.createdAt ? p.createdAt.toLocaleDateString() : '-'}</td>
                      <td className="fw-semibold">₹{Number(p.totalAmount || 0).toFixed(2)}</td>
                      <td><span className="so-badge so-badge-success">{p.status}</span></td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">No purchases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierDetails;
