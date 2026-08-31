/**
 * @file        smartOpsConstants.js
 * @module      SmartOperations (Module 7)
 * @purpose     Central store for every constant used in the Smart Operations module.
 *              No magic strings or numbers anywhere else — import from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE COLLECTION NAMES
// ─────────────────────────────────────────────────────────────────────────────
export const SO_COLLECTIONS = {
  SUPPLIERS:      'suppliers',
  PURCHASES:      'purchases',
  PURCHASE_ITEMS: 'purchaseItems',
  MEDICINES:      'medicines',
  INVENTORY_LOGS: 'inventoryLogs',
  ACTIVITY_LOGS:  'activityLogs',
  SALES:          'sales',
  SALE_ITEMS:     'saleItems',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const SUPPLIER_STATUS = {
  ACTIVE:   'ACTIVE',
  INACTIVE: 'INACTIVE',
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const PURCHASE_STATUS = {
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINE STATUS (mirrors inventoryConstants to avoid cross-module import)
// ─────────────────────────────────────────────────────────────────────────────
export const MED_STATUS = {
  ACTIVE:  'ACTIVE',
  DELETED: 'DELETED',
};

// ─────────────────────────────────────────────────────────────────────────────
// REORDER FORMULA
// suggestedReorder = minimumStock * REORDER_MULTIPLIER - currentStock
// ─────────────────────────────────────────────────────────────────────────────
export const REORDER_MULTIPLIER = 2;

// ─────────────────────────────────────────────────────────────────────────────
// ACTION TYPES (for activity logs)
// ─────────────────────────────────────────────────────────────────────────────
export const SO_ACTION_TYPES = {
  PURCHASE_CREATED:  'PURCHASE_CREATED',
  SUPPLIER_CREATED:  'SUPPLIER_CREATED',
  SUPPLIER_UPDATED:  'SUPPLIER_UPDATED',
  SUPPLIER_DELETED:  'SUPPLIER_DELETED',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER FORM DEFAULT VALUES
// ─────────────────────────────────────────────────────────────────────────────
export const SUPPLIER_FORM_DEFAULTS = {
  name:       '',
  contactNumber: '',
  email:      '',
  address:    '',
  status:     SUPPLIER_STATUS.ACTIVE,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST / USER MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
export const SO_TOAST = {
  SUPPLIER_ADDED:    '✅ Supplier added successfully.',
  SUPPLIER_UPDATED:  '✅ Supplier updated successfully.',
  SUPPLIER_DELETED:  '🗑️ Supplier removed successfully.',
  PURCHASE_CREATED:  '✅ Purchase recorded. Stock updated.',
  LOAD_ERROR:        '❌ Failed to load data. Please try again.',
  SAVE_ERROR:        '❌ Failed to save. Please try again.',
  DELETE_ERROR:      '❌ Failed to delete. Please try again.',
  VALIDATION_FAILED: '⚠️ Please fix the errors before submitting.',
  DUPLICATE_SUPPLIER:'⚠️ A supplier with this name already exists.',
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE FILTER OPTIONS (reused across Purchases, StockHistory)
// ─────────────────────────────────────────────────────────────────────────────
export const DATE_FILTERS = [
  { value: 'ALL',    label: 'All Time'       },
  { value: 'TODAY',  label: 'Today'          },
  { value: '7DAYS',  label: 'Last 7 Days'    },
  { value: '30DAYS', label: 'Last 30 Days'   },
  { value: 'CUSTOM', label: 'Custom Range'   },
];
