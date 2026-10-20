/**
 * @file        InventoryStatusChart.jsx
 * @module      Reports
 * @purpose     Interactive Donut chart classifying medicines into In Stock,
 *              Low Stock, Out of Stock, and Expired.
 */

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { STOCK_STATUS_COLORS } from '../constants/reportsConstants';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label">{data.name}</p>
        <p className="item">
          Count: <span>{data.value} medicines</span>
        </p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click segment to view list
        </small>
      </div>
    );
  }
  return null;
};

const InventoryStatusChart = ({
  stockStatusData = [],
  loading,
  onStatusClick,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4 h-100">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Stock Health Distribution</p>
          <p className="rp-card-subtitle mb-3">Loading status health...</p>
          <div className="placeholder rounded-circle mx-auto my-3" style={{ width: '160px', height: '160px' }} />
        </div>
      </div>
    );
  }

  const total = stockStatusData.reduce((s, item) => s + item.value, 0);

  const handleSliceClick = (entry) => {
    if (entry && entry.name && onStatusClick) {
      onStatusClick(entry.name);
    }
  };

  return (
    <div className="rp-card mb-4 h-100 d-flex flex-column">
      <div className="rp-card-body d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <p className="rp-card-title mb-0">Stock Health Distribution</p>
            <p className="rp-card-subtitle">{total} catalog medicines classified</p>
          </div>
          <span className="rp-badge rp-badge-success">Health Status</span>
        </div>

        <div className="rp-chart-container short position-relative flex-grow-1 d-flex align-items-center justify-content-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={stockStatusData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={handleSliceClick}
                cursor="pointer"
              >
                {stockStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STOCK_STATUS_COLORS[entry.name] || '#6b7280'}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Cards */}
        <div className="d-flex flex-wrap gap-2 pt-2 border-top mt-auto" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {stockStatusData.map((item) => {
            const color = STOCK_STATUS_COLORS[item.name] || '#6b7280';
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <button
                key={item.name}
                type="button"
                className="btn btn-sm text-start flex-grow-1 p-2 d-flex align-items-center justify-content-between"
                style={{
                  borderRadius: '9px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  fontSize: '0.74rem',
                }}
                onClick={() => onStatusClick(item.name)}
                title={`Click to view ${item.name} medicines`}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="rp-legend-dot" style={{ background: color }} />
                  <strong>{item.name}</strong>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="fw-bold">{item.value}</span>
                  <span className="text-muted">({pct}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InventoryStatusChart;
