/**
 * @file        useAutoExpiryNotifications.js
 * @module      Notifications
 * @purpose     Automatically generates low stock and expiry notifications on app initialization,
 *              login, or refresh. Runs silently in the background.
 *
 * Strategy:
 *   1. On mount, wait 2 seconds.
 *   2. Run checkAndGenerateAutoNotifications to fetch active medicines and identify new alerts.
 *   3. Generate notifications sequentially with sound triggers and delay.
 *
 * @dependencies notificationService
 * @exports useAutoExpiryNotifications (default)
 */

import { useEffect } from "react";
import { checkAndGenerateAutoNotifications } from "../services/notificationService";

const useAutoExpiryNotifications = () => {
  useEffect(() => {
    const runAutoCheck = async () => {
      try {
        const created = await checkAndGenerateAutoNotifications();
        if (created > 0) {
          console.info(`[MedChem] ✅ Auto-generated ${created} new notifications.`);
        } else {
          console.info("[MedChem] ℹ️ No new notifications generated.");
        }
      } catch (err) {
        // Silent failure — never show errors to users for background tasks
        console.warn("[MedChem] Auto notification check failed silently:", err.message);
      }
    };

    // Small delay so the app finishes mounting before running the background checks
    const timer = setTimeout(runAutoCheck, 2000);
    return () => clearTimeout(timer);
  }, []); // Runs once on mount
};

export default useAutoExpiryNotifications;
