/**
 * @file        ExpiryBucketChart.jsx
 * @module      Reports
 * @purpose     Interactive Expiry Risk Analysis with Recharts Bar chart showing
 *              medicines in each expiry risk window, with click-to-drill functionality.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { FiAlertOctagon, FiAlertTriangle, FiClock, FiInfo } from 'react-icons/fi';
import { EXPIRY_COLORS } from '../constants/reportsConstants';

const BUCKET_CONFIG = [
  {
    key: 'expired',
    label: 'Expired',
    sub: 'Immediate disposal required',
    color: EXPIRY_COLORS.expired,
    icon: FiAlertOctagon,
  },
  {
    key: 'within30',
    label: '≤ 30 Days',
    sub: 'Urgent stock clearance',
    color: EXPIRY_COLORS.within30,
    icon: FiAlertTriangle,
  },
  {
    key: 'within60',
    label: '≤ 60 Days',
    sub: 'Plan stock rotation',
    color: EXPIRY_COLORS.within60,
    icon: FiClock,
  },
  {
    key: 'within90',
    label: '≤ 90 Days',
    sub: 'Monitor weekly',
    color: EXPIRY_COLORS.within90,
    icon: FiInfo,
  },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label" style={{ color: data.color }}>{data.label}</p>
        <p className="item">
          Affected Medicines: <span>{data.count} items</span>
        </p>
        <p className="item text-muted">{data.sub}</p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click to inspect batch numbers &amp; suppliers
        </small>
      </div>
    );
  }
  return null;
};

const ExpiryBucketChart = ({
  expiryKPIs,
  loading,
  onBucketClick,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Expiry Risk Windows</p>
          <p className="rp-card-subtitle mb-3">Loading expiry analysis...</p>
          <div className="placeholder rounded" style={{ height: '220px', width: '100%' }} />
        </div>
      </div>
    );
  }

  const chartData = BUCKET_CONFIG.map((b) => ({
    key: b.key,
    label: b.label,
    count: expiryKPIs?.[b.key] || 0,
    color: b.color,
    sub: b.sub,
  }));

  const handleBarClick = (entry) => {
    if (entry && entry.key && onBucketClick) {
      onBucketClick(entry.key, entry.label);
    }
  };

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <p className="rp-card-title mb-0">Expiry Risk Analysis</p>
            <p className="rp-card-subtitle">
              Inventory grouped by remaining shelf life windows
            </p>
          </div>
          <span className="rp-badge rp-badge-warning">Risk Horizon</span>
        </div>

        {/* Recharts Bar Chart */}
        <div className="rp-chart-container short" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                onClick={handleBarClick}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Action Cards */}
        <div className="row g-2 mt-3 pt-2 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {BUCKET_CONFIG.map((b) => {
            const Icon = b.icon;
            const count = expiryKPIs?.[b.key] || 0;

            return (
              <div key={b.key} className="col-6 col-md-3">
                <button
                  type="button"
                  className="btn btn-sm w-100 text-start p-2"
                  style={{
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                  onClick={() => onBucketClick(b.key, b.label)}
                  title={`Click to view ${b.label} medicines`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', fontWeight: 600, color: b.color }}>
                      <Icon size={12} /> {b.label}
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: b.color }}>{count}</strong>
                  </div>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '0.67rem' }}>
                    {b.sub}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Urgent alert for expired items */}
        {expiryKPIs?.expired > 0 && (
          <div
            className="d-flex align-items-center gap-2 mt-3 p-2 px-3 rounded"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <FiAlertOctagon size={16} className="text-danger flex-shrink-0" />
            <span style={{ fontSize: '0.78rem', color: '#991b1b' }}>
              <strong>{expiryKPIs.expired}</strong> medicine{expiryKPIs.expired !== 1 ? 's are' : ' is'} expired and currently visible in the active catalog. Click to inspect and initiate quarantine.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryBucketChart;
