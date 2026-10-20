/**
 * @file        RevenueVsCostChart.jsx
 * @module      Reports
 * @purpose     Multi-series chart comparing Sales Revenue vs Purchase Inflows
 *              over the selected time period.
 */

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rp-tooltip">
        <p className="label">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="item" style={{ color: item.color }}>
            {item.name}: <span>₹{fmt(item.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueVsCostChart = ({
  salesTrend,
  purchaseTrend,
  loading,
}) => {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Revenue vs. Purchase Cost</p>
          <p className="rp-card-subtitle mb-3">Loading financial comparison...</p>
          <div className="placeholder rounded" style={{ height: '240px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!salesTrend && !purchaseTrend) return null;

  // Align dates between sales and purchases
  const labels = salesTrend?.labels || purchaseTrend?.labels || [];
  const chartData = labels.map((label, idx) => {
    const revenue = salesTrend?.revenues?.[idx] || 0;
    const cost    = purchaseTrend?.amounts?.[idx] || 0;
    return {
      label,
      Revenue: revenue,
      'Purchase Cost': cost,
      'Net Inflow': revenue - cost,
    };
  });

  const totalRev  = chartData.reduce((s, d) => s + d.Revenue, 0);
  const totalCost = chartData.reduce((s, d) => s + d['Purchase Cost'], 0);
  const netSpread = totalRev - totalCost;

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <p className="rp-card-title mb-0">Revenue vs. Purchase Outflow</p>
            <p className="rp-card-subtitle">
              Period Cash Flow: Revenue ₹{fmt(totalRev)} · Purchases ₹{fmt(totalCost)} · Spread{' '}
              <strong className={netSpread >= 0 ? 'text-success' : 'text-danger'}>
                ₹{fmt(netSpread)}
              </strong>
            </p>
          </div>
          <span className="rp-badge rp-badge-primary">Cash Flow</span>
        </div>

        {/* Recharts Area Chart */}
        <div className="rp-chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
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
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.74rem', paddingBottom: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revGrad)"
              />
              <Area
                type="monotone"
                dataKey="Purchase Cost"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#costGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RevenueVsCostChart;
