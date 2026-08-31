/**
 * @file        ProfitCards.jsx
 * @module      SmartOperations
 * @purpose     Displays KPI cards for profit analysis.
 */

import React from 'react';
import { FiTrendingUp, FiDollarSign, FiPieChart, FiActivity } from 'react-icons/fi';

function ProfitCards({ kpi, isLoading }) {
  const cards = [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: `₹${(kpi?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: 'From all completed sales',
      icon: FiActivity,
      colorClass: 'so-stat-blue',
    },
    {
      key: 'cost',
      label: 'Total Cost',
      value: `₹${(kpi?.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: 'Based on current purchase price',
      icon: FiDollarSign,
      colorClass: 'so-stat-orange',
    },
    {
      key: 'profit',
      label: 'Gross Profit',
      value: `₹${(kpi?.grossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: 'Revenue minus Cost',
      icon: FiTrendingUp,
      colorClass: 'so-stat-green',
    },
    {
      key: 'margin',
      label: 'Profit Margin',
      value: `${(kpi?.profitMargin || 0).toFixed(1)}%`,
      hint: 'Profit as % of Revenue',
      icon: FiPieChart,
      colorClass: 'so-stat-indigo',
    },
  ];

  if (isLoading) {
    return (
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="so-stat-card so-stat-skeleton" style={{ height: 120 }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div key={card.key} className="col-12 col-sm-6 col-lg-3">
          <div className={`so-stat-card ${card.colorClass}`}>
            <div className="so-stat-icon-wrap">
              <card.icon size={20} />
            </div>
            <div className="so-stat-value">{card.value}</div>
            <div className="so-stat-label">{card.label}</div>
            <div className="so-stat-hint">{card.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfitCards;
