/**
 * @file        SupplierAnalyticsChart.jsx
 * @module      Reports
 * @purpose     Supplier & Purchase analytics visualization with Recharts horizontal
 *              bar chart showing top suppliers by purchase volume and click-to-filter.
 */

import React from 'react';
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
import { FiTruck, FiX } from 'react-icons/fi';
import { CHART_PALETTE } from '../constants/reportsConstants';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rp-tooltip">
        <p className="label">{data.name}</p>
        <p className="item">
          Total Purchases: <span>₹{fmt(data.totalPurchaseValue)}</span>
        </p>
        <p className="item">
          Purchase Invoices: <span>{data.purchaseCount} orders</span>
        </p>
        <p className="item">
          Catalog Medicines: <span>{data.productCount} products</span>
        </p>
        <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
          💡 Click bar to filter by supplier
        </small>
      </div>
    );
  }
  return null;
};

const SupplierAnalyticsChart = ({
  supplierStats = [],
  loading,
  selectedSupplier,
  onSelectSupplier,
  onClearSupplier,
  onViewSupplierOrders,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Supplier Procurement Analytics</p>
          <p className="rp-card-subtitle mb-3">Loading supplier performance...</p>
          <div className="placeholder rounded" style={{ height: '250px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!supplierStats || supplierStats.length === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">🚚</div>
          <p className="rp-card-title mb-1">Supplier Procurement Analytics</p>
          <p className="rp-empty-text mb-0">No supplier records found in database.</p>
        </div>
      </div>
    );
  }

  // Top 8 suppliers by purchase volume
  const topSuppliers = [...supplierStats]
    .slice(0, 8)
    .reverse(); // For horizontal layout

  const totalSpent = supplierStats.reduce((s, sup) => s + (sup.totalPurchaseValue || 0), 0);

  const handleBarClick = (entry) => {
    if (entry && entry.name && onSelectSupplier) {
      onSelectSupplier(entry.name);
    }
  };

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiTruck size={17} className="text-primary" />
              <p className="rp-card-title mb-0">Top Suppliers by Procurement Value</p>
            </div>
            <p className="rp-card-subtitle">
              {supplierStats.length} active suppliers · Total Outflow: ₹{fmt(totalSpent)}
            </p>
          </div>

          {onViewSupplierOrders && (
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
              onClick={onViewSupplierOrders}
            >
              View All Purchase Orders &rarr;
            </button>
          )}
        </div>

        {/* Cross-Filter Indicator */}
        {selectedSupplier && (
          <div className="rp-cross-filter-bar mb-3">
            <span>
              Supplier filter active: <strong>{selectedSupplier}</strong>
            </span>
            <button
              type="button"
              className="clear-btn"
              onClick={onClearSupplier}
              title="Clear supplier selection"
            >
              <FiX size={13} /> Clear
            </button>
          </div>
        )}

        {/* Recharts Horizontal Bar Chart */}
        <div className="rp-chart-container" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={topSuppliers}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                tickLine={false}
                tickFormatter={(val) => `₹${fmt(val)}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalPurchaseValue"
                radius={[0, 6, 6, 0]}
                onClick={handleBarClick}
              >
                {topSuppliers.map((entry, index) => {
                  const isSelected = selectedSupplier === entry.name;
                  return (
                    <Cell
                      key={entry.id || index}
                      fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                      stroke={isSelected ? '#111827' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      opacity={selectedSupplier && !isSelected ? 0.35 : 0.9}
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

export default SupplierAnalyticsChart;
