/**
 * @file        PaymentMethodChart.jsx
 * @module      Reports
 * @purpose     Payment method breakdown using Bootstrap progress bars.
 *              Shows transaction count and revenue for Cash, UPI, Card.
 */

import { FiCreditCard, FiSmartphone, FiDollarSign } from 'react-icons/fi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

const METHOD_CONFIG = {
  Cash: { icon: FiDollarSign, color: 'success',  label: 'Cash'  },
  UPI:  { icon: FiSmartphone, color: 'primary',  label: 'UPI'   },
  Card: { icon: FiCreditCard, color: 'info',     label: 'Card'  },
};

function PaymentMethodChart({ paymentMethods, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Payment Method Analysis</h6>
          {['Cash', 'UPI', 'Card'].map((m) => (
            <div key={m} className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="placeholder col-3 rounded" />
                <span className="placeholder col-2 rounded" />
              </div>
              <div className="placeholder col-12 rounded" style={{ height: '10px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!paymentMethods) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 text-center text-muted">
          <h6 className="fw-bold mb-2">Payment Method Analysis</h6>
          <p className="mb-0 small">No payment data available.</p>
        </div>
      </div>
    );
  }

  const totalCount   = Object.values(paymentMethods).reduce((s, m) => s + m.count, 0);
  const totalRevenue = Object.values(paymentMethods).reduce((s, m) => s + m.revenue, 0);

  if (totalCount === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 text-center text-muted">
          <h6 className="fw-bold mb-2">Payment Method Analysis</h6>
          <p className="mb-0 small">No sales in the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0">Payment Method Analysis</h6>
            <p className="text-muted small mb-0">
              {totalCount} transaction{totalCount !== 1 ? 's' : ''} · ₹{fmt(totalRevenue)} total
            </p>
          </div>
        </div>

        {Object.entries(METHOD_CONFIG).map(([method, cfg]) => {
          const Icon      = cfg.icon;
          const data      = paymentMethods[method] || { count: 0, revenue: 0 };
          const pct       = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;

          return (
            <div key={method} className="mb-3">
              {/* Label row */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <Icon size={15} className={`text-${cfg.color}`} />
                  <span className="fw-medium small">{cfg.label}</span>
                  <span className="text-muted small">
                    ({data.count} transaction{data.count !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-end">
                  <span className="fw-semibold small">₹{fmt(data.revenue)}</span>
                  <span className="text-muted small ms-2">{pct}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className={`progress-bar bg-${cfg.color}`}
                  style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          );
        })}

        {/* Summary row */}
        <div className="d-flex gap-3 mt-3 pt-2 border-top">
          {Object.entries(METHOD_CONFIG).map(([method, cfg]) => {
            const data = paymentMethods[method] || { count: 0 };
            const pct  = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
            return (
              <div key={method} className="text-center flex-fill">
                <div className={`fw-bold text-${cfg.color}`}>{pct}%</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{method}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodChart;
