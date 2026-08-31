/**
 * @file        ProfitAnalysis.jsx
 * @module      SmartOperations
 * @purpose     Profit & Margin Analysis page.
 */

import React, { useState, useEffect } from 'react';
import { getProfitAnalysis } from '../services/profitService';
import InventoryHeader from '../../inventory/components/InventoryHeader';
import ProfitCards from '../components/ProfitCards';
import { FiInfo } from 'react-icons/fi';
import '../smartOps.css';

function ProfitAnalysis() {
  const [data, setData] = useState({ kpi: null, products: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getProfitAnalysis();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container-fluid py-4 so-page-container">
      <InventoryHeader
        title="Profit & Margin Analysis"
        subtitle="Analyze revenue, cost, and gross profit margins."
        breadcrumbs={[{ label: 'Operations', path: '/profit-analysis' }, { label: 'Profit Analysis' }]}
      />

      <div className="alert alert-info d-flex align-items-center gap-3 border-0 bg-white shadow-sm mb-4">
        <FiInfo size={24} className="text-info flex-shrink-0" />
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Calculation Note:</strong> Revenue is based on actual selling price at the time of sale. Cost is calculated using the <em>current</em> purchase price of the medicine in inventory. If purchase prices change over time, historical margins may reflect current costs.
        </div>
      </div>

      <ProfitCards kpi={data.kpi} isLoading={isLoading} />

      <div className="so-card mt-2">
        <div className="so-card-header">
          <h5 className="so-card-title">Product-wise Profitability</h5>
        </div>
        <div className="so-table-wrapper">
          {isLoading ? (
            <div className="p-5 text-center text-muted">Loading data...</div>
          ) : (
            <table className="so-table mb-0">
              <thead>
                <tr>
                  <th>Medicine / Product</th>
                  <th className="text-end">Units Sold</th>
                  <th className="text-end">Total Revenue</th>
                  <th className="text-end">Total Cost</th>
                  <th className="text-end">Gross Profit</th>
                  <th className="text-end">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map(p => (
                  <tr key={p.medicineId}>
                    <td className="fw-semibold">{p.medicineName}</td>
                    <td className="text-end">{p.unitsSold}</td>
                    <td className="text-end">₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-end">₹{p.cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-end fw-bold text-success">
                      ₹{p.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-end">
                      <span className={`so-badge ${p.margin >= 20 ? 'so-badge-success' : p.margin > 0 ? 'so-badge-warning' : 'so-badge-danger'}`}>
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {data.products.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No sales data available for profit analysis.</td>
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

export default ProfitAnalysis;
