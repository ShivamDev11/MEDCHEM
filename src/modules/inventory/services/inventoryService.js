/**
 * @file        inventoryService.js
 * @module      Inventory
 * @purpose     Centralised Firestore service for the `medicines` collection.
 *              All CRUD, pagination, aggregation, and soft-delete logic lives here.
 *              React components must NEVER import from firebase/firestore directly.
 * @dependencies firebase/firestore, src/firebase/firestore.js (db instance),
 *               src/modules/inventory/constants/inventoryConstants.js
 * @exports     getMedicines, getMedicineById, createMedicine, updateMedicine,
 *              softDeleteMedicine, checkDuplicate, searchMedicines,
 *              getInventoryStats, getLowStockMedicines, getExpiringMedicines
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";

import db from "../../../firebase/firestore";
import {
  MEDICINE_STATUS,
  PAGINATION_LIMIT,
  EXPIRY_WARNING_DAYS,
} from "../constants/inventoryConstants";

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION REFERENCE
// All queries in this file use this reference — never a raw string elsewhere.
// ─────────────────────────────────────────────────────────────────────────────
const COLLECTION_NAME = "medicines";
const medicinesRef = collection(db, COLLECTION_NAME);

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Document Mapper
//
// Converts a Firestore QueryDocumentSnapshot into a plain JS object.
// Exposes the Firestore auto-generated ID as `id`.
// `medicineId` is NEVER stored as a Firestore field — use `medicine.id`.
// ─────────────────────────────────────────────────────────────────────────────
const mapDoc = (document) => ({ id: document.id, ...document.data() });

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Numeric Field Sanitiser
//
// HTML form inputs always return strings. This helper casts the four
// numeric medicine fields to JS numbers before any Firestore write,
// ensuring Firestore stores them as numbers (required for quantity
// comparisons in getLowStockMedicines and getInventoryStats).
// ─────────────────────────────────────────────────────────────────────────────
const sanitiseNumericFields = (data) => ({
  ...data,
  purchasePrice: Number(data.purchasePrice),
  sellingPrice:  Number(data.sellingPrice),
  quantity:      Number(data.quantity),
  minimumStock:  Number(data.minimumStock),
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Today as YYYY-MM-DD string
// expiryDate is stored as a YYYY-MM-DD string in Firestore.
// Lexicographic string comparison works correctly for ISO date strings.
// ─────────────────────────────────────────────────────────────────────────────
const getTodayString = () => new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Expiry threshold date string
// Returns today + N days as YYYY-MM-DD for Firestore range queries.
// ─────────────────────────────────────────────────────────────────────────────
const getExpiryThreshold = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};


// ═════════════════════════════════════════════════════════════════════════════
// 1. getMedicines
// ─────────────────────────────────────────────────────────────────────────────
// Fetches one page of ACTIVE medicines using server-side sorting and cursor
// pagination. Only ACTIVE documents are returned (soft-deleted are excluded).
//
// NOTE: Composite Firestore indexes are required for non-default sort fields.
//       If Firestore throws an "index required" error, click the link in the
//       Firebase console error message to create the index automatically.
//
// @param {string}               sortField - Firestore field to sort by
//                                           Default: "createdAt"
// @param {string}               sortDir   - "asc" | "desc". Default: "desc"
// @param {DocumentSnapshot|null} lastDoc  - Cursor snapshot for startAfter.
//                                           Pass null for the first page.
//
// @returns {Promise<{
//   medicines:   object[],          // mapped medicine objects for this page
//   lastVisible: DocumentSnapshot|null, // cursor to pass for next page
//   hasMore:     boolean             // false when no further pages exist
// }>}
// ═════════════════════════════════════════════════════════════════════════════
export const getMedicines = async (
  sortField = "createdAt",
  sortDir   = "desc",
  lastDoc   = null
) => {
  const constraints = [
    where("status", "==", MEDICINE_STATUS.ACTIVE),
    orderBy(sortField, sortDir),
    limit(PAGINATION_LIMIT),
  ];

  if (lastDoc) {
    // startAfter must be inserted before limit for correct cursor behaviour
    constraints.splice(constraints.length - 1, 0, startAfter(lastDoc));
  }

  const q = query(medicinesRef, ...constraints);
  const snapshot = await getDocs(q);

  const medicines    = snapshot.docs.map(mapDoc);
  const lastVisible  = snapshot.docs[snapshot.docs.length - 1] ?? null;
  const hasMore      = snapshot.docs.length === PAGINATION_LIMIT;

  return { medicines, lastVisible, hasMore };
};


// ═════════════════════════════════════════════════════════════════════════════
// 2. getMedicineById
// ─────────────────────────────────────────────────────────────────────────────
// Fetches a single medicine document by its Firestore auto-generated ID.
// Returns null if the document does not exist or has been soft-deleted.
//
// @param {string} id - Firestore document ID
// @returns {Promise<object|null>}
// ═════════════════════════════════════════════════════════════════════════════
export const getMedicineById = async (id) => {
  const docRef  = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = mapDoc(docSnap);

  // Guard: never expose soft-deleted records to the UI
  if (data.status === MEDICINE_STATUS.DELETED) return null;

  return data;
};


// ═════════════════════════════════════════════════════════════════════════════
// 3. checkDuplicate
// ─────────────────────────────────────────────────────────────────────────────
// Queries Firestore to determine whether an ACTIVE medicine with the same
// medicineName + batchNumber combination already exists.
//
// Used as a pre-flight check by both createMedicine and updateMedicine.
//
// @param {string}      medicineName - Medicine name to check (trimmed)
// @param {string}      batchNumber  - Batch number to check (trimmed)
// @param {string|null} excludeId    - Doc ID to exclude when checking on Edit.
//                                    Pass null on Create.
//
// @returns {Promise<boolean>} true if a duplicate ACTIVE document exists
// ═════════════════════════════════════════════════════════════════════════════
export const checkDuplicate = async (
  medicineName,
  batchNumber,
  excludeId = null
) => {
  const q = query(
    medicinesRef,
    where("status",       "==", MEDICINE_STATUS.ACTIVE),
    where("medicineName", "==", medicineName.trim()),
    where("batchNumber",  "==", batchNumber.trim())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  // On Edit: only flag as duplicate if the match is a DIFFERENT document
  if (excludeId) {
    return snapshot.docs.some((d) => d.id !== excludeId);
  }

  return true;
};


// ═════════════════════════════════════════════════════════════════════════════
// 4. createMedicine
// ─────────────────────────────────────────────────────────────────────────────
// Validates uniqueness, then writes a new ACTIVE medicine document to Firestore.
// Firestore auto-generates the document ID — `medicineId` is never stored.
// Numeric fields are sanitised from strings before writing.
//
// @param {object} data   - Validated form data matching FORM_DEFAULT_VALUES shape
// @param {string} userId - Firebase Auth currentUser.uid (or "system" fallback)
//
// @returns {Promise<string>} The newly created Firestore document ID
// @throws  {Error}          code "DUPLICATE" if medicineName+batchNumber exists
// @throws  {Error}          Firebase network/permission errors bubble up as-is
// ═════════════════════════════════════════════════════════════════════════════
export const createMedicine = async (data, userId = "system") => {
  // Pre-flight duplicate check before any write
  const isDuplicate = await checkDuplicate(data.medicineName, data.batchNumber);

  if (isDuplicate) {
    const error  = new Error("DUPLICATE");
    error.code   = "DUPLICATE";
    throw error;
  }

  const payload = {
    ...sanitiseNumericFields(data),
    status:    MEDICINE_STATUS.ACTIVE,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  const docRef = await addDoc(medicinesRef, payload);
  return docRef.id;
};


// ═════════════════════════════════════════════════════════════════════════════
// 5. updateMedicine
// ─────────────────────────────────────────────────────────────────────────────
// Validates uniqueness (excluding the document being edited), then patches
// the Firestore document. Only updatedAt and updatedBy are touched on the
// audit side — createdAt and createdBy are preserved from the original write.
//
// @param {string} id     - Firestore document ID of the medicine to update
// @param {object} data   - Updated form data
// @param {string} userId - Firebase Auth currentUser.uid (or "system" fallback)
//
// @returns {Promise<void>}
// @throws  {Error} code "DUPLICATE" if name+batch matches a DIFFERENT active doc
// ═════════════════════════════════════════════════════════════════════════════
export const updateMedicine = async (id, data, userId = "system") => {
  // Exclude the current document ID so editing without changing name/batch passes
  const isDuplicate = await checkDuplicate(data.medicineName, data.batchNumber, id);

  if (isDuplicate) {
    const error  = new Error("DUPLICATE");
    error.code   = "DUPLICATE";
    throw error;
  }

  const docRef = doc(db, COLLECTION_NAME, id);

  const payload = {
    ...sanitiseNumericFields(data),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  await updateDoc(docRef, payload);
};


// ═════════════════════════════════════════════════════════════════════════════
// 6. softDeleteMedicine
// ─────────────────────────────────────────────────────────────────────────────
// Performs a soft delete by setting status = "DELETED" on the document.
// The document is NEVER removed from Firestore — full audit trail is preserved
// for medical compliance and future restore capability.
//
// All getMedicines queries filter status == "ACTIVE", so this document will
// immediately disappear from all lists after this call completes.
//
// @param {string} id     - Firestore document ID to soft-delete
// @param {string} userId - Firebase Auth currentUser.uid (or "system" fallback)
//
// @returns {Promise<void>}
// ═════════════════════════════════════════════════════════════════════════════
export const softDeleteMedicine = async (id, userId = "system") => {
  const docRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(docRef, {
    status:    MEDICINE_STATUS.DELETED,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
};


// ═════════════════════════════════════════════════════════════════════════════
// 7. searchMedicines  ← CLIENT-SIDE (intentional — see note below)
// ─────────────────────────────────────────────────────────────────────────────
// Filters an already-fetched array of medicine objects in memory.
//
// WHY client-side?
//   Firestore `where()` supports only exact-match or prefix queries.
//   Partial search (e.g. typing "Para" to find "Paracetamol") is impossible
//   with a Firestore query alone without a third-party search service.
//   Inventory size of 1,000–5,000 documents is negligible in browser memory.
//
// Strategy:
//   - Sorting      → server-side (Firestore orderBy)
//   - Pagination   → server-side (Firestore startAfter)
//   - Low Stock    → server-side (Firestore where)
//   - Expiry       → server-side (Firestore where)
//   - Search       → client-side (this function)
//
// @param {object[]} medicines - Full page array from getMedicines
// @param {string}   field     - Object key to filter on (value from SEARCH_FIELDS)
// @param {string}   term      - Search string (case-insensitive, trimmed)
//
// @returns {object[]} Filtered subset — same shape as input array
// ═════════════════════════════════════════════════════════════════════════════
export const searchMedicines = (medicines, field, term) => {
  if (!term || !term.trim()) return medicines;

  const normalised = term.trim().toLowerCase();

  return medicines.filter((medicine) => {
    const value = medicine[field];
    if (value === undefined || value === null) return false;
    return String(value).toLowerCase().includes(normalised);
  });
};


// ═════════════════════════════════════════════════════════════════════════════
// 8. getInventoryStats
// ─────────────────────────────────────────────────────────────────────────────
// Computes all 5 dashboard stat card values in a single Firestore read.
// Fetches every ACTIVE medicine once, then aggregates in memory.
//
// Why single fetch instead of 5 queries?
//   - "Low Stock" requires comparing two fields per document (quantity vs
//     minimumStock) — Firestore cannot do cross-field comparisons.
//   - A single read is cheaper than 5 separate query reads.
//
// Returned stats:
//   totalMedicines  – count of all ACTIVE documents
//   totalStockQty   – sum of all `quantity` values
//   outOfStock      – count where quantity === 0
//   lowStock        – count where 0 < quantity <= minimumStock
//   expiringSoon    – count expiring within EXPIRY_WARNING_DAYS from today
//
// Also consumed by: Dashboard module (import directly from this service).
//
// @returns {Promise<{
//   totalMedicines: number,
//   totalStockQty:  number,
//   outOfStock:     number,
//   lowStock:       number,
//   expiringSoon:   number
// }>}
// ═════════════════════════════════════════════════════════════════════════════
export const getInventoryStats = async () => {
  const q = query(
    medicinesRef,
    where("status", "==", MEDICINE_STATUS.ACTIVE)
  );

  const snapshot  = await getDocs(q);
  const medicines = snapshot.docs.map(mapDoc);

  const todayStr     = getTodayString();
  const thresholdStr = getExpiryThreshold(EXPIRY_WARNING_DAYS);

  const totalMedicines = medicines.length;

  const totalStockQty = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0),
    0
  );

  const outOfStock = medicines.filter(
    (m) => Number(m.quantity) === 0
  ).length;

  const lowStock = medicines.filter(
    (m) => Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock)
  ).length;

  const expiringSoon = medicines.filter(
    (m) => m.expiryDate >= todayStr && m.expiryDate <= thresholdStr
  ).length;

  return { totalMedicines, totalStockQty, outOfStock, lowStock, expiringSoon };
};


// ═════════════════════════════════════════════════════════════════════════════
// 9. getLowStockMedicines
// ─────────────────────────────────────────────────────────────────────────────
// Returns all ACTIVE medicines where stock is critically low:
//   quantity > 0  (not fully out, just low)
//   quantity <= minimumStock
//
// NOTE: Firestore cannot compare two document fields against each other
// (quantity vs minimumStock) so we fetch all ACTIVE docs and filter in JS.
//
// Consumed by: InventoryStats, Notifications module.
//
// @returns {Promise<object[]>}
// ═════════════════════════════════════════════════════════════════════════════
export const getLowStockMedicines = async () => {
  const q = query(
    medicinesRef,
    where("status", "==", MEDICINE_STATUS.ACTIVE)
  );

  const snapshot  = await getDocs(q);
  const medicines = snapshot.docs.map(mapDoc);

  return medicines.filter(
    (m) => Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock)
  );
};


// ═════════════════════════════════════════════════════════════════════════════
// 10. getExpiringMedicines
// ─────────────────────────────────────────────────────────────────────────────
// Returns all ACTIVE medicines whose expiryDate falls between today and
// today + `days` (inclusive). Uses a Firestore range query on expiryDate.
//
// Why Firestore query (not client-side)?
//   expiryDate is stored as YYYY-MM-DD string. ISO date strings sort
//   lexicographically — Firestore range query is accurate and efficient.
//
// NOTE: This query requires a Firestore composite index on:
//   status (ASC) + expiryDate (ASC)
//   Firebase console will show a direct link to create it on first run.
//
// Consumed by: InventoryStats, Expiry module.
//
// @param {number} days - Look-ahead window (default: EXPIRY_WARNING_DAYS = 30)
// @returns {Promise<object[]>} Sorted by expiryDate ascending
// ═════════════════════════════════════════════════════════════════════════════
export const getExpiringMedicines = async (days = EXPIRY_WARNING_DAYS) => {
  const todayStr     = getTodayString();
  const thresholdStr = getExpiryThreshold(days);

  const q = query(
    medicinesRef,
    where("status",     "==", MEDICINE_STATUS.ACTIVE),
    where("expiryDate", ">=", todayStr),
    where("expiryDate", "<=", thresholdStr),
    orderBy("expiryDate", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
};
