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
  PURCHASES:      'purchases',
  PURCHASE_ITEMS: 'purchaseItems',
  SUPPLIERS:      'suppliers',
  INVENTORY_LOGS: 'inventoryLogs',
  NOTIFICATIONS:  'notifications',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE FILTER PRESETS
// value: unique key | label: UI display text
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_FILTERS = [
  { value: 'today',        label: 'Today'           },
  { value: 'yesterday',    label: 'Yesterday'       },
  { value: 'last7days',    label: 'Last 7 Days'     },
  { value: 'last30days',   label: 'Last 30 Days'    },
  { value: 'thisMonth',    label: 'This Month'      },
  { value: 'lastMonth',    label: 'Last Month'      },
  { value: 'thisYear',     label: 'This Year'       },
  { value: 'custom',       label: 'Custom Range'    },
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
  PURCHASES:      'purchases_report',
  SUPPLIERS:      'supplier_analytics',
};

// ─────────────────────────────────────────────────────────────────────────────
// CHART COLOUR PALETTE
// Consistent colours used across all charts.
// ─────────────────────────────────────────────────────────────────────────────
export const CHART_COLORS = {
  primary:   '#3b82f6',
  success:   '#10b981',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  info:      '#06b6d4',
  secondary: '#6b7280',
  purple:    '#8b5cf6',
  orange:    '#f97316',
  pink:      '#ec4899',
  teal:      '#14b8a6',
};

export const CHART_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#6b7280',
];

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT METHOD COLOURS (for pie chart segments)
// ─────────────────────────────────────────────────────────────────────────────
export const PAYMENT_COLORS = {
  Cash: '#10b981',
  UPI:  '#3b82f6',
  Card: '#8b5cf6',
};

// ─────────────────────────────────────────────────────────────────────────────
// STOCK STATUS COLOURS
// ─────────────────────────────────────────────────────────────────────────────
export const STOCK_STATUS_COLORS = {
  'In Stock':    '#10b981',
  'Low Stock':   '#f59e0b',
  'Out of Stock':'#ef4444',
  'Expired':     '#6b7280',
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY BUCKET COLOURS
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_COLORS = {
  expired:  '#ef4444',
  within30: '#f59e0b',
  within60: '#f97316',
  within90: '#06b6d4',
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DRAWER MODES
// Identifies what content the ReportDetailDrawer is rendering.
// ─────────────────────────────────────────────────────────────────────────────
export const DRAWER_MODES = {
  SALES_LIST:       'sales-list',
  SALE_DETAIL:      'sale-detail',
  INVENTORY_LIST:   'inventory-list',
  LOW_STOCK_LIST:   'low-stock-list',
  EXPIRY_LIST:      'expiry-list',
  TOP_PRODUCTS:     'top-products',
  PRODUCT_DETAIL:   'product-detail',
  SUPPLIER_DETAIL:  'supplier-detail',
  PURCHASE_LIST:    'purchase-list',
  PROFIT_LIST:      'profit-list',
};

// ─────────────────────────────────────────────────────────────────────────────
// TOP PRODUCTS VIEW OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const TOP_PRODUCTS_LIMITS = [5, 10, 20];
export const TOP_PRODUCTS_METRICS = [
  { value: 'quantity', label: 'By Quantity Sold' },
  { value: 'revenue',  label: 'By Revenue'       },
];
