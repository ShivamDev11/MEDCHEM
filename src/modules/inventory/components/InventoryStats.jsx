/**
 * @file        InventoryStats.jsx
 * @module      Inventory
 * @purpose     Renders 5 summary stat cards at the top of the Inventory list page.
 *              Fetches aggregate data from inventoryService on mount and displays
 *              loading, error, and success states. Card config is derived via
 *              useMemo to avoid recomputation on every parent re-render.
 * @dependencies react, react-icons, inventoryService, inventoryConstants, inventory.css
 * @exports     InventoryStats (default)
 */

import { useState, useEffect, useMemo } from "react";
import {
  FiPackage,
  FiLayers,
  FiAlertTriangle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { getInventoryStats } from "../services/inventoryService";
import { TOAST_MESSAGES } from "../constants/inventoryConstants";

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD VISUAL CONFIG
// Defines icon, label, colour tokens per card slot.
// Only the `value` field is filled at runtime from Firestore data.
// ─────────────────────────────────────────────────────────────────────────────
const CARD_CONFIG = [
  {
    key:        "totalMedicines",
    label:      "Total Medicines",
    icon:       FiPackage,
    colorClass: "inv-stat-blue",
    id:         "inv-stat-total-medicines",
    ariaLabel:  "Total number of medicines in inventory",
  },
  {
    key:        "totalStockQty",
    label:      "Total Stock Qty",
    icon:       FiLayers,
    colorClass: "inv-stat-indigo",
    id:         "inv-stat-total-stock",
    ariaLabel:  "Total quantity of all medicine units in stock",
  },
  {
    key:        "lowStock",
    label:      "Low Stock",
    icon:       FiAlertTriangle,
    colorClass: "inv-stat-orange",
    id:         "inv-stat-low-stock",
    ariaLabel:  "Medicines with stock at or below minimum threshold",
  },
  {
    key:        "expiringSoon",
    label:      "Expiring Soon",
    icon:       FiClock,
    colorClass: "inv-stat-yellow",
    id:         "inv-stat-expiring",
    ariaLabel:  "Medicines expiring within the next 30 days",
  },
  {
    key:        "outOfStock",
    label:      "Out of Stock",
    icon:       FiXCircle,
    colorClass: "inv-stat-red",
    id:         "inv-stat-out-of-stock",
    ariaLabel:  "Medicines with zero quantity remaining",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON — shown while stats are being fetched
// ─────────────────────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-2-4">
      <div className="inv-stat-card inv-stat-skeleton" aria-hidden="true">
        <div className="inv-skeleton-icon" />
        <div className="inv-skeleton-value" />
        <div className="inv-skeleton-label" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ config, value }) {
  const Icon = config.icon;

  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-2-4">
      <div
        className={`inv-stat-card ${config.colorClass}`}
        id={config.id}
        aria-label={config.ariaLabel}
        role="region"
      >
        {/* Icon bubble */}
        <div className="inv-stat-icon-wrap">
          <Icon size={22} className="inv-stat-icon" aria-hidden="true" />
        </div>

        {/* Value */}
        <div className="inv-stat-value">
          {value?.toLocaleString() ?? "—"}
        </div>

        {/* Label */}
        <div className="inv-stat-label">{config.label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function InventoryStats() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [stats,   setStats]   = useState(null);   // null = not yet loaded
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInventoryStats();
      setStats(data);
    } catch (err) {
      console.error("[InventoryStats] Failed to load stats:", err);
      setError(TOAST_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Run once on mount — stats refresh when user triggers a CRUD action
    // via the parent Inventory page calling a re-fetch.
  }, []);

  /**
   * Memoized card list — merges CARD_CONFIG (static) with live stats values.
   * Only recomputes when `stats` object reference changes — not on every render.
   */
  const cards = useMemo(() => {
    if (!stats) return [];
    return CARD_CONFIG.map((config) => ({
      config,
      value: stats[config.key] ?? 0,
    }));
  }, [stats]);

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="row g-3 mb-4" aria-busy="true" aria-label="Loading statistics">
        {CARD_CONFIG.map((config) => (
          <StatCardSkeleton key={config.key} />
        ))}
      </div>
    );
  }

  // ── Render: Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="inv-stats-error-wrap mb-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="alert inv-alert-error d-flex align-items-center justify-content-between mb-0">
          <span>
            <FiXCircle size={16} className="me-2" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            className="btn btn-sm inv-btn-retry"
            onClick={fetchStats}
            aria-label="Retry loading statistics"
            id="inv-stats-retry-btn"
          >
            <FiRefreshCw size={14} className="me-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Success ────────────────────────────────────────────────────────
  return (
    <div
      className="row g-3 mb-4"
      role="region"
      aria-label="Inventory summary statistics"
    >
      {cards.map(({ config, value }) => (
        <StatCard key={config.key} config={config} value={value} />
      ))}
    </div>
  );
}

export default InventoryStats;
