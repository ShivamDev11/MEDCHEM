/**
 * @file        ProfitAnalyticsSection.jsx
 * @module      Reports
 * @purpose     Dedicated Profit & Margin Analytics section. Displays gross profit,
 *              profit margin %, category-wise profit contribution, and product margin table.
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
import { FiTrendingUp, FiAlertTriangle, FiInfo } from 'react-icons/fi';
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
          Gross Profit: <span>₹{fmt(data.profit)}</span>
        </p>
        <p className="item">
          Sales Revenue: <span>₹{fmt(data.revenue)}</span>
        </p>
        <p className="item">
          Profit Margin: <span>{(data.margin || 0).toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const ProfitAnalyticsSection = ({
  profitSummary,
  loading,
  onOpenProfitDrawer,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Profit &amp; Margin Analysis</p>
          <div className="placeholder rounded" style={{ height: '220px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!profitSummary || !profitSummary.byProduct.length) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">📈</div>
          <p className="rp-card-title mb-1">Profit &amp; Margin Analysis</p>
          <p className="rp-empty-text mb-0">No sales transactions in the selected period to calculate profit.</p>
        </div>
      </div>
    );
  }

  const { kpi, byCategory, byProduct } = profitSummary;

  // Highest-margin products (sorted by margin desc)
  const topMarginProducts = [...byProduct]
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiTrendingUp size={18} className="text-success" />
              <p className="rp-card-title mb-0">Profit &amp; Margin Analytics</p>
              <span className={`rp-badge ${kpi.grossProfit >= 0 ? 'rp-badge-success' : 'rp-badge-danger'}`}>
                {(kpi.profitMargin || 0).toFixed(1)}% Margin
              </span>
            </div>
            <p className="rp-card-subtitle">
              Gross profit calculated against medicine purchase prices
            </p>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0"
            style={{ fontSize: '0.78rem', fontWeight: 600 }}
            onClick={onOpenProfitDrawer}
          >
            View All Product Margins &rarr;
          </button>
        </div>

        {/* Calculation basis disclaimer */}
        <div className="rp-disclaimer">
          <FiInfo size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Calculation Method:</strong> Gross Profit = Total Sales Revenue &minus; Cost of Goods Sold (Units Sold &times; Current Purchase Price). Values reflect estimated gross trading surplus.
          </span>
        </div>

        {/* KPI Mini-Row */}
        <div className="rp-metric-row">
          <div className="rp-metric-box">
            <div className="label">Total Revenue</div>
            <div className="value text-primary">₹{fmt(kpi.totalRevenue)}</div>
          </div>
          <div className="rp-metric-box">
            <div className="label">Cost of Goods</div>
            <div className="value text-muted">₹{fmt(kpi.totalCost)}</div>
          </div>
          <div className="rp-metric-box">
            <div className="label">Gross Profit</div>
            <div className={`value ${kpi.grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              ₹{fmt(kpi.grossProfit)}
            </div>
          </div>
          <div className="rp-metric-box">
            <div className="label">Average Margin</div>
            <div className={`value ${(kpi.profitMargin || 0) >= 15 ? 'text-success' : 'text-warning'}`}>
              {(kpi.profitMargin || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Main Content Grid: Category Profit Chart + High Margin Table */}
        <div className="row g-4 mt-1">
          {/* Category Profit Chart */}
          <div className="col-12 col-lg-7">
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.82rem' }}>
              Category Profit Contribution (₹)
            </h6>
            <div className="rp-chart-container short">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={byCategory.slice(0, 7)}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${fmt(val)}`}
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" radius={[5, 5, 0, 0]}>
                    {byCategory.slice(0, 7).map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Highest Margin Products */}
          <div className="col-12 col-lg-5">
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.82rem' }}>
              Highest Margin Medicines
            </h6>
            <div className="table-responsive rp-drawer-table-wrap">
              <table className="rp-table mb-0">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {topMarginProducts.map((p) => {
                    const margin = (p.margin || 0).toFixed(1);
                    return (
                      <tr key={p.medicineId}>
                        <td className="fw-medium text-truncate" style={{ maxWidth: '140px' }} title={p.medicineName}>
                          {p.medicineName}
                        </td>
                        <td className="text-end fw-bold text-success">
                          ₹{fmt(p.revenue)}
                        </td>
                        <td className="text-end">
                          <span className="rp-badge rp-badge-success">
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAnalyticsSection;
