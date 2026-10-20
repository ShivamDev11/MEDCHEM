/**
 * @file        TopProductsChart.jsx
 * @module      Reports
 * @purpose     Interactive Horizontal Bar chart for top-performing medicines.
 *              Supports toggling Top 5 / 10 / 20 and ranking by Quantity Sold or Revenue.
 */

import { useState } from 'react';
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
import { FiAward } from 'react-icons/fi';
import { CHART_PALETTE } from '../constants/reportsConstants';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label">{data.medicineName}</p>
        <p className="item">
          Quantity Sold: <span>{fmt(data.quantitySold)}</span> units
        </p>
        <p className="item">
          Revenue: <span>₹{fmt(data.revenue)}</span>
        </p>
        <p className="item">
          Category: <span>{data.category || '—'}</span>
        </p>
        <p className="item">
          In Stock: <span>{data.currentStock}</span>
        </p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click bar to inspect product records
        </small>
      </div>
    );
  }
  return null;
};

const TopProductsChart = ({
  topMedicines = [],
  loading,
  onProductClick,
}) => {
  const [limitCount, setLimitCount] = useState(10); // 5, 10, 20
  const [metric, setMetric]         = useState('quantitySold'); // 'quantitySold' or 'revenue'

  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Top Selling Products</p>
          <p className="rp-card-subtitle mb-3">Loading top performers...</p>
          <div className="placeholder rounded" style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!topMedicines || topMedicines.length === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">💊</div>
          <p className="rp-card-title mb-1">Top Selling Products</p>
          <p className="rp-empty-text mb-0">No sales transactions in the selected period.</p>
        </div>
      </div>
    );
  }

  // Sort and slice based on current controls
  const sorted = [...topMedicines]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limitCount);

  // For horizontal layout, we reverse so #1 is at the top
  const chartData = [...sorted].reverse();

  const handleBarClick = (entry) => {
    if (entry && onProductClick) {
      onProductClick(entry);
    }
  };

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header & Controls */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiAward className="text-warning" size={17} />
              <p className="rp-card-title mb-0">Top Performing Products</p>
              <span className="rp-badge rp-badge-primary">Top {limitCount}</span>
            </div>
            <p className="rp-card-subtitle">
              Ranked by {metric === 'quantitySold' ? 'units sold' : 'gross sales revenue'}
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Metric Toggle */}
            <div className="rp-toggle-bar">
              <button
                type="button"
                className={`rp-toggle-btn ${metric === 'quantitySold' ? 'active' : ''}`}
                onClick={() => setMetric('quantitySold')}
              >
                By Quantity
              </button>
              <button
                type="button"
                className={`rp-toggle-btn ${metric === 'revenue' ? 'active' : ''}`}
                onClick={() => setMetric('revenue')}
              >
                By Revenue (₹)
              </button>
            </div>

            {/* Limit Toggle */}
            <div className="rp-toggle-bar">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rp-toggle-btn ${limitCount === num ? 'active' : ''}`}
                  onClick={() => setLimitCount(num)}
                >
                  Top {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="rp-chart-container tall" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height={Math.max(280, limitCount * 26)}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                tickLine={false}
                tickFormatter={(val) => (metric === 'revenue' ? `₹${fmt(val)}` : fmt(val))}
              />
              <YAxis
                type="category"
                dataKey="medicineName"
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={metric}
                radius={[0, 6, 6, 0]}
                onClick={handleBarClick}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TopProductsChart;
