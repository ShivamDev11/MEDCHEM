/**
 * @file        supplierService.js
 * @module      SmartOperations
 * @purpose     Firestore CRUD service for the `suppliers` collection.
 *              Supplier–medicine link is resolved by matching supplier name
 *              against medicines.supplier (plain string field).
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
  serverTimestamp,
} from 'firebase/firestore';

import db from '../../../firebase/firestore';
import {
  SO_COLLECTIONS,
  SUPPLIER_STATUS,
  MED_STATUS,
  SO_ACTION_TYPES,
} from '../constants/smartOpsConstants';

const suppliersRef = collection(db, SO_COLLECTIONS.SUPPLIERS);
const medicinesRef  = collection(db, SO_COLLECTIONS.MEDICINES);

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER
// ─────────────────────────────────────────────────────────────────────────────
const mapDoc = (d) => ({ id: d.id, ...d.data() });

// ─────────────────────────────────────────────────────────────────────────────
// 1. getSuppliers
// Returns all ACTIVE suppliers sorted by name.
// ─────────────────────────────────────────────────────────────────────────────
export const getSuppliers = async () => {
  const q = query(suppliersRef, where('status', '==', SUPPLIER_STATUS.ACTIVE));
  const snap = await getDocs(q);
  const suppliers = snap.docs.map(mapDoc);
  suppliers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return suppliers;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. getAllSuppliers (includes INACTIVE — for admin views)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSuppliers = async () => {
  const snap = await getDocs(suppliersRef);
  const suppliers = snap.docs.map(mapDoc);
  suppliers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return suppliers;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. getSupplierById
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierById = async (id) => {
  const docRef  = doc(db, SO_COLLECTIONS.SUPPLIERS, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return mapDoc(docSnap);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. checkDuplicateSupplier
// ─────────────────────────────────────────────────────────────────────────────
export const checkDuplicateSupplier = async (name, excludeId = null) => {
  const q = query(
    suppliersRef,
    where('status', '==', SUPPLIER_STATUS.ACTIVE),
    where('name', '==', name.trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (excludeId) return snap.docs.some((d) => d.id !== excludeId);
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. createSupplier
// ─────────────────────────────────────────────────────────────────────────────
export const createSupplier = async (data, userId = 'system') => {
  const isDuplicate = await checkDuplicateSupplier(data.name);
  if (isDuplicate) {
    const err = new Error('DUPLICATE');
    err.code  = 'DUPLICATE';
    throw err;
  }

  const payload = {
    name:          data.name.trim(),
    contactNumber: data.contactNumber?.trim() || '',
    email:         data.email?.trim() || '',
    address:       data.address?.trim() || '',
    status:        SUPPLIER_STATUS.ACTIVE,
    createdAt:     serverTimestamp(),
    createdBy:     userId,
    updatedAt:     serverTimestamp(),
    updatedBy:     userId,
  };

  const docRef = await addDoc(suppliersRef, payload);

  // Activity log
  try {
    await addDoc(collection(db, SO_COLLECTIONS.ACTIVITY_LOGS), {
      action:      SO_ACTION_TYPES.SUPPLIER_CREATED,
      module:      'SmartOperations',
      performedBy: userId,
      date:        serverTimestamp(),
      details:     `Supplier created: ${payload.name}`,
    });
  } catch (_) { /* non-critical */ }

  return docRef.id;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. updateSupplier
