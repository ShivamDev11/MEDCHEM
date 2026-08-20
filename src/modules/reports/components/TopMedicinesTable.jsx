/**
 * @file        TopMedicinesTable.jsx
 * @module      Reports
 * @purpose     Table of top-selling medicines sorted by quantity sold (desc).
 *              Data is pre-sorted by calcTopMedicines — no logic here.
 */

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

function getRankClass(i) {
  if (i === 0) return 'rp-rank-1';
  if (i === 1) return 'rp-rank-2';
  if (i === 2) return 'rp-rank-3';
  return 'rp-rank-n';
}

function TopMedicinesTable({ topMedicines, loading }) {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-3">Top Selling Medicines</p>
          <table className="rp-table">
            <thead>
              <tr>
                <th>#</th><th>Medicine Name</th><th className="text-center">Qty Sold</th><th className="text-end">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td><span className="placeholder rounded" style={{ width: '24px', height: '24px', display: 'inline-block' }} /></td>
                  <td><span className="placeholder rounded" style={{ width: '70%', height: '14px', display: 'inline-block' }} /></td>
                  <td className="text-center"><span className="placeholder rounded" style={{ width: '40px', height: '14px', display: 'inline-block' }} /></td>
                  <td className="text-end"><span className="placeholder rounded" style={{ width: '55px', height: '14px', display: 'inline-block' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!topMedicines || topMedicines.length === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💊</div>
          <p className="rp-card-title mb-1">Top Selling Medicines</p>
          <p className="rp-empty-text mb-0">No sales data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const displayed = topMedicines.slice(0, 10);

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <p className="rp-card-title mb-0">Top Selling Medicines</p>
            <p className="rp-card-subtitle">Ranked by quantity sold</p>
          </div>
          <span
            className="badge rounded-pill"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px' }}
          >
            {topMedicines.length} medicine{topMedicines.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-responsive">
          <table className="rp-table">
            <thead>
              <tr>
                <th style={{ width: '44px' }}>#</th>
                <th>Medicine Name</th>
                <th className="text-center">Qty Sold</th>
                <th className="text-end">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((med, i) => (
                <tr key={med.medicineName}>
                  <td>
                    <span className={`rp-rank-badge ${getRankClass(i)}`}>{i + 1}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{med.medicineName}</td>
                  <td className="text-center">
                    <span className="rp-qty-pill">{med.quantitySold}</span>
                  </td>
                  <td className="text-end rp-revenue-val">₹{fmt(med.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topMedicines.length > 10 && (
          <p className="mb-0 mt-2 text-end" style={{ fontSize: '0.73rem', color: '#6b7280' }}>
            Showing top 10 of {topMedicines.length} medicines
          </p>
        )}
      </div>
    </div>
  );
}

export default TopMedicinesTable;
