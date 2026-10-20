/**
 * @file        ExecutiveKpiCards.jsx
 * @module      Reports
 * @purpose     Executive overview section displaying 14 business intelligence KPI cards
 *              grouped into Sales & Profit (date-filtered) and Inventory & Expiry (current state).
 *              Each card is clickable to open drill-through records in the detail drawer.
 */

import React from 'react';
import {
  FiDollarSign,
  FiShoppingCart,
  FiPackage,
  FiTrendingUp,
  FiPercent,
  FiShoppingBag,
  FiBox,
  FiLayers,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiTruck,
  FiBarChart2,
} from 'react-icons/fi';
import { DRAWER_MODES } from '../constants/reportsConstants';

const fmtCurrency = (n) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const fmtNumber = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const ExecutiveKpiCards = ({
  salesKPIs,
  inventoryKPIs,
  expiryKPIs,
  purchaseKPIs,
  profitKPIs,
  loading,
  onCardClick,
}) => {
  // ── ROW 1: Sales & Financial KPIs (Transaction / Date-Filtered) ───────────
  const financialCards = [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: fmtCurrency(salesKPIs?.totalRevenue),
      sub: 'Completed sales in period',
      icon: FiDollarSign,
      accent: 'success',
      iconBg: 'bg-success-soft',
      iconColor: '#10b981',
      drawerMode: DRAWER_MODES.SALES_LIST,
      drawerTitle: 'Completed Sales Transactions',
    },
    {
      key: 'salesCount',
      label: 'Sales Count',
      value: fmtNumber(salesKPIs?.totalSales),
      sub: `${fmtNumber(salesKPIs?.completedSalesCount || 0)} completed`,
      icon: FiShoppingCart,
      accent: 'primary',
      iconBg: 'bg-primary-soft',
      iconColor: '#3b82f6',
      drawerMode: DRAWER_MODES.SALES_LIST,
      drawerTitle: 'Sales History',
    },
    {
      key: 'itemsSold',
      label: 'Items Sold',
      value: fmtNumber(salesKPIs?.totalItemsSold),
      sub: 'Total quantity dispensed',
      icon: FiPackage,
      accent: 'info',
      iconBg: 'bg-info-soft',
      iconColor: '#06b6d4',
      drawerMode: DRAWER_MODES.TOP_PRODUCTS,
      drawerTitle: 'Sold Products Breakdown',
    },
    {
      key: 'aov',
      label: 'Avg Order Value',
      value: fmtCurrency(salesKPIs?.avgOrderValue),
      sub: 'Revenue / completed order',
      icon: FiBarChart2,
      accent: 'secondary',
      iconBg: 'bg-secondary-soft',
      iconColor: '#6b7280',
      drawerMode: DRAWER_MODES.SALES_LIST,
      drawerTitle: 'Sales Transactions',
    },
    {
      key: 'purchaseCost',
      label: 'Purchase Cost',
      value: fmtCurrency(purchaseKPIs?.totalPurchaseValue),
      sub: `${purchaseKPIs?.totalPurchases || 0} purchase orders`,
      icon: FiTruck,
      accent: 'orange',
      iconBg: 'bg-orange-soft',
      iconColor: '#f97316',
      drawerMode: DRAWER_MODES.PURCHASE_LIST,
      drawerTitle: 'Purchase Invoices & Orders',
    },
    {
      key: 'grossProfit',
      label: 'Gross Profit',
      value: fmtCurrency(profitKPIs?.grossProfit),
      sub: 'Revenue minus purchase cost',
      icon: FiTrendingUp,
      accent: profitKPIs?.grossProfit >= 0 ? 'success' : 'danger',
      iconBg: profitKPIs?.grossProfit >= 0 ? 'bg-success-soft' : 'bg-danger-soft',
      iconColor: profitKPIs?.grossProfit >= 0 ? '#10b981' : '#ef4444',
      drawerMode: DRAWER_MODES.PROFIT_LIST,
      drawerTitle: 'Gross Profit & Product Margins',
    },
    {
      key: 'margin',
      label: 'Profit Margin',
      value: `${(profitKPIs?.margin || 0).toFixed(1)}%`,
      sub: 'Gross profit / revenue',
      icon: FiPercent,
      accent: (profitKPIs?.margin || 0) >= 15 ? 'success' : 'warning',
      iconBg: (profitKPIs?.margin || 0) >= 15 ? 'bg-success-soft' : 'bg-warning-soft',
      iconColor: (profitKPIs?.margin || 0) >= 15 ? '#10b981' : '#f59e0b',
      drawerMode: DRAWER_MODES.PROFIT_LIST,
      drawerTitle: 'Profit & Margin Analysis',
    },
  ];

  // ── ROW 2: Inventory & Expiry KPIs (Current Real-Time State) ───────────────
  const inventoryCards = [
    {
      key: 'inventoryItems',
      label: 'Active Medicines',
      value: fmtNumber(inventoryKPIs?.totalMedicines),
      sub: `${inventoryKPIs?.uniqueCategories || 0} categories`,
      icon: FiBox,
      accent: 'primary',
      iconBg: 'bg-primary-soft',
      iconColor: '#3b82f6',
      drawerMode: DRAWER_MODES.INVENTORY_LIST,
      drawerTitle: 'Active Medicine Catalog',
    },
    {
      key: 'stockUnits',
      label: 'Stock Units',
      value: fmtNumber(inventoryKPIs?.totalStock),
      sub: 'Total physical units',
      icon: FiLayers,
      accent: 'info',
      iconBg: 'bg-info-soft',
      iconColor: '#06b6d4',
      drawerMode: DRAWER_MODES.INVENTORY_LIST,
      drawerTitle: 'Inventory Stock Breakdown',
    },
    {
      key: 'inventoryValue',
      label: 'Inventory Value',
      value: fmtCurrency(inventoryKPIs?.inventoryValue),
      sub: 'At purchase cost basis',
      icon: FiDollarSign,
      accent: 'purple',
      iconBg: 'bg-purple-soft',
      iconColor: '#8b5cf6',
      drawerMode: DRAWER_MODES.INVENTORY_LIST,
      drawerTitle: 'Inventory Valuation',
    },
    {
      key: 'lowStock',
      label: 'Low-Stock Items',
      value: fmtNumber(inventoryKPIs?.lowStock),
      sub: 'At or below reorder level',
      icon: FiAlertTriangle,
      accent: 'warning',
      iconBg: 'bg-warning-soft',
      iconColor: '#f59e0b',
      drawerMode: DRAWER_MODES.LOW_STOCK_LIST,
      drawerTitle: 'Low-Stock Medicines (Needs Reorder)',
    },
    {
      key: 'outOfStock',
      label: 'Out of Stock',
      value: fmtNumber(inventoryKPIs?.outOfStock),
      sub: 'Zero inventory remaining',
      icon: FiXCircle,
      accent: 'danger',
      iconBg: 'bg-danger-soft',
      iconColor: '#ef4444',
      drawerMode: DRAWER_MODES.INVENTORY_LIST,
      drawerTitle: 'Out of Stock Medicines',
      context: { filterStatus: 'outOfStock' },
    },
    {
      key: 'expired',
      label: 'Expired Items',
      value: fmtNumber(expiryKPIs?.expired),
      sub: 'Must remove from shelves',
      icon: FiXCircle,
      accent: 'danger',
      iconBg: 'bg-danger-soft',
      iconColor: '#ef4444',
      drawerMode: DRAWER_MODES.EXPIRY_LIST,
      drawerTitle: 'Expired Medicines',
      context: { bucket: 'expired' },
    },
    {
      key: 'expiringSoon',
      label: 'Expiring ≤ 30 Days',
      value: fmtNumber(expiryKPIs?.within30),
      sub: `${expiryKPIs?.within90 || 0} within 90 days`,
      icon: FiClock,
      accent: 'warning',
      iconBg: 'bg-warning-soft',
      iconColor: '#d97706',
      drawerMode: DRAWER_MODES.EXPIRY_LIST,
      drawerTitle: 'Medicines Expiring Within 30 Days',
      context: { bucket: 'within30' },
    },
  ];

  const renderCard = (card) => {
    const Icon = card.icon;

    return (
      <div key={card.key} className="col-12 col-sm-6 col-md-4 col-xl" style={{ minWidth: '160px' }}>
        <div
          className={`rp-kpi-card accent-${card.accent} clickable`}
          onClick={() => onCardClick(card.drawerMode, card.drawerTitle, card.context)}
          title={`Click to inspect ${card.label}`}
        >
          <div className="d-flex justify-content-between align-items-start">
            <p className="rp-kpi-label mb-0">{card.label}</p>
            <div className={`rp-kpi-icon-wrap ${card.iconBg}`}>
              <Icon size={17} style={{ color: card.iconColor }} />
            </div>
          </div>
          <div className="rp-kpi-value mt-2">
            {loading ? (
              <span className="placeholder rounded" style={{ width: '70%', height: '1.4rem' }} />
            ) : (
              card.value
            )}
          </div>
          <p className="rp-kpi-sub mb-0 text-truncate" title={card.sub}>
            {card.sub}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-4">
      {/* ── Group 1: Transaction & Financial KPIs (Filtered by Date) ──── */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="reports-section-label mb-0" style={{ fontSize: '0.66rem' }}>
          Sales, Purchasing &amp; Gross Margins (Filtered Period)
        </span>
      </div>
      <div className="row g-2 g-md-3 mb-3">
        {financialCards.map(renderCard)}
      </div>

      {/* ── Group 2: Current Inventory & Expiry Health (Real-Time State) ── */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="reports-section-label mb-0" style={{ fontSize: '0.66rem' }}>
          Current Inventory &amp; Expiry Status (Real-Time State)
        </span>
      </div>
      <div className="row g-2 g-md-3">
        {inventoryCards.map(renderCard)}
      </div>
    </div>
  );
};

export default ExecutiveKpiCards;
