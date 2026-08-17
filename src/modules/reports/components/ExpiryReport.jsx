/**
 * @file        ExpiryReport.jsx
 * @module      Reports
 * @purpose     4 expiry bucket cards — Expired, 30/60/90 day windows.
 *              Color-coded by urgency. No logic — renders expiryKPIs.
 */

import { FiAlertOctagon, FiAlertTriangle, FiClock, FiInfo } from 'react-icons/fi';

const BUCKETS = [
  {
    key:     'expired',
    label:   'Expired',
    sub:     'Already past expiry date',
    icon:    FiAlertOctagon,
    color:   'danger',
    bg:      'rgba(220,53,69,0.07)',
  },
  {
    key:     'within30',
    label:   'Expiring in 30 Days',
    sub:     'Needs immediate attention',
    icon:    FiAlertTriangle,
    color:   'warning',
    bg:      'rgba(255,193,7,0.07)',
  },
  {
    key:     'within60',
    label:   'Expiring in 60 Days',
    sub:     'Plan stock rotation',
    icon:    FiClock,
    color:   'orange',
    bg:      'rgba(253,126,20,0.07)',
    textColor: '#fd7e14',
  },
  {
    key:     'within90',
    label:   'Expiring in 90 Days',
    sub:     'Monitor regularly',
    icon:    FiInfo,
    color:   'info',
    bg:      'rgba(13,202,240,0.07)',
  },
];

function ExpiryReport({ expiryKPIs, loading }) {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <div className="mb-3">
          <h6 className="fw-bold mb-0">Expiry Summary</h6>
          <p className="text-muted small mb-0">Medicines grouped by expiry risk window</p>
        </div>

        <div className="row g-3">
          {BUCKETS.map((bucket) => {
            const Icon  = bucket.icon;
            const value = expiryKPIs?.[bucket.key] ?? 0;
            const textColor = bucket.textColor || `var(--bs-${bucket.color})`;

            return (
              <div key={bucket.key} className="col-6 col-md-3">
                <div
                  className="rounded-3 p-3 h-100 border"
                  style={{
                    backgroundColor: bucket.bg,
                    borderColor: `rgba(0,0,0,0.06)`,
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Icon size={18} style={{ color: textColor }} />
                    <span className="small fw-semibold text-muted">{bucket.label}</span>
                  </div>

                  {loading ? (
                    <div className="placeholder col-6 rounded" style={{ height: '28px' }} />
                  ) : (
                    <div
                      className="display-6 fw-bold"
                      style={{ color: textColor, lineHeight: 1.1 }}
                    >
                      {value}
                    </div>
                  )}

                  <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.72rem' }}>
                    {bucket.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick note */}
        {!loading && expiryKPIs?.expired > 0 && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2">
            <FiAlertOctagon size={16} />
            <span className="small">
              <strong>{expiryKPIs.expired}</strong> medicine{expiryKPIs.expired !== 1 ? 's are' : ' is'} expired and should be removed from inventory.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpiryReport;
