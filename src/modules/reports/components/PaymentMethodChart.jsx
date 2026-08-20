/**
 * @file        PaymentMethodChart.jsx
 * @module      Reports
 * @purpose     Payment method breakdown using custom CSS progress bars.
 *              Shows transaction count and revenue for Cash, UPI, Card.
 */

import { FiCreditCard, FiSmartphone, FiDollarSign } from 'react-icons/fi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

const METHOD_CONFIG = {
  Cash: { icon: FiDollarSign, barClass: 'rp-bar-success', iconColor: '#10b981', label: 'Cash'  },
  UPI:  { icon: FiSmartphone, barClass: 'rp-bar-primary', iconColor: '#3b82f6', label: 'UPI'   },
  Card: { icon: FiCreditCard, barClass: 'rp-bar-info',    iconColor: '#06b6d4', label: 'Card'  },
};

function PaymentMethodChart({ paymentMethods, loading }) {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-card-subtitle mb-4">Breakdown by transaction type</p>
          {['Cash', 'UPI', 'Card'].map((m) => (
            <div key={m} className="rp-progress-row">
              <div className="rp-progress-label-row">
                <span className="placeholder rounded" style={{ width: '80px', height: '12px', display: 'inline-block' }} />
                <span className="placeholder rounded" style={{ width: '55px', height: '12px', display: 'inline-block' }} />
              </div>
              <div className="rp-progress">
                <div className="placeholder rp-progress-bar" style={{ width: '60%', background: '#e5e7eb' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!paymentMethods) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💳</div>
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-empty-text mb-0">No payment data available.</p>
        </div>
      </div>
    );
  }

  const totalCount   = Object.values(paymentMethods).reduce((s, m) => s + m.count, 0);
  const totalRevenue = Object.values(paymentMethods).reduce((s, m) => s + m.revenue, 0);

  if (totalCount === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💳</div>
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-empty-text mb-0">No sales in the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="mb-4">
          <p className="rp-card-title mb-0">Payment Method Analysis</p>
          <p className="rp-card-subtitle">
            {totalCount} transaction{totalCount !== 1 ? 's' : ''} · ₹{fmt(totalRevenue)} total
          </p>
        </div>

        {/* Progress rows */}
        {Object.entries(METHOD_CONFIG).map(([method, cfg]) => {
          const Icon = cfg.icon;
          const data = paymentMethods[method] || { count: 0, revenue: 0 };
          const pct  = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;

          return (
            <div key={method} className="rp-progress-row">
              <div className="rp-progress-label-row">
                <span className="rp-progress-name">
                  <Icon size={14} style={{ color: cfg.iconColor }} />
                  {cfg.label}
                  <span className="rp-progress-meta">
                    ({data.count} txn{data.count !== 1 ? 's' : ''})
                  </span>
                </span>
                <span className="rp-progress-right">
                  <span className="rp-progress-value">₹{fmt(data.revenue)}</span>
                  <span className="rp-progress-pct">{pct}%</span>
                </span>
              </div>
              <div className="rp-progress">
                <div
                  className={`rp-progress-bar ${cfg.barClass}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          );
        })}

        {/* Summary footer */}
        <div className="rp-pay-summary">
          {Object.entries(METHOD_CONFIG).map(([method, cfg]) => {
            const data = paymentMethods[method] || { count: 0 };
            const pct  = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
            return (
              <div key={method} className="rp-pay-summary-item">
                <div className="rp-pay-pct" style={{ color: cfg.iconColor }}>{pct}%</div>
                <div className="rp-pay-name">{method}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodChart;
