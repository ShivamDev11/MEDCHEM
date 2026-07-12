/**
 * @file        inventoryConstants.js
 * @module      Inventory
 * @purpose     Central store for every constant used across the Inventory module.
 *              No magic strings or numbers anywhere else — import from here.
 * @dependencies None — pure JS constants, no external imports.
 * @exports     MEDICINE_CATEGORIES, MEDICINE_STATUS, TOAST_MESSAGES,
 *              PAGINATION_LIMIT, TABLE_COLUMNS, STOCK_STATUS,
 *              STOCK_STATUS_COLORS, EXPIRY_WARNING_DAYS, SORT_OPTIONS,
 *              SEARCH_FIELDS, FORM_DEFAULT_VALUES, VALIDATION_RULES
 */

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINE CATEGORIES
// Used in: MedicineForm dropdown, SearchBar filter, constants validation
// ─────────────────────────────────────────────────────────────────────────────
export const MEDICINE_CATEGORIES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream / Ointment",
  "Drops",
  "Inhaler",
  "Powder",
  "Supplement",
  "Other",
];

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINE STATUS
// Soft-delete pattern — documents are never hard-deleted from Firestore.
// All read queries must filter:  where("status", "==", MEDICINE_STATUS.ACTIVE)
// ─────────────────────────────────────────────────────────────────────────────
export const MEDICINE_STATUS = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST MESSAGES
// All user-facing notification strings in one place.
// Used in: inventoryService.js, AddMedicine, EditMedicine, Inventory pages.
// ─────────────────────────────────────────────────────────────────────────────
export const TOAST_MESSAGES = {
  MEDICINE_ADDED:     "✅ Medicine added successfully.",
  MEDICINE_UPDATED:   "✅ Medicine updated successfully.",
  MEDICINE_DELETED:   "🗑️ Medicine deleted successfully.",
  DUPLICATE_FOUND:    "⚠️ A medicine with this name and batch number already exists.",
  NETWORK_ERROR:      "❌ Network error. Please check your connection and try again.",
  VALIDATION_FAILED:  "⚠️ Please fix the validation errors before submitting.",
  LOAD_ERROR:         "❌ Failed to load medicines. Please try again.",
  DELETE_ERROR:       "❌ Failed to delete medicine. Please try again.",
  UPDATE_ERROR:       "❌ Failed to update medicine. Please try again.",
  CREATE_ERROR:       "❌ Failed to add medicine. Please try again.",
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// Server-side pagination limit — how many documents Firestore returns per page.
// ─────────────────────────────────────────────────────────────────────────────
export const PAGINATION_LIMIT = 10;

// ─────────────────────────────────────────────────────────────────────────────
// TABLE COLUMNS
// Drives the MedicineTable header row.
// sortable: true → clicking the header triggers Firestore orderBy change.
// ─────────────────────────────────────────────────────────────────────────────
export const TABLE_COLUMNS = [
  { key: "medicineName",  label: "Medicine Name",  sortable: true  },
  { key: "genericName",   label: "Generic Name",   sortable: false },
  { key: "category",      label: "Category",       sortable: true  },
  { key: "manufacturer",  label: "Manufacturer",   sortable: false },
  { key: "supplier",      label: "Supplier",       sortable: false },
  { key: "batchNumber",   label: "Batch No.",      sortable: false },
  { key: "expiryDate",    label: "Expiry Date",    sortable: true  },
  { key: "quantity",      label: "Qty",            sortable: true  },
  { key: "sellingPrice",  label: "Price (₹)",      sortable: false },
  { key: "status",        label: "Stock Status",   sortable: false },
  { key: "actions",       label: "Actions",        sortable: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// STOCK STATUS
// Derived at render time by comparing quantity vs minimumStock.
// ─────────────────────────────────────────────────────────────────────────────
export const STOCK_STATUS = {
  NORMAL:       "Normal",
  LOW:          "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

// ─────────────────────────────────────────────────────────────────────────────
// STOCK STATUS COLORS
// Maps each stock status to a Bootstrap 5 badge utility class.
// ─────────────────────────────────────────────────────────────────────────────
export const STOCK_STATUS_COLORS = {
  [STOCK_STATUS.NORMAL]:       "bg-success",
  [STOCK_STATUS.LOW]:          "bg-warning text-dark",
  [STOCK_STATUS.OUT_OF_STOCK]: "bg-danger",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRY WARNING THRESHOLD
// Medicines expiring within this many days are flagged as "Expiring Soon".
// ─────────────────────────────────────────────────────────────────────────────
export const EXPIRY_WARNING_DAYS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// SORT OPTIONS
// Used in the SearchBar sort dropdown and passed to Firestore orderBy().
// field: Firestore document field name | direction: "asc" | "desc"
// ─────────────────────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First",       field: "createdAt",    direction: "desc" },
  { value: "oldest",      label: "Oldest First",        field: "createdAt",    direction: "asc"  },
  { value: "alphabetical",label: "Name (A → Z)",        field: "medicineName", direction: "asc"  },
  { value: "name_desc",   label: "Name (Z → A)",        field: "medicineName", direction: "desc" },
  { value: "expiry_asc",  label: "Expiry (Soonest)",    field: "expiryDate",   direction: "asc"  },
  { value: "expiry_desc", label: "Expiry (Latest)",     field: "expiryDate",   direction: "desc" },
  { value: "qty_asc",     label: "Stock (Low → High)",  field: "quantity",     direction: "asc"  },
  { value: "qty_desc",    label: "Stock (High → Low)",  field: "quantity",     direction: "desc" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH FIELDS
// Drives the field-selector dropdown in SearchBar.
// value: the medicine object key used for client-side filtering.
// ─────────────────────────────────────────────────────────────────────────────
export const SEARCH_FIELDS = [
  { value: "medicineName", label: "Medicine Name"  },
  { value: "genericName",  label: "Generic Name"   },
  { value: "manufacturer", label: "Manufacturer"   },
  { value: "supplier",     label: "Supplier"       },
  { value: "category",     label: "Category"       },
  { value: "batchNumber",  label: "Batch Number"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// FORM DEFAULT VALUES
// Initial state for MedicineForm — both Add (fresh) and Edit (overridden by
// loaded doc) use this as the base shape. Prevents undefined field errors.
// ─────────────────────────────────────────────────────────────────────────────
export const FORM_DEFAULT_VALUES = {
  medicineName:  "",
  genericName:   "",
  manufacturer:  "",
  supplier:      "",
  category:      "",
  batchNumber:   "",
  expiryDate:    "",
  purchasePrice: "",
  sellingPrice:  "",
  quantity:      "",
  minimumStock:  "",
  description:   "",
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// Used by MedicineForm to validate each field before submission.
// Keeps all business rules out of the UI layer.
//
// required   → field must be non-empty
// min        → numeric minimum value (inclusive)
// gtField    → value must be greater than the value of another field key
// isInteger  → value must be a whole number
// isCategory → value must exist in MEDICINE_CATEGORIES
// notPast    → date must not be earlier than today
// ─────────────────────────────────────────────────────────────────────────────
export const VALIDATION_RULES = {
  medicineName: {
    required: true,
    label: "Medicine Name",
  },
  manufacturer: {
    required: true,
    label: "Manufacturer",
  },
  supplier: {
    required: true,
    label: "Supplier",
  },
  category: {
    required: true,
    isCategory: true,
    label: "Category",
  },
  batchNumber: {
    required: true,
    label: "Batch Number",
  },
  expiryDate: {
    required: true,
    notPast: true,
    label: "Expiry Date",
  },
  purchasePrice: {
    required: true,
    min: 0.01,
    label: "Purchase Price",
  },
  sellingPrice: {
    required: true,
    min: 0.01,
    gtField: "purchasePrice",
    gtFieldLabel: "Purchase Price",
    label: "Selling Price",
  },
  quantity: {
    required: true,
    min: 0,
    isInteger: true,
    label: "Quantity",
  },
  minimumStock: {
    required: true,
    min: 0,
    isInteger: true,
    label: "Minimum Stock",
  },
};
