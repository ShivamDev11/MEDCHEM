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

import "../notifications.css";

// ── Tabs Config ──────────────────────────────────────────────────────────────
const TABS = [
  { value: "ALL", label: "All Alert Logs" },
  { value: "UNREAD", label: "Unread Alert Logs" },
  { value: NOTIFICATION_TYPES.LOW_STOCK, label: "Low Stock alerts" },
  { value: NOTIFICATION_TYPES.EXPIRY, label: "Expiry warnings" },
  { value: NOTIFICATION_TYPES.SALE, label: "Sales transactions" },
];

function Notifications() {
  // ── States ─────────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState("ALL");
  const [isMarkingAll, setIsMarkingAll]   = useState(false);

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
    <div className="container-fluid py-4 notif-page-animate">
      <InventoryHeader
        title="Notifications Center"
        subtitle="Manage warehouse system updates, low stock item alerts, and product expiry logs."
        breadcrumbs={breadcrumbs}
      />

      <div className="row">
        <div className="col-12 col-xl-9 mx-auto">
          {/* Header Row: Title, Badges, Mark All Read */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h2 className="h5 fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ letterSpacing: "-0.03em" }}>
                <FiBell className="text-primary" />
                Alert logs
              </h2>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: "0.75rem" }}>
                {notifications.length} Total
              </span>
              {unreadCount > 0 && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold animate-pulse" style={{ fontSize: "0.75rem" }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>
            
            <button
              type="button"
              className="btn inv-btn-primary d-flex align-items-center gap-2"
              style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
              onClick={handleMarkAllRead}
              disabled={loading || unreadCount === 0 || isMarkingAll}
            >
              {isMarkingAll ? (
                <span className="spinner-border spinner-border-sm" role="status" style={{ width: "12px", height: "12px" }}></span>
              ) : (
                <FiCheckCircle size={15} />
              )}
              <span>Mark All as Read</span>
            </button>
          </div>

          {/* Filter Tabs Group */}
          <div className="mb-4">
            <div className="notif-tab-group shadow-sm flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`notif-tab-btn ${activeTab === tab.value ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
