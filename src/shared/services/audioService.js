/**
 * @file        audioService.js
 * @module      Shared
 * @purpose     Centralized audio playback service. 
 *              Maintains a single Audio instance to prevent overlapping sounds.
 */

// Singleton Audio instance to prevent duplicate objects and overlapping sounds
let globalAudio = null;

/**
 * Core play function. Stops any currently playing sound, loads the new one, and plays it.
 * Fails silently if the file is missing or browser blocks autoplay.
 * @param {string} fileName - Name of the mp3 file in /sounds/
 */
const playSound = (fileName) => {
  try {
    if (!globalAudio) {
      globalAudio = new Audio();
    } else {
      // Stop currently playing sound
      globalAudio.pause();
      globalAudio.currentTime = 0;
    }

    globalAudio.src = `/sounds/${fileName}`;
    globalAudio.play().catch((err) => {
      // Silently fail if file is missing or browser restricts autoplay
      console.warn(`[AudioService] Playback failed for ${fileName}:`, err.message);
    });
  } catch (error) {
    console.warn(`[AudioService] Error initializing audio:`, error.message);
  }
};

// ── Exported Helpers ─────────────────────────────────────────────────────────

export const playWelcome = () => playSound("welcome.mp3");
export const playLogin = () => playSound("login.mp3");
export const playExpiry = () => playSound("expiry.mp3");
export const playLowStock = () => playSound("low-stock.mp3");
export const playOutOfStock = () => playSound("out-of-stock.mp3");
export const playSale = () => playSound("sale.mp3");
export const playInventoryAdded = () => playSound("inventory-added.mp3");
export const playInventoryUpdated = () => playSound("inventory-updated.mp3");
export const playInventoryDeleted = () => playSound("inventory-deleted.mp3");
export const playReportReady = () => playSound("report-ready.mp3");
export const playDashboard = () => playSound("dashboard.mp3");
export const playSettings = () => playSound("settings.mp3");
export const playNotification = () => playSound("notification.mp3");
export const playError = () => playSound("error.mp3");
