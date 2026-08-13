/**
 * @file        Notifications.jsx
 * @module      Notifications
 * @purpose     Main orchestrator page for Notifications module.
 *              Displays filter tabs, unread count badge, Mark All Read action,
 *              and delegates rendering to NotificationList.
 * @dependencies react, react-router-dom, react-toastify, notificationService,
 *               NotificationList, InventoryHeader
 * @exports     Notifications (default)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { FiCheckCircle, FiBell } from "react-icons/fi";

import {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
} from "../services/notificationService";
import { NOTIFICATION_TYPES } from "../../sales/constants/salesConstants";

import InventoryHeader from "../../inventory/components/InventoryHeader";
import NotificationList from "../components/NotificationList";
import { playError, playNotification } from "../../../shared/services/audioService";

import "../../inventory/inventory.css";

// ── Tabs Config ──────────────────────────────────────────────────────────────
const TABS = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: NOTIFICATION_TYPES.LOW_STOCK, label: "Low Stock" },
  { value: NOTIFICATION_TYPES.EXPIRY, label: "Expiry" },
  { value: NOTIFICATION_TYPES.SALE, label: "Sale" },
];

function Notifications() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      playError();
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Derived Data ───────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeTab === "ALL") return true;
      if (activeTab === "UNREAD") return !notif.isRead;
      return notif.type === activeTab;
    });
  }, [notifications, activeTab]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleToggleRead = async (notification) => {
    const { id, isRead } = notification;
    
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !isRead } : n))
    );

    try {
      if (isRead) {
        await markNotificationUnread(id);
      } else {
        await markNotificationRead(id);
      }
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      playError();
      toast.error("Failed to update notification.");
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    
    setIsMarkingAll(true);
    try {
      const count = await markAllNotificationsRead();
      if (count > 0) {
        // Optimistic UI update
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        playNotification();
        toast.success(`Marked ${count} notifications as read.`);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      playError();
      toast.error("Failed to mark notifications as read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const breadcrumbs = useMemo(() => [{ label: "Notifications" }], []);

  return (
    <div className="container-fluid py-4 inv-page-container">
      <InventoryHeader
        title="Notifications Center"
        subtitle="Stay updated with low stock alerts, expiry warnings, and sale events."
        breadcrumbs={breadcrumbs}
      />

      <div className="row">
        <div className="col-12 col-lg-10 mx-auto">
          {/* Header Row: Title, Badges, Mark All Read */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div className="d-flex align-items-center gap-3">
              <h2 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
                <FiBell className="text-primary" />
                Your Notifications
              </h2>
              <span className="badge bg-primary rounded-pill">
                {notifications.length} Total
              </span>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            
            <button
              type="button"
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={handleMarkAllRead}
              disabled={loading || unreadCount === 0 || isMarkingAll}
            >
              {isMarkingAll ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <FiCheckCircle size={18} />
              )}
              Mark All as Read
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 d-flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`btn btn-sm ${
                  activeTab === tab.value ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <NotificationList
            notifications={filteredNotifications}
            onToggleRead={handleToggleRead}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default Notifications;
