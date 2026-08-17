/**
 * @file        reportsConstants.js
 * @module      Reports
 * @purpose     Central store for all constants used in the Reports module.
 *              No magic strings anywhere else — import from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION NAMES
// Reused from existing Firestore schema — do NOT rename these.
// ─────────────────────────────────────────────────────────────────────────────
export const REPORT_COLLECTIONS = {
  SALES:          'sales',
  SALE_ITEMS:     'saleItems',
  MEDICINES:      'medicines',
  INVENTORY_LOGS: 'inventoryLogs',
  NOTIFICATIONS:  'notifications',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE FILTER PRESETS
// value: unique key | label: UI display text
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_FILTERS = [
  { value: 'today',       label: 'Today'         },
  { value: 'yesterday',   label: 'Yesterday'     },
  { value: 'last7days',   label: 'Last 7 Days'   },
  { value: 'last30days',  label: 'Last 30 Days'  },
  { value: 'thisMonth',   label: 'This Month'    },
  { value: 'lastMonth',   label: 'Last Month'    },
  { value: 'custom',      label: 'Custom Range'  },
];

export const DEFAULT_DATE_FILTER = 'last30days';

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY WINDOWS (days)
// Used to bucket medicines into expiry risk groups.
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_WINDOWS = [30, 60, 90];

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT METHODS
// Must match the values stored in the 'sales' collection's paymentMethod field.
// ─────────────────────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT FILENAMES
// ─────────────────────────────────────────────────────────────────────────────
export const CSV_FILENAMES = {
  SALES:          'sales_report',
  INVENTORY:      'inventory_report',
  EXPIRY:         'expiry_report',
  TOP_MEDICINES:  'top_medicines',
  PAYMENT:        'payment_methods_report',
};
