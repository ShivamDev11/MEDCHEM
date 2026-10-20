/**
 * @file        PaymentMethodChart.jsx
 * @module      Reports
 * @purpose     Interactive Donut chart for payment method distribution (Cash, UPI, Card).
 *              Powered by Recharts PieChart. Supports clicking slices to cross-filter sales.
 */

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { FiX, FiCheck } from 'react-icons/fi';
import { PAYMENT_COLORS } from '../constants/reportsConstants';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label" style={{ color: data.color }}>{data.name}</p>
        <p className="item">
          Revenue: <span>₹{fmt(data.revenue)}</span> ({data.pct}%)
        </p>
        <p className="item">
          Transactions: <span>{data.count}</span>
        </p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click to cross-filter sales
        </small>
      </div>
    );
  }
  return null;
};

const PaymentMethodChart = ({
  paymentMethods,
  loading,
  selectedPaymentMethod,
  onSelectPayment,
  onClearPayment,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4 h-100">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-card-subtitle mb-3">Loading payment channels...</p>
          <div className="placeholder rounded-circle mx-auto my-3" style={{ width: '160px', height: '160px' }} />
        </div>
      </div>
    );
  }

  if (!paymentMethods) {
    return (
      <div className="rp-card mb-4 h-100">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💳</div>
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-empty-text mb-0">No payment records available.</p>
        </div>
      </div>
    );
  }

  const totalCount = Object.values(paymentMethods).reduce((s, m) => s + m.count, 0);
  const totalRevenue = Object.values(paymentMethods).reduce((s, m) => s + m.revenue, 0);

  if (totalCount === 0) {
    return (
      <div className="rp-card mb-4 h-100">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💳</div>
          <p className="rp-card-title mb-1">Payment Method Analysis</p>
          <p className="rp-empty-text mb-0">No sales transactions in selected period.</p>
        </div>
      </div>
    );
  }

  // Format data for Recharts Pie
  const chartData = Object.entries(paymentMethods).map(([name, data]) => ({
    name,
    value: data.revenue,
    revenue: data.revenue,
    count: data.count,
    pct: data.revenuePct || 0,
    color: PAYMENT_COLORS[name] || '#6b7280',
  }));

  const handleSliceClick = (entry) => {
    if (entry && entry.name && onSelectPayment) {
      onSelectPayment(entry.name);
    }
  };

  return (
    <div className="rp-card mb-4 h-100 d-flex flex-column">
      <div className="rp-card-body d-flex flex-column flex-grow-1">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <p className="rp-card-title mb-0">Payment Methods</p>
            <p className="rp-card-subtitle">
              {totalCount} transactions · ₹{fmt(totalRevenue)} total
            </p>
          </div>
          <span className="rp-badge rp-badge-info">Donut Share</span>
        </div>

        {/* Cross-Filter Indicator */}
        {selectedPaymentMethod && (
          <div className="rp-cross-filter-bar py-1 mb-2">
            <span>
              Filtered: <strong>{selectedPaymentMethod}</strong>
            </span>
            <button
              type="button"
              className="clear-btn"
              onClick={onClearPayment}
              title="Clear payment filter"
            >
              <FiX size={12} /> Clear
            </button>
          </div>
        )}

        {/* Donut Chart */}
        <div className="rp-chart-container short position-relative flex-grow-1 d-flex align-items-center justify-content-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={handleSliceClick}
                cursor="pointer"
              >
                {chartData.map((entry) => {
                  const isSelected = selectedPaymentMethod === entry.name;
                  return (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke={isSelected ? '#111827' : '#fff'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      opacity={selectedPaymentMethod && !isSelected ? 0.45 : 1}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Legend / Breakdown Pills */}
        <div className="d-flex flex-wrap gap-2 pt-2 border-top mt-auto" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {chartData.map((item) => {
            const isSelected = selectedPaymentMethod === item.name;
            return (
              <button
                key={item.name}
                type="button"
                className="btn btn-sm text-start flex-grow-1 p-2 d-flex align-items-center justify-content-between"
                style={{
                  borderRadius: '9px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0,0,0,0.02)',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(0,0,0,0.05)',
                  fontSize: '0.74rem',
                }}
                onClick={() => onSelectPayment(item.name)}
                title={`Click to filter by ${item.name}`}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rp-legend-dot"
                    style={{ background: item.color }}
                  />
                  <strong>{item.name}</strong>
                  <span className="text-muted">({item.count})</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="fw-bold">₹{fmt(item.revenue)}</span>
                  <span className="text-muted">({item.pct}%)</span>
                  {isSelected && <FiCheck size={12} className="text-primary ms-1" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodChart;
