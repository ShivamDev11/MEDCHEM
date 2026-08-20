/**
 * @file        ExpiryCards.jsx
 * @module      Expiry
 * @purpose     Renders 5 summary stat cards at the top of the Expiry page.
 *              Calculates counts locally from the provided medicines array.
 *              Zero extra Firestore reads.
 * @dependencies react, react-icons, expiry.css
 * @exports     ExpiryCards (default)
 */

import { useMemo } from "react";
import {
  FiAlertOctagon,
  FiAlertTriangle,
  FiClock,
  FiCalendar,
  FiPackage,
} from "react-icons/fi";

const CARD_CONFIG = [
  {
    key: "expired",
    label: "Expired Items",
    hint: "High critical risk",
    icon: FiAlertOctagon,
    kpiClass: "exp-kpi-red",
  },
  {
    key: "days30",
    label: "Expiring 30 Days",
    hint: "Critical status",
    icon: FiAlertTriangle,
    kpiClass: "exp-kpi-orange",
  },
  {
    key: "days60",
    label: "Expiring 60 Days",
    hint: "Warning status",
    icon: FiClock,
    kpiClass: "exp-kpi-yellow",
  },
  {
    key: "days90",
    label: "Expiring 90 Days",
    hint: "Upcoming alert",
    icon: FiCalendar,
    kpiClass: "exp-kpi-indigo",
  },
  {
    key: "total",
    label: "Total Monitored",
    hint: "Active batch count",
    icon: FiPackage,
    kpiClass: "exp-kpi-blue",
  },
];

function StatCardSkeleton() {
  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-2-4">
      <div className="exp-kpi-card inv-stat-skeleton">
        <div className="inv-skeleton-icon" />
        <div className="inv-skeleton-value" />
        <div className="inv-skeleton-label" />
      </div>
    </div>
  );
}

function ExpiryCards({ medicines, loading }) {
  const stats = useMemo(() => {
    if (!medicines) return null;

    let expired = 0;
    let days30  = 0;
    let days60  = 0;
    let days90  = 0;

    medicines.forEach((med) => {
      const days = med.daysRemaining;
      if (days < 0) expired++;
      else if (days <= 30) days30++;
      else if (days <= 60) days60++;
      else if (days <= 90) days90++;
    });

    return {
      expired,
      days30,
      days60,
      days90,
      total: medicines.length,
    };
  }, [medicines]);

  if (loading) {
    return (
      <div className="row g-3 mb-4">
        {CARD_CONFIG.map((config) => (
          <StatCardSkeleton key={config.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3 mb-4">
      {CARD_CONFIG.map(({ key, label, hint, icon: Icon, kpiClass }) => (
        <div key={key} className="col-6 col-sm-6 col-md-4 col-lg-2-4">
          <div className={`exp-kpi-card ${kpiClass}`}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1 text-uppercase small fw-bold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                  {label}
                </h6>
                <h4 className="mb-0 fw-bold text-dark" style={{ letterSpacing: "-0.02em" }}>
                  {stats?.[key]?.toLocaleString() ?? 0}
                </h4>
                <div className="small text-muted mt-1" style={{ fontSize: "0.7rem" }}>{hint}</div>
              </div>
              <div className="exp-kpi-icon-wrap">
                <Icon size={20} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExpiryCards;
