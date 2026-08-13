/**
 * @file        ExpiryCards.jsx
 * @module      Expiry
 * @purpose     Renders 5 summary stat cards at the top of the Expiry page.
 *              Calculates counts locally from the provided medicines array.
 *              Zero extra Firestore reads.
 * @dependencies react, react-icons, inventory.css
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

// ─────────────────────────────────────────────────────────────────────────────
// CARD CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CARD_CONFIG = [
  {
    key: "expired",
    label: "Expired",
    icon: FiAlertOctagon,
    colorClass: "inv-stat-red",
  },
  {
    key: "days30",
    label: "30 Days",
    icon: FiAlertTriangle,
    colorClass: "inv-stat-orange",
  },
  {
    key: "days60",
    label: "60 Days",
    icon: FiClock,
    colorClass: "inv-stat-yellow",
  },
  {
    key: "days90",
    label: "90 Days",
    icon: FiCalendar,
    colorClass: "inv-stat-indigo",
  },
  {
    key: "total",
    label: "Total Monitored",
    icon: FiPackage,
    colorClass: "inv-stat-blue",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-2-4">
      <div className="inv-stat-card inv-stat-skeleton">
        <div className="inv-skeleton-icon" />
        <div className="inv-skeleton-value" />
        <div className="inv-skeleton-label" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ExpiryCards({ medicines, loading }) {
  // Compute stats in one pass
  const stats = useMemo(() => {
    if (!medicines) return null;

    let expired = 0;
    let days30 = 0;
    let days60 = 0;
    let days90 = 0;

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
      {CARD_CONFIG.map(({ key, label, icon: Icon, colorClass }) => (
        <div key={key} className="col-6 col-sm-6 col-md-4 col-lg-2-4">
          <div className={`inv-stat-card ${colorClass}`}>
            <div className="inv-stat-icon-wrap">
              <Icon size={22} className="inv-stat-icon" />
            </div>
            <div className="inv-stat-value">
              {stats?.[key]?.toLocaleString() ?? 0}
            </div>
            <div className="inv-stat-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExpiryCards;
