/**
 * @file        CategoryInventoryChart.jsx
 * @module      Reports
 * @purpose     Interactive Bar chart showing stock units and inventory valuation
 *              per category. Clicking a category bar applies a global/cross-filter.
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
import { FiX } from 'react-icons/fi';
import { CHART_PALETTE } from '../constants/reportsConstants';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label">{data.category}</p>
        <p className="item">
          Stock Units: <span>{fmt(data.stock)}</span> units
        </p>
        <p className="item">
          Inventory Value: <span>₹{fmt(data.value)}</span>
        </p>
        <p className="item">
          Active Medicines: <span>{data.count}</span>
        </p>
        {data.lowStock > 0 && (
          <p className="item text-warning">
            ⚠️ Low Stock: <span>{data.lowStock}</span> items
          </p>
        )}
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click category bar to cross-filter
        </small>
      </div>
    );
  }
  return null;
};

const CategoryInventoryChart = ({
  categoryData = [],
  loading,
  selectedCategory,
  onSelectCategory,
  onClearCategory,
}) => {
  const [metric, setMetric] = useState('stock'); // 'stock' or 'value'

  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Category Inventory Distribution</p>
          <p className="rp-card-subtitle mb-3">Loading category stocks...</p>
          <div className="placeholder rounded" style={{ height: '240px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">📦</div>
          <p className="rp-card-title mb-1">Category Inventory Distribution</p>
          <p className="rp-empty-text mb-0">No category inventory records available.</p>
        </div>
      </div>
    );
  }

  const handleBarClick = (entry) => {
    if (entry && entry.category && onSelectCategory) {
      onSelectCategory(entry.category);
    }
  };

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header & Toggle */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
          <div>
            <p className="rp-card-title mb-0">Category Stock &amp; Valuation</p>
            <p className="rp-card-subtitle">
              {categoryData.length} unique pharmaceutical categories
            </p>
          </div>

          <div className="rp-toggle-bar">
            <button
              type="button"
              className={`rp-toggle-btn ${metric === 'stock' ? 'active' : ''}`}
              onClick={() => setMetric('stock')}
            >
              By Units
            </button>
            <button
              type="button"
              className={`rp-toggle-btn ${metric === 'value' ? 'active' : ''}`}
              onClick={() => setMetric('value')}
            >
              By Value (₹)
            </button>
          </div>
        </div>

        {/* Cross-Filter Indicator */}
        {selectedCategory && (
          <div className="rp-cross-filter-bar">
            <span>
              Category filter active: <strong>{selectedCategory}</strong>
            </span>
            <button
              type="button"
              className="clear-btn"
              onClick={onClearCategory}
              title="Clear category selection"
            >
              <FiX size={13} /> Clear
            </button>
          </div>
        )}

        {/* Bar Chart */}
        <div className="rp-chart-container" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={categoryData}
              margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (metric === 'value' ? `₹${fmt(val)}` : fmt(val))}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={metric === 'stock' ? 'stock' : 'value'}
                radius={[6, 6, 0, 0]}
                onClick={handleBarClick}
              >
                {categoryData.map((entry, index) => {
                  const isSelected = selectedCategory === entry.category;
                  const baseColor = CHART_PALETTE[index % CHART_PALETTE.length];
                  return (
                    <Cell
                      key={entry.category}
                      fill={baseColor}
                      stroke={isSelected ? '#111827' : 'none'}
                      strokeWidth={isSelected ? 2.5 : 0}
                      opacity={selectedCategory && !isSelected ? 0.35 : 0.9}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CategoryInventoryChart;
