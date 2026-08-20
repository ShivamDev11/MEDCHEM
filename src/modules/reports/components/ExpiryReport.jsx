/**
 * @file        ExpiryReport.jsx
 * @module      Reports
 * @purpose     4 expiry bucket cards — Expired, 30/60/90 day windows.
 *              Color-coded by urgency. No logic — renders expiryKPIs.
 */

import { FiAlertOctagon, FiAlertTriangle, FiClock, FiInfo } from 'react-icons/fi';

const BUCKETS = [
  {
    key:       'expired',
    label:     'Expired',
    sub:       'Remove from inventory',
    icon:      FiAlertOctagon,
    bg:        'rgba(239,68,68,0.06)',
    color:     '#dc2626',
    border:    'rgba(239,68,68,0.18)',
  },
  {
    key:       'within30',
    label:     '≤ 30 Days',
    sub:       'Needs immediate attention',
    icon:      FiAlertTriangle,
    bg:        'rgba(245,158,11,0.06)',
    color:     '#d97706',
    border:    'rgba(245,158,11,0.2)',
  },
  {
    key:       'within60',
    label:     '≤ 60 Days',
    sub:       'Plan stock rotation',
    icon:      FiClock,
    bg:        'rgba(253,126,20,0.06)',
    color:     '#fd7e14',
    border:    'rgba(253,126,20,0.18)',
  },
  {
    key:       'within90',
    label:     '≤ 90 Days',
    sub:       'Monitor regularly',
    icon:      FiInfo,
    bg:        'rgba(6,182,212,0.06)',
    color:     '#0891b2',
    border:    'rgba(6,182,212,0.18)',
  },
];

function ExpiryReport({ expiryKPIs, loading }) {
  return (
    <div className="rp-card mb-4">
      <div className="rp-card-body">
        {/* Header */}
        <div className="mb-4">
          <p className="rp-card-title mb-0">Expiry Summary</p>
          <p className="rp-card-subtitle">Medicines grouped by expiry risk window</p>
        </div>

        <div className="row g-3">
          {BUCKETS.map((bucket) => {
            const Icon  = bucket.icon;
            const value = expiryKPIs?.[bucket.key] ?? 0;

            return (
              <div key={bucket.key} className="col-6 col-md-3">
                <div
                  className="rp-expiry-bucket"
                  style={{
                    backgroundColor: bucket.bg,
                    borderColor: bucket.border,
                  }}
                >
                  <div className="rp-expiry-label" style={{ color: bucket.color }}>
                    <Icon size={15} />
                    {bucket.label}
                  </div>

                  {loading ? (
                    <div className="placeholder rounded mt-2" style={{ width: '50%', height: '2rem', display: 'block' }} />
                  ) : (
                    <div className="rp-expiry-num" style={{ color: bucket.color }}>
                      {value}
                    </div>
                  )}

                  <p className="rp-expiry-sub">{bucket.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical alert */}
        {!loading && expiryKPIs?.expired > 0 && (
          <div
            className="d-flex align-items-center gap-2 mt-4 p-3 rounded-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <FiAlertOctagon size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#991b1b' }}>
              <strong>{expiryKPIs.expired}</strong> medicine{expiryKPIs.expired !== 1 ? 's are' : ' is'} expired and should be removed from inventory.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpiryReport;
