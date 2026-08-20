/**
 * @file        SalesTrendChart.jsx
 * @module      Reports
 * @purpose     Last 7-day sales trend using pure CSS bars.
 *              No charting library — custom CSS only.
 */

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

function SalesTrendChart({ salesTrend, loading }) {
  if (loading) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body">
          <p className="rp-card-title mb-1">Sales Trend</p>
          <div className="rp-bar-wrap mt-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rp-bar-col">
                <div
                  className="placeholder rp-bar"
                  style={{ height: `${30 + ((i * 37) % 60)}%`, background: '#e5e7eb' }}
                />
                <div className="placeholder mt-2 rounded" style={{ width: '36px', height: '10px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!salesTrend || salesTrend.revenues.every((r) => r === 0)) {
    return (
      <div className="rp-card mb-4">
        <div className="rp-card-body rp-empty">
          <div className="rp-empty-icon">📊</div>
          <p className="rp-card-title mb-1">Sales Trend</p>
          <p className="rp-empty-text mb-0">No sales data available for this period.</p>
        </div>
      </div>
    );
  }

  const { labels, revenues, counts } = salesTrend;
  const maxRevenue = Math.max(...revenues, 1);

  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <p className="rp-card-title mb-0">Sales Trend ({salesTrend.daysRendered} Days)</p>
            <p className="rp-card-subtitle">Daily revenue overview</p>
          </div>
          {/* Legend */}
          <div className="d-flex align-items-center gap-2">
            <span className="rp-legend-dot" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }} />
            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Daily Revenue (₹)</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="rp-bar-wrap">
          {labels.map((label, i) => {
            const heightPct = Math.max((revenues[i] / maxRevenue) * 100, 2);
            const hasData   = revenues[i] > 0;

            return (
              <div
                key={label}
                className="rp-bar-col"
                title={`${label}: ₹${fmt(revenues[i])} | ${counts[i]} sale(s)`}
              >
                {hasData && (
                  <span className="rp-bar-amount">₹{fmt(revenues[i])}</span>
                )}

                <div
                  className={`rp-bar${hasData ? '' : ' empty'}`}
                  style={{ height: `${heightPct}%` }}
                />

                <span className="rp-bar-day">{label}</span>

                {hasData && (
                  <span className="rp-bar-count">
                    {counts[i]} sale{counts[i] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SalesTrendChart;
