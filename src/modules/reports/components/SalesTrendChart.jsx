/**
 * @file        SalesTrendChart.jsx
 * @module      Reports
 * @purpose     Last 7-day sales trend using pure CSS bars.
 *              No charting library — Bootstrap + inline styles only.
 */

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

function SalesTrendChart({ salesTrend, loading }) {
  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">Sales Trend</h6>
          <div className="d-flex align-items-end gap-2" style={{ height: '160px' }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-fill d-flex flex-column align-items-center gap-1">
                <div
                  className="placeholder rounded-top w-100"
                  style={{ height: `${30 + ((i * 37) % 60)}%` }}
                />
                <div className="placeholder col-8 rounded" style={{ height: '10px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!salesTrend || salesTrend.revenues.every((r) => r === 0)) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 text-center text-muted">
          <h6 className="fw-bold mb-2">Sales Trend</h6>
          <p className="mb-0 small">No sales data available for this period.</p>
        </div>
      </div>
    );
  }

  const { labels, revenues, counts } = salesTrend;
  const maxRevenue = Math.max(...revenues, 1); // avoid div-by-zero

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h6 className="fw-bold mb-1">Sales Trend ({salesTrend.daysRendered} Days)</h6>
        <p className="text-muted small mb-3">Daily revenue overview</p>

        {/* Bar Chart */}
        <div 
          className="d-flex align-items-end gap-1" 
          style={{ height: '160px', overflowX: 'auto', overflowY: 'hidden' }}
        >
          {labels.map((label, i) => {
            const heightPct = Math.max((revenues[i] / maxRevenue) * 100, 2);
            const hasData   = revenues[i] > 0;

            return (
              <div
                key={label}
                className="flex-fill d-flex flex-column align-items-center justify-content-end"
                style={{ height: '100%' }}
                title={`${label}: ₹${fmt(revenues[i])} | ${counts[i]} sale(s)`}
              >
                {/* Revenue label above bar */}
                {hasData && (
                  <span style={{ fontSize: '0.65rem', color: '#6c757d', marginBottom: '2px' }}>
                    ₹{fmt(revenues[i])}
                  </span>
                )}

                {/* The bar */}
                <div
                  className={`w-100 rounded-top ${hasData ? 'bg-primary' : 'bg-light border'}`}
                  style={{
                    height:     `${heightPct}%`,
                    minHeight:  '4px',
                    transition: 'height 0.4s ease',
                  }}
                />

                {/* Day label */}
                <span
                  className="text-muted mt-1 text-center"
                  style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                >
                  {label}
                </span>

                {/* Sale count badge */}
                {hasData && (
                  <span style={{ fontSize: '0.65rem', color: '#6c757d' }}>
                    {counts[i]} sale{counts[i] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="d-flex align-items-center gap-2 mt-3">
          <div className="bg-primary rounded" style={{ width: '12px', height: '12px' }} />
          <span className="text-muted small">Daily Revenue (₹)</span>
        </div>
      </div>
    </div>
  );
}

export default SalesTrendChart;
