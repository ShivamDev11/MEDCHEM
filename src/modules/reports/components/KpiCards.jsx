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
    key:     'totalRevenue',
    label:   'Total Revenue',
    prefix:  '₹',
    icon:    FiDollarSign,
    color:   'success',
    source:  'sales',
  },
  {
    key:     'totalSales',
    label:   'Total Sales',
    icon:    FiShoppingCart,
    color:   'primary',
    source:  'sales',
  },
  {
    key:     'totalItemsSold',
    label:   'Items Sold',
    icon:    FiPackage,
    color:   'info',
    source:  'sales',
  },
  {
    key:     'totalMedicines',
    label:   'Total Medicines',
    icon:    FiBox,
    color:   'secondary',
    source:  'inventory',
  },
  {
    key:     'lowStock',
    label:   'Low Stock',
    icon:    FiAlertTriangle,
    color:   'warning',
    source:  'inventory',
  },
  {
    key:     'expired',
    label:   'Expired',
    icon:    FiXCircle,
    color:   'danger',
    source:  'expiry',
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
            <div className={`card border-0 shadow-sm h-100 border-start border-4 border-${card.color}`}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
                      {card.label}
                    </p>
                    <h5 className="fw-bold mb-0">
                      {loading ? (
                        <span className="placeholder col-6 rounded" />
                      ) : (
                        `${card.prefix || ''}${fmt(value)}`
                      )}
                    </h5>
                  </div>
                  <div className={`text-${card.color} opacity-75`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;
