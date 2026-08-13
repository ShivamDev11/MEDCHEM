/**
 * @file        AppLayout.jsx
 * @module      App
 * @purpose     Global wrapper layout for authenticated routes.
 *              Includes the top navigation bar, links to modules,
 *              a real-time reactive Bell Notification Center dropdown,
 *              and the global logout handler.
 * @dependencies react, react-router-dom, react-icons, firebase/firestore
 */

import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { 
  FiLogOut, 
  FiBell, 
  FiCheckCircle, 
  FiPackage, 
  FiClock, 
  FiDollarSign, 
  FiCheck, 
  FiCircle 
} from "react-icons/fi";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";

import db from "../../firebase/firestore";
import { logoutUser } from "../../modules/auth/services/authService";
import { 
  markNotificationRead, 
  markAllNotificationsRead 
} from "../../modules/notifications/services/notificationService";
import { playNotification, playError } from "../../../src/shared/services/audioService";
import { NOTIFICATION_TYPES, SALES_COLLECTIONS } from "../../modules/sales/constants/salesConstants";

// ── Time Helpers ─────────────────────────────────────────────────────────────
const formatRelativeTime = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const formatAbsoluteTime = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getIconConfig = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.LOW_STOCK:
      return { Icon: FiPackage, colorClass: "text-warning bg-warning bg-opacity-10" };
    case NOTIFICATION_TYPES.EXPIRY:
      return { Icon: FiClock, colorClass: "text-danger bg-danger bg-opacity-10" };
    case NOTIFICATION_TYPES.SALE:
      return { Icon: FiDollarSign, colorClass: "text-success bg-success bg-opacity-10" };
    default:
      return { Icon: FiPackage, colorClass: "text-secondary bg-secondary bg-opacity-10" };
  }
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // States
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Derived Values
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Real-time listener for notifications
  useEffect(() => {
    const notificationsRef = collection(db, SALES_COLLECTIONS.NOTIFICATIONS);
    const q = query(notificationsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          ...docData,
          timestamp: docData.timestamp?.toDate() || new Date(),
        };
      });
      setNotifications(data);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      playError();
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleToggleRead = async (notif, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    try {
      await markNotificationRead(notif.id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      playError();
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      playNotification();
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      playError();
      toast.error("Failed to update notifications.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/notifications");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-2 sticky-top">
        <div className="container">
          {/* Logo / Brand */}
          <span 
            className="navbar-brand fw-bold d-flex align-items-center gap-2 cursor-pointer"
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <span>💊</span> MedChem
          </span>

          {/* Collapsible Tabs */}
          <div className="navbar-nav flex-row gap-3 me-auto ms-4 d-none d-md-flex">
            <span
              onClick={() => navigate("/dashboard")}
              className={`nav-link px-2 cursor-pointer ${isActive("/dashboard") ? "active text-white fw-bold" : "text-white-50"}`}
              style={{ cursor: "pointer" }}
            >
              Dashboard
            </span>
            <span
              onClick={() => navigate("/inventory")}
              className={`nav-link px-2 cursor-pointer ${isActive("/inventory") ? "active text-white fw-bold" : "text-white-50"}`}
              style={{ cursor: "pointer" }}
            >
              Inventory
            </span>
            <span
              onClick={() => navigate("/sales")}
              className={`nav-link px-2 cursor-pointer ${isActive("/sales") ? "active text-white fw-bold" : "text-white-50"}`}
              style={{ cursor: "pointer" }}
            >
              Sales
            </span>
            <span
              onClick={() => navigate("/expiry")}
              className={`nav-link px-2 cursor-pointer ${isActive("/expiry") ? "active text-white fw-bold" : "text-white-50"}`}
              style={{ cursor: "pointer" }}
            >
              Expiry Tracker
            </span>
          </div>

          {/* Right Align Actions */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* 🔔 Bell Notification Center */}
            <div className="position-relative" ref={dropdownRef}>
              <button
                type="button"
                className="btn btn-dark p-2 border-0 rounded-circle position-relative"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Notifications"
              >
                <FiBell size={20} className="text-white-50 hover-text-white" />
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.65rem", padding: "0.25em 0.5em" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border-0 py-2 dropdown-menu-custom"
                  style={{ 
                    width: "360px", 
                    zIndex: 1050, 
                    right: 0,
                    maxHeight: "500px",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* Dropdown Header */}
                  <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none text-primary fw-semibold"
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll}
                      >
                        {isMarkingAll ? "Updating..." : "Mark all read"}
                      </button>
                    )}
                  </div>

                  {/* Notification List Scrollable Box */}
                  <div style={{ overflowY: "auto", maxHeight: "350px" }} className="py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <FiBell size={24} className="mb-2 text-muted opacity-50" />
                        <p className="mb-0">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => {
                        const { Icon, colorClass } = getIconConfig(notif.type);
                        return (
                          <div 
                            key={notif.id}
                            className={`px-3 py-2 d-flex align-items-start gap-2 border-bottom dropdown-item-custom ${!notif.isRead ? "bg-light" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(notif.type === NOTIFICATION_TYPES.EXPIRY ? "/expiry" : "/inventory")}
                          >
                            <div className={`p-1.5 rounded-circle me-1 mt-1 ${colorClass}`} style={{ padding: "6px", display: "inline-flex" }}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 small text-dark fw-medium" style={{ lineHeight: "1.3" }}>
                                {notif.message}
                              </p>
                              <div className="d-flex align-items-center gap-1.5 mt-1" style={{ fontSize: "0.75rem", color: "#6c757d" }}>
                                <span>{formatRelativeTime(notif.timestamp)}</span>
                                <span>•</span>
                                <span title={formatAbsoluteTime(notif.timestamp)}>
                                  {formatAbsoluteTime(notif.timestamp)}
                                </span>
                              </div>
                            </div>
                            {!notif.isRead && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 mt-1 align-self-start text-primary"
                                onClick={(e) => handleToggleRead(notif, e)}
                                title="Mark as Read"
                              >
                                <FiCircle size={10} className="fill-primary" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="text-center border-top pt-2 px-3">
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none w-100 fw-semibold text-primary"
                      onClick={handleViewAll}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              type="button"
              className="btn btn-danger d-flex align-items-center gap-2"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <FiLogOut />
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Layout Content ────────────────────────────────────────── */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
