/**
 * @file        expiryService.js
 * @module      Expiry
 * @purpose     Firestore service for fetching medicines relevant to expiry tracking.
 *              Single query approach — one Firestore read for all expired + expiring.
 *              React components must NEVER import from firebase/firestore directly.
 * @dependencies firebase/firestore, firebase/firestore.js (db instance),
 *               inventoryConstants (MEDICINE_STATUS),
 *               expiryConstants (EXPIRY_THRESHOLDS),
 *               expiryUtils (getDaysRemaining, getExpiryStatus)
 * @exports     getAllExpiredAndExpiring
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import db from "../../../firebase/firestore";
import { MEDICINE_STATUS } from "../../inventory/constants/inventoryConstants";
import { EXPIRY_THRESHOLDS } from "../constants/expiryConstants";
import { getDaysRemaining, getExpiryStatus } from "../utils/expiryUtils";

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION REFERENCE
// ─────────────────────────────────────────────────────────────────────────────
const COLLECTION_NAME = "medicines";
const medicinesRef = collection(db, COLLECTION_NAME);

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Threshold date as YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
const getThresholdDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — Document Mapper
// ─────────────────────────────────────────────────────────────────────────────
const mapDoc = (document) => ({ id: document.id, ...document.data() });

// ═════════════════════════════════════════════════════════════════════════════
// getAllExpiredAndExpiring
// ─────────────────────────────────────────────────────────────────────────────
// Fetches all ACTIVE medicines whose expiryDate is within the monitoring
// window (expired + expiring within 90 days) using a SINGLE Firestore query.
//
// Query strategy:
//   where("expiryDate", "<=", today+90)
//   This captures:
//     - Already expired (expiryDate < today)
//     - Expiring within 30/60/90 days
//
// Each returned document is enriched with:
//   - daysRemaining (integer, negative = expired)
//   - expiryStatus  (EXPIRED | CRITICAL | WARNING | UPCOMING | SAFE)
//
// All further filtering (by 30/60/90 tabs) is done CLIENT-SIDE on this data.
//
// @returns {Promise<object[]>} Enriched medicine array sorted by expiryDate asc
// ═════════════════════════════════════════════════════════════════════════════
export const getAllExpiredAndExpiring = async () => {
  const thresholdStr = getThresholdDate(EXPIRY_THRESHOLDS.UPCOMING); // today + 90

  // Single-field range query — no composite index required.
  // status == ACTIVE is filtered client-side to avoid Firestore index dependency.
  const q = query(
    medicinesRef,
    where("expiryDate", "<=", thresholdStr),
    orderBy("expiryDate", "asc")
  );

  const snapshot = await getDocs(q);

  // Filter DELETED medicines client-side (soft-delete pattern)
  const medicines = snapshot.docs
    .map(mapDoc)
    .filter((med) => med.status === MEDICINE_STATUS.ACTIVE);

  // Enrich each document with computed expiry fields
  return medicines.map((med) => {
    const daysRemaining = getDaysRemaining(med.expiryDate);
    const expiryStatus = getExpiryStatus(daysRemaining);
    return { ...med, daysRemaining, expiryStatus };
  });
};