// ─────────────────────────────────────────────────────────────────────────────
export const updateSupplier = async (id, data, userId = 'system') => {
  const isDuplicate = await checkDuplicateSupplier(data.name, id);
  if (isDuplicate) {
    const err = new Error('DUPLICATE');
    err.code  = 'DUPLICATE';
    throw err;
  }

  const docRef = doc(db, SO_COLLECTIONS.SUPPLIERS, id);
  await updateDoc(docRef, {
    name:          data.name.trim(),
    contactNumber: data.contactNumber?.trim() || '',
    email:         data.email?.trim() || '',
    address:       data.address?.trim() || '',
    status:        data.status || SUPPLIER_STATUS.ACTIVE,
    updatedAt:     serverTimestamp(),
    updatedBy:     userId,
  });

  try {
    await addDoc(collection(db, SO_COLLECTIONS.ACTIVITY_LOGS), {
      action:      SO_ACTION_TYPES.SUPPLIER_UPDATED,
      module:      'SmartOperations',
      performedBy: userId,
      date:        serverTimestamp(),
      details:     `Supplier updated: ${data.name}`,
    });
  } catch (_) { /* non-critical */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. softDeleteSupplier
// Sets status = INACTIVE. Does NOT delete Firestore document.
// ─────────────────────────────────────────────────────────────────────────────
export const softDeleteSupplier = async (id, userId = 'system') => {
  const docRef = doc(db, SO_COLLECTIONS.SUPPLIERS, id);
  const snap   = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Supplier not found');

  const supplierName = snap.data().name;

  await updateDoc(docRef, {
    status:    SUPPLIER_STATUS.INACTIVE,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  try {
    await addDoc(collection(db, SO_COLLECTIONS.ACTIVITY_LOGS), {
      action:      SO_ACTION_TYPES.SUPPLIER_DELETED,
      module:      'SmartOperations',
      performedBy: userId,
      date:        serverTimestamp(),
      details:     `Supplier removed: ${supplierName}`,
    });
  } catch (_) { /* non-critical */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. getSupplierMedicines
// Returns all ACTIVE medicines where supplier name matches (case-insensitive).
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierMedicines = async (supplierName) => {
  const q = query(
    medicinesRef,
    where('status', '==', MED_STATUS.ACTIVE)
  );
  const snap = await getDocs(q);
  const all  = snap.docs.map(mapDoc);

  const lowerName = (supplierName || '').toLowerCase().trim();
  return all.filter(
    (m) => (m.supplier || '').toLowerCase().trim() === lowerName
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. getSupplierStats
// Enriches a supplier object with computed stats (products, low stock, purchases).
// purchasesMap: { [supplierName]: { totalAmount, lastDate } } pre-computed by caller.
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierStats = async (supplier, purchasesMap = {}) => {
  const medicines = await getSupplierMedicines(supplier.name);
  const lowStock  = medicines.filter(
    (m) => Number(m.quantity) >= 0 && Number(m.quantity) <= Number(m.minimumStock)
  );

  const purchaseData = purchasesMap[supplier.name?.toLowerCase()] || {};

  return {
    ...supplier,
    totalProducts:      medicines.length,
    lowStockProducts:   lowStock.length,
    totalPurchaseAmount: purchaseData.totalAmount || 0,
    lastPurchaseDate:    purchaseData.lastDate     || null,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. syncSuppliersFromMedicines
// Utility to safely extract unique supplier names from the existing medicines
// collection and insert them into the suppliers collection without duplicating.
// ─────────────────────────────────────────────────────────────────────────────
export const syncSuppliersFromMedicines = async () => {
  // 1. Get all active medicines
  const medsSnap = await getDocs(
    query(medicinesRef, where('status', '==', MED_STATUS.ACTIVE))
  );
  const medicines = medsSnap.docs.map(mapDoc);

  // 2. Extract unique supplier names (case-insensitive deduplication, preserving original case)
  const uniqueNames = new Map();
  medicines.forEach((m) => {
    const name = (m.supplier || '').trim();
    if (name && name.toLowerCase() !== 'not specified') {
      const lower = name.toLowerCase();
      if (!uniqueNames.has(lower)) {
        uniqueNames.set(lower, name);
      }
    }
  });

  if (uniqueNames.size === 0) return 0;

  // 3. Get existing suppliers to avoid duplicates
  const existingSnap = await getDocs(suppliersRef);
  const existingSuppliers = existingSnap.docs.map(mapDoc);
  const existingNames = new Set(existingSuppliers.map((s) => (s.name || '').toLowerCase().trim()));

  // 4. Insert missing suppliers
  let addedCount = 0;
  for (const [lowerName, originalName] of uniqueNames.entries()) {
    if (!existingNames.has(lowerName)) {
      await addDoc(suppliersRef, {
        name: originalName,
        contactNumber: '',
        email: '',
        address: 'Auto-imported from inventory',
        status: SUPPLIER_STATUS.ACTIVE,
        createdAt: serverTimestamp(),
        createdBy: 'system-migration',
        updatedAt: serverTimestamp(),
        updatedBy: 'system-migration',
      });
      addedCount++;
    }
  }

  return addedCount;
};

