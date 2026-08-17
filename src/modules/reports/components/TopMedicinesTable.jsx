/**
 * @file        TopMedicinesTable.jsx
 * @module      Reports
 * @purpose     Table of top-selling medicines sorted by quantity sold (desc).
 *              Data is pre-sorted by calcTopMedicines — no logic here.
 */

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

const RANK_COLORS = ['text-warning', 'text-secondary', 'text-danger'];

function TopMedicinesTable({ topMedicines, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Top Selling Medicines</h6>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>#</th><th>Medicine</th><th>Qty Sold</th><th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td><span className="placeholder col-2 rounded" /></td>
                  <td><span className="placeholder col-8 rounded" /></td>
                  <td><span className="placeholder col-4 rounded" /></td>
                  <td><span className="placeholder col-5 rounded" /></td>
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
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 text-center text-muted">
          <h6 className="fw-bold mb-2">Top Selling Medicines</h6>
          <p className="mb-0 small">No sales data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const displayed = topMedicines.slice(0, 10);

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0">Top Selling Medicines</h6>
            <p className="text-muted small mb-0">Ranked by quantity sold</p>
          </div>
          <span className="badge bg-primary rounded-pill">
            {topMedicines.length} medicine{topMedicines.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Medicine Name</th>
                <th className="text-center">Qty Sold</th>
                <th className="text-end">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((med, i) => (
                <tr key={med.medicineName}>
                  <td>
                    <span className={`fw-bold ${RANK_COLORS[i] || 'text-muted'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="fw-medium">{med.medicineName}</td>
                  <td className="text-center">
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2">
                      {med.quantitySold}
                    </span>
                  </td>
                  <td className="text-end fw-semibold text-success">
                    ₹{fmt(med.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topMedicines.length > 10 && (
          <p className="text-muted small text-end mt-2 mb-0">
            Showing top 10 of {topMedicines.length} medicines
          </p>
        )}
      </div>
    </div>
  );
}

export default TopMedicinesTable;
