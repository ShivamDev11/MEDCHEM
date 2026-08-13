/**
 * @file        notificationService.js
 * @module      Notifications
 * @purpose     Firestore CRUD service for the `notifications` collection.
 *              Reuses the same collection used by salesService.js (LOW_STOCK).
 *              Handles: fetch all, mark read/unread, mark all read,
 *              create expiry notification, and duplicate prevention.
 * @dependencies firebase/firestore, firebase/firestore.js (db),
 *               salesConstants (SALES_COLLECTIONS, NOTIFICATION_TYPES)
 * @exports     getNotifications, markNotificationRead, markNotificationUnread,
 *              markAllNotificationsRead, generateExpiryNotifications
 */

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { toast } from "react-toastify";

import db from "../../../firebase/firestore";
import {
  SALES_COLLECTIONS,
  NOTIFICATION_TYPES,
} from "../../sales/constants/salesConstants";
import { getDaysRemaining } from "../../expiry/utils/expiryUtils";
import { 
  playLowStock, 
  playExpiry, 
  playNotification 
} from "../../../shared/services/audioService";

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION REFERENCE
// Reuses the existing `notifications` collection from salesConstants.
// ─────────────────────────────────────────────────────────────────────────────
const notificationsRef = collection(db, SALES_COLLECTIONS.NOTIFICATIONS);

// ═════════════════════════════════════════════════════════════════════════════
// 1. getNotifications
// ─────────────────────────────────────────────────────────────────────────────
// Fetches all notifications ordered by timestamp (newest first).
//
// @returns {Promise<object[]>} Array of notification objects
// ═════════════════════════════════════════════════════════════════════════════
export const getNotifications = async () => {
  const q = query(notificationsRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    // Convert Firestore Timestamp to JS Date for rendering
    timestamp: docSnap.data().timestamp?.toDate() || new Date(),
  }));
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. markNotificationRead
// ─────────────────────────────────────────────────────────────────────────────
// @param {string} id - Firestore document ID
// @returns {Promise<void>}
// ═════════════════════════════════════════════════════════════════════════════
export const markNotificationRead = async (id) => {
  const docRef = doc(db, SALES_COLLECTIONS.NOTIFICATIONS, id);
  await updateDoc(docRef, { isRead: true });
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. markNotificationUnread
// ─────────────────────────────────────────────────────────────────────────────
// @param {string} id - Firestore document ID
// @returns {Promise<void>}
// ═════════════════════════════════════════════════════════════════════════════
export const markNotificationUnread = async (id) => {
  const docRef = doc(db, SALES_COLLECTIONS.NOTIFICATIONS, id);
  await updateDoc(docRef, { isRead: false });
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. markAllNotificationsRead
// ─────────────────────────────────────────────────────────────────────────────
// Batch-updates all unread notifications to isRead: true.
//
// @returns {Promise<number>} Count of notifications marked read
// ═════════════════════════════════════════════════════════════════════════════
export const markAllNotificationsRead = async () => {
  const q = query(notificationsRef, where("isRead", "==", false));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isRead: true });
  });

  await batch.commit();
  return snapshot.docs.length;
};

// ═════════════════════════════════════════════════════════════════════════════
// 5. checkAndGenerateAutoNotifications
// ─────────────────────────────────────────────────────────────────────────────
// Checks all active medicines in the database for low stock or expiry status.
// Creates only NEW notifications, ensuring NO duplicates by checking
// (medicineId + batchNumber + type).
//
// Processed one-by-one: triggers sound, adds to Firestore, and waits 500ms
// before processing the next one.
//
// @returns {Promise<number>} Count of new notifications created
// ═════════════════════════════════════════════════════════════════════════════
export const checkAndGenerateAutoNotifications = async () => {
  try {
    // 1. Fetch all ACTIVE medicines
    const medicinesRef = collection(db, "medicines");
    const medsQuery = query(medicinesRef, where("status", "==", "ACTIVE"));
    const medsSnapshot = await getDocs(medsQuery);
    const medicines = medsSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // 2. Fetch all existing notifications
    const notificationsRef = collection(db, SALES_COLLECTIONS.NOTIFICATIONS);
    const notifsSnapshot = await getDocs(notificationsRef);
    const existingKeys = new Set(
      notifsSnapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return `${d.medicineId}__${d.batchNumber || "N/A"}__${d.type}`;
      })
    );

    // 3. Identify new notifications to generate
    const pendingNotifications = [];

    for (const med of medicines) {
      const medicineId = med.id;
      const batchNumber = med.batchNumber || "N/A";
      const medicineName = med.medicineName || med.name || "Unknown Medicine";
      const quantity = Number(med.quantity || 0);
      const minStock = Number(med.minimumStock || 0);

      // Check Low Stock condition
      if (quantity > 0 && quantity <= minStock) {
        const type = NOTIFICATION_TYPES.LOW_STOCK;
        const key = `${medicineId}__${batchNumber}__${type}`;
        if (!existingKeys.has(key)) {
          pendingNotifications.push({
            type,
            message: `Low stock alert for ${medicineName}. Only ${quantity} remaining.`,
            medicineId,
            batchNumber,
            isRead: false,
            timestamp: serverTimestamp(),
          });
        }
      }

      // Check Expiry condition (expired or within 90 days)
      const daysRemaining = getDaysRemaining(med.expiryDate);
      if (daysRemaining <= 90) {
        const type = NOTIFICATION_TYPES.EXPIRY;
        const key = `${medicineId}__${batchNumber}__${type}`;
        if (!existingKeys.has(key)) {
          let message;
          if (daysRemaining < 0) {
            message = `${medicineName} (Batch: ${batchNumber}) has EXPIRED ${Math.abs(daysRemaining)} days ago.`;
          } else if (daysRemaining === 0) {
            message = `${medicineName} (Batch: ${batchNumber}) EXPIRES TODAY.`;
          } else {
            message = `${medicineName} (Batch: ${batchNumber}) expires in ${daysRemaining} days.`;
          }

          pendingNotifications.push({
            type,
            message,
            medicineId,
            batchNumber,
            isRead: false,
            timestamp: serverTimestamp(),
          });
        }
      }
    }

    // 4. Sequentially process pending notifications
    let createdCount = 0;
    for (const notif of pendingNotifications) {
      // Play sound and show popup notification
      if (notif.type === NOTIFICATION_TYPES.LOW_STOCK) {
        playLowStock();
        toast.warning(notif.message, { autoClose: 5000 });
      } else if (notif.type === NOTIFICATION_TYPES.EXPIRY) {
        playExpiry();
        toast.error(notif.message, { autoClose: 5000 });
      } else {
        playNotification();
        toast.info(notif.message, { autoClose: 5000 });
      }

      // Write to Firestore
      await addDoc(notificationsRef, notif);
      createdCount++;

      // Wait 500ms before processing the next notification (400-600ms requirement)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return createdCount;
  } catch (error) {
    console.error("Failed to check and generate notifications:", error);
    throw error;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// 6. generateExpiryNotifications (kept for backward compatibility)
// ═════════════════════════════════════════════════════════════════════════════
export const generateExpiryNotifications = async () => {
  return await checkAndGenerateAutoNotifications();
};


