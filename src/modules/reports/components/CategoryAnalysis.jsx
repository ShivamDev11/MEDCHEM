/**
 * @file        CategoryAnalysis.jsx
 * @module      Reports
 * @purpose     Medicine category breakdown — count and stock per category.
 *              Pure CSS progress bars, no chart library.
 */

// Gradient bar class cycled per category
const BAR_CLASSES = [
  'rp-bar-primary', 'rp-bar-success', 'rp-bar-info',
  'rp-bar-warning', 'rp-bar-danger',  'rp-bar-secondary',
  'rp-bar-dark',    'rp-bar-primary', 'rp-bar-success', 'rp-bar-info',
];

// Matching soft badge colours
const BADGE_STYLES = [
  { bg: 'rgba(59,130,246,0.08)',   color: '#2563eb' },
  { bg: 'rgba(16,185,129,0.08)',   color: '#059669' },
  { bg: 'rgba(6,182,212,0.08)',    color: '#0891b2' },
  { bg: 'rgba(245,158,11,0.08)',   color: '#d97706' },
  { bg: 'rgba(239,68,68,0.08)',    color: '#dc2626' },
  { bg: 'rgba(107,114,128,0.08)',  color: '#4b5563' },
  { bg: 'rgba(55,65,81,0.08)',     color: '#374151' },
  { bg: 'rgba(59,130,246,0.08)',   color: '#2563eb' },
  { bg: 'rgba(16,185,129,0.08)',   color: '#059669' },
  { bg: 'rgba(6,182,212,0.08)',    color: '#0891b2' },
];

function CategoryAnalysis({ categoryData, loading }) {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Category Analysis</p>
          <p className="rp-card-subtitle mb-4">Inventory stock distribution</p>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rp-progress-row">
              <div className="rp-progress-label-row">
                <span className="placeholder rounded" style={{ width: '90px', height: '12px', display: 'inline-block' }} />
                <span className="placeholder rounded" style={{ width: '50px', height: '12px', display: 'inline-block' }} />
              </div>
              <div className="rp-progress">
                <div className="placeholder rp-progress-bar" style={{ width: `${40 + i * 10}%`, background: '#e5e7eb' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">📦</div>
          <p className="rp-card-title mb-1">Category Analysis</p>
          <p className="rp-empty-text mb-0">No inventory data available.</p>
        </div>
      </div>
    );
  }

  const maxStock   = Math.max(...categoryData.map((c) => c.stock), 1);
  const totalMeds  = categoryData.reduce((s, c) => s + c.count, 0);
  const totalStock = categoryData.reduce((s, c) => s + c.stock, 0);

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="mb-4">
          <p className="rp-card-title mb-0">Category Analysis</p>
          <p className="rp-card-subtitle">
            {categoryData.length} categories · {totalMeds} medicines · {totalStock} units
          </p>
        </div>

        {/* Progress rows */}
        {categoryData.map((cat, i) => {
          const pct      = Math.round((cat.stock / maxStock) * 100);
          const barClass = BAR_CLASSES[i % BAR_CLASSES.length];
          const badge    = BADGE_STYLES[i % BADGE_STYLES.length];

          return (
            <div key={cat.category} className="rp-progress-row">
              <div className="rp-progress-label-row">
                <span className="rp-progress-name">
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      borderRadius: '99px',
                      padding: '2px 9px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {cat.category}
                  </span>
                  <span className="rp-progress-meta">
                    {cat.count} medicine{cat.count !== 1 ? 's' : ''}
                  </span>
                </span>
                <span className="rp-progress-value">{cat.stock} units</span>
              </div>
              <div className="rp-progress">
                <div
                  className={`rp-progress-bar ${barClass}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          );
        })}

        {/* Summary badge pills */}
        <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          {categoryData.map((cat, i) => {
            const badge  = BADGE_STYLES[i % BADGE_STYLES.length];
            const pct    = totalStock > 0 ? Math.round((cat.stock / totalStock) * 100) : 0;
            return (
              <span
                key={cat.category}
                style={{
                  background: badge.bg,
                  color: badge.color,
                  borderRadius: '99px',
                  padding: '3px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {cat.category}: {pct}%
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CategoryAnalysis;
