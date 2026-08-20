/**
 * @file        KpiCards.jsx
 * @module      Reports
 * @purpose     Renders the 6 top KPI summary cards on the Reports dashboard.
 *              Receives pre-calculated data — no logic here.
 */

import { FiDollarSign, FiShoppingCart, FiPackage, FiBox, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

const CARDS = [
  {
    key:    'totalRevenue',
    label:  'Total Revenue',
    prefix: '₹',
    icon:   FiDollarSign,
    accent: 'success',
    iconBg: 'bg-success-soft',
    iconCl: '#10b981',
    source: 'sales',
  },
  {
    key:    'totalSales',
    label:  'Total Sales',
    icon:   FiShoppingCart,
    accent: 'primary',
    iconBg: 'bg-primary-soft',
    iconCl: '#3b82f6',
    source: 'sales',
  },
  {
    key:    'totalItemsSold',
    label:  'Items Sold',
    icon:   FiPackage,
    accent: 'info',
    iconBg: 'bg-info-soft',
    iconCl: '#06b6d4',
    source: 'sales',
  },
  {
    key:    'totalMedicines',
    label:  'Total Medicines',
    icon:   FiBox,
    accent: 'secondary',
    iconBg: 'bg-secondary-soft',
    iconCl: '#6b7280',
    source: 'inventory',
  },
  {
    key:    'lowStock',
    label:  'Low Stock',
    icon:   FiAlertTriangle,
    accent: 'warning',
    iconBg: 'bg-warning-soft',
    iconCl: '#f59e0b',
    source: 'inventory',
  },
  {
    key:    'expired',
    label:  'Expired',
    icon:   FiXCircle,
    accent: 'danger',
    iconBg: 'bg-danger-soft',
    iconCl: '#ef4444',
    source: 'expiry',
  },
];

function KpiCards({ salesKPIs, inventoryKPIs, expiryKPIs, loading }) {
  const getValue = (card) => {
    if (loading) return '—';
    if (card.source === 'sales')     return salesKPIs?.[card.key]     ?? 0;
    if (card.source === 'inventory') return inventoryKPIs?.[card.key] ?? 0;
    if (card.source === 'expiry')    return expiryKPIs?.[card.key]    ?? 0;
    return 0;
  };

  return (
    <div className="row g-3 mb-4">
      {CARDS.map((card) => {
        const Icon  = card.icon;
        const value = getValue(card);

        return (
          <div key={card.key} className="col-6 col-md-4 col-lg-2">
            <div className={`rp-kpi-card accent-${card.accent}`}>
              <div className="d-flex justify-content-between align-items-start">
                <p className="rp-kpi-label mb-0">{card.label}</p>
                <div className={`rp-kpi-icon-wrap ${card.iconBg}`}>
                  <Icon size={17} style={{ color: card.iconCl }} />
                </div>
              </div>
              <div className="rp-kpi-value mt-2">
                {loading ? (
                  <span className="placeholder rounded" style={{ width: '70%', height: '1.5rem' }} />
                ) : (
                  `${card.prefix || ''}${fmt(value)}`
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;
