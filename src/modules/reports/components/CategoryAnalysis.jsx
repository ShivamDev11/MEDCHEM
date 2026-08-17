/**
 * @file        CategoryAnalysis.jsx
 * @module      Reports
 * @purpose     Medicine category breakdown — count and stock per category.
 *              Pure Bootstrap progress bars, no chart library.
 */

// Bootstrap badge colors cycled per category
const BADGE_COLORS = [
  'primary', 'success', 'info', 'warning', 'danger',
  'secondary', 'dark', 'primary', 'success', 'info',
];

function CategoryAnalysis({ categoryData, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Category Analysis</h6>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="placeholder col-4 rounded" />
                <span className="placeholder col-2 rounded" />
              </div>
              <div className="placeholder col-12 rounded" style={{ height: '10px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 text-center text-muted">
          <h6 className="fw-bold mb-2">Category Analysis</h6>
          <p className="mb-0 small">No inventory data available.</p>
        </div>
      </div>
    );
  }

  const maxStock     = Math.max(...categoryData.map((c) => c.stock), 1);
  const totalMeds    = categoryData.reduce((s, c) => s + c.count, 0);
  const totalStock   = categoryData.reduce((s, c) => s + c.stock, 0);

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-bold mb-0">Category Analysis</h6>
            <p className="text-muted small mb-0">
              {categoryData.length} categories · {totalMeds} medicines · {totalStock} units
            </p>
          </div>
        </div>

        {categoryData.map((cat, i) => {
          const pct   = Math.round((cat.stock / maxStock) * 100);
          const color = BADGE_COLORS[i % BADGE_COLORS.length];

          return (
            <div key={cat.category} className="mb-3">
              {/* Label row */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge bg-${color} rounded-pill`} style={{ fontSize: '0.7rem' }}>
                    {cat.category}
                  </span>
                  <span className="text-muted small">
                    {cat.count} medicine{cat.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="fw-semibold small">{cat.stock} units</span>
              </div>

              {/* Progress bar */}
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className={`progress-bar bg-${color}`}
                  style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          );
        })}

        {/* Summary badges */}
        <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top">
          {categoryData.map((cat, i) => {
            const color = BADGE_COLORS[i % BADGE_COLORS.length];
            const pct   = totalStock > 0
              ? Math.round((cat.stock / totalStock) * 100)
              : 0;
            return (
              <span
                key={cat.category}
                className={`badge bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-25 rounded-pill px-2 py-1`}
                style={{ fontSize: '0.72rem' }}
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
