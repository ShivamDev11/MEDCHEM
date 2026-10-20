/**
 * @file        SalesTrendChart.jsx
 * @module      Reports
 * @purpose     Interactive Sales Revenue Trend chart powered by Recharts AreaChart.
 *              Supports hover tooltips, clicking a date point to cross-filter sales,
 *              and drill-through to the sales detail drawer.
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { FiCalendar, FiX } from 'react-icons/fi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label">{data.label || label}</p>
        <p className="item">
          Revenue: <span>₹{fmt(data.revenue)}</span>
        </p>
        <p className="item">
          Transactions: <span>{data.count}</span>
        </p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click point to view sales
        </small>
      </div>
    );
  }
  return null;
};

const SalesTrendChart = ({
  salesTrend,
  loading,
  selectedDatePoint,
  onDateClick,
  onClearDateFilter,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Sales Revenue Trend</p>
          <p className="rp-card-subtitle mb-3">Loading sales trajectory...</p>
          <div className="placeholder rounded" style={{ height: '240px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!salesTrend || salesTrend.revenues.every((r) => r === 0)) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">📊</div>
          <p className="rp-card-title mb-1">Sales Revenue Trend</p>
          <p className="rp-empty-text mb-0">No sales transactions recorded in this period.</p>
        </div>
      </div>
    );
  }

  // Format data array for Recharts
  const chartData = salesTrend.labels.map((label, idx) => ({
    label,
    dateKey: salesTrend.dateKeys[idx],
    revenue: salesTrend.revenues[idx],
    count: salesTrend.counts[idx],
  }));

  const totalPeriodRevenue = salesTrend.revenues.reduce((s, r) => s + r, 0);

  const handlePointClick = (event) => {
    if (event && event.activePayload && event.activePayload.length) {
      const point = event.activePayload[0].payload;
      if (point.dateKey && onDateClick) {
        onDateClick(point.dateKey, point.label);
      }
    }
  };

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-2 gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <p className="rp-card-title mb-0">Sales Revenue Trend</p>
              <span className="rp-badge rp-badge-primary">
                {salesTrend.daysRendered} Days
              </span>
            </div>
            <p className="rp-card-subtitle">
              Total Revenue: <strong>₹{fmt(totalPeriodRevenue)}</strong> across period
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="rp-legend-dot" style={{ background: '#3b82f6' }} />
            <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>Daily Revenue (₹)</span>
          </div>
        </div>

        {/* Cross-Filter Indicator when a point is clicked */}
        {selectedDatePoint && (
          <div className="rp-cross-filter-bar">
            <FiCalendar size={13} />
            <span>
              Cross-filter active: Filtered to date <strong>{selectedDatePoint}</strong>
            </span>
            <button
              type="button"
              className="clear-btn"
              onClick={onClearDateFilter}
              title="Clear date selection"
            >
              <FiX size={13} /> Clear
            </button>
          </div>
        )}

        {/* Recharts Area Chart */}
        <div className="rp-chart-container" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              onClick={handlePointClick}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                tickFormatter={(val) => `₹${fmt(val)}`}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salesGrad)"
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesTrendChart;
