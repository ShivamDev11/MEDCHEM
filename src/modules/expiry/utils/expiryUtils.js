/**
 * @file        expiryUtils.js
 * @module      Expiry
 * @purpose     Pure utility functions for expiry date calculations.
 *              No Firestore or React dependencies — usable anywhere.
 * @dependencies expiryConstants.js (EXPIRY_STATUS, EXPIRY_THRESHOLDS)
 * @exports     getDaysRemaining, getExpiryStatus
 */

import {
  EXPIRY_STATUS,
  EXPIRY_THRESHOLDS,
} from "../constants/expiryConstants";

// ─────────────────────────────────────────────────────────────────────────────
// getDaysRemaining
// ─────────────────────────────────────────────────────────────────────────────
// Calculates the number of days between today and the given expiry date.
//   Positive → days left until expiry
//   Zero     → expires today
//   Negative → already expired (days past expiry)
//
// @param  {string} expiryDateStr - Date in YYYY-MM-DD format (Firestore schema)
// @returns {number} Integer days remaining (floored)
// ─────────────────────────────────────────────────────────────────────────────
export const getDaysRemaining = (expiryDateStr) => {
  if (!expiryDateStr) return -Infinity;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD explicitly in local time to avoid UTC timezone shift bugs
  const [year, month, day] = expiryDateStr.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────────────────────────────────────
// getExpiryStatus
// ─────────────────────────────────────────────────────────────────────────────
// Maps days remaining to an EXPIRY_STATUS constant.
//   days < 0                        → EXPIRED
//   0 ≤ days ≤ CRITICAL (30)        → CRITICAL
//   CRITICAL < days ≤ WARNING (60)  → WARNING
//   WARNING < days ≤ UPCOMING (90)  → UPCOMING
//   days > UPCOMING (90)            → SAFE
//
// @param  {number} daysRemaining - Output of getDaysRemaining()
// @returns {string} One of EXPIRY_STATUS values
// ─────────────────────────────────────────────────────────────────────────────
export const getExpiryStatus = (daysRemaining) => {
  if (daysRemaining < 0)                               return EXPIRY_STATUS.EXPIRED;
  if (daysRemaining <= EXPIRY_THRESHOLDS.CRITICAL)      return EXPIRY_STATUS.CRITICAL;
  if (daysRemaining <= EXPIRY_THRESHOLDS.WARNING)       return EXPIRY_STATUS.WARNING;
  if (daysRemaining <= EXPIRY_THRESHOLDS.UPCOMING)      return EXPIRY_STATUS.UPCOMING;
  return EXPIRY_STATUS.SAFE;
};
