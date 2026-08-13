/**
 * @file        expiryConstants.js
 * @module      Expiry
 * @purpose     Central constants for the Expiry Management module.
 *              All status labels, colors, thresholds, search fields, sort options,
 *              filter tabs, and table columns are defined here.
 *              No magic strings or numbers anywhere else — import from here.
 * @dependencies None — pure JS constants, no external imports.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY STATUS LABELS
// Derived at render time based on days remaining until expiry.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_STATUS = {
  EXPIRED:  "EXPIRED",
  CRITICAL: "CRITICAL",
  WARNING:  "WARNING",
  UPCOMING: "UPCOMING",
  SAFE:     "SAFE",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY STATUS → BOOTSTRAP BADGE CLASSES
// Maps each status to a Bootstrap 5 badge utility class.
// Used by ExpiryStatusBadge.jsx — never hardcoded in any other component.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_STATUS_COLORS = {
  [EXPIRY_STATUS.EXPIRED]:  "bg-dark text-white",
  [EXPIRY_STATUS.CRITICAL]: "bg-danger text-white",
  [EXPIRY_STATUS.WARNING]:  "bg-warning text-dark",
  [EXPIRY_STATUS.UPCOMING]: "bg-info text-dark",
  [EXPIRY_STATUS.SAFE]:     "bg-success text-white",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY STATUS THRESHOLDS (in days)
// getDaysRemaining() result is compared against these to determine status.
//   days < 0           → EXPIRED
//   0 ≤ days ≤ 30      → CRITICAL
//   31 ≤ days ≤ 60     → WARNING
//   61 ≤ days ≤ 90     → UPCOMING
//   days > 90           → SAFE
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_THRESHOLDS = {
  CRITICAL: 30,
  WARNING:  60,
  UPCOMING: 90,
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH FIELDS
// Drives the field-selector dropdown in ExpiryFilters.
// Includes barcode for consistency with Module 3 (salesService.js).
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_SEARCH_FIELDS = [
  { value: "medicineName", label: "Medicine Name" },
  { value: "genericName",  label: "Generic Name"  },
  { value: "batchNumber",  label: "Batch Number"  },
  { value: "barcode",      label: "Barcode"       },
];

// ─────────────────────────────────────────────────────────────────────────────
// SORT OPTIONS
// Client-side sorting on the already-loaded medicines array.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_SORT_OPTIONS = [
  { value: "nearest", label: "Nearest Expiry" },
  { value: "latest",  label: "Latest Expiry"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS
// Each tab filters the medicines array by days remaining range.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_FILTER_TABS = [
  { value: "ALL",     label: "All"      },
  { value: "EXPIRED", label: "Expired"  },
  { value: "30",      label: "30 Days"  },
  { value: "60",      label: "60 Days"  },
  { value: "90",      label: "90 Days"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TABLE COLUMNS
// Drives the ExpiryTable header row.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_TABLE_COLUMNS = [
  { key: "medicineName", label: "Medicine Name" },
  { key: "genericName",  label: "Generic Name"  },
  { key: "batchNumber",  label: "Batch No."     },
  { key: "category",     label: "Category"      },
  { key: "quantity",     label: "Stock"          },
  { key: "expiryDate",  label: "Expiry Date"    },
  { key: "daysRemaining", label: "Days Left"    },
  { key: "expiryStatus", label: "Status"        },
  { key: "actions",      label: "Action"        },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOAST MESSAGES
// All user-facing notification strings for the Expiry module.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_TOAST_MESSAGES = {
  LOAD_ERROR:       "❌ Failed to load expiry data. Please try again.",
  ALERTS_GENERATED: "✅ Expiry alerts generated successfully.",
  ALERTS_ERROR:     "❌ Failed to generate expiry alerts.",
  NO_NEW_ALERTS:    "ℹ️ No new expiry alerts to generate.",
};
