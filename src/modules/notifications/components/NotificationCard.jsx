/**
 * @file        NotificationCard.jsx
 * @module      Notifications
 * @purpose     Renders a single notification card.
 *              Displays icon based on type, message, and dual timestamp formats.
 *              Provides a button to toggle read/unread status.
 * @dependencies react, react-icons, salesConstants (NOTIFICATION_TYPES)
 * @exports     NotificationCard (default)
 */

import { FiPackage, FiClock, FiDollarSign, FiCheck, FiCircle } from "react-icons/fi";
import { NOTIFICATION_TYPES } from "../../sales/constants/salesConstants";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatRelativeTime = (date) => {
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

/**
 * NotificationCard
 *
 * @param {object}   props
 * @param {object}   props.notification - Notification object
 * @param {Function} props.onToggleRead - Callback to toggle read/unread
 */
function NotificationCard({ notification, onToggleRead }) {
  const { type, message, timestamp, isRead } = notification;
  const { Icon, colorClass } = getIconConfig(type);

  return (
    <div
      className={`card mb-3 border-0 shadow-sm ${
        isRead ? "bg-light text-muted opacity-75" : "bg-white"
      }`}
      style={{ borderLeft: isRead ? "4px solid #dee2e6" : "4px solid #0d6efd" }}
    >
      <div className="card-body d-flex align-items-start gap-3">
        <div className={`p-2 rounded ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div className="flex-grow-1">
          <p className="mb-1 fw-medium">{message}</p>
          <div className="d-flex align-items-center gap-2 small text-secondary">
            <span>{formatRelativeTime(timestamp)}</span>
            <span className="text-muted">•</span>
            <span>{formatAbsoluteTime(timestamp)}</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className={`btn btn-sm ${
              isRead ? "btn-outline-secondary" : "btn-primary"
            }`}
            onClick={() => onToggleRead(notification)}
            title={isRead ? "Mark as Unread" : "Mark as Read"}
          >
            {isRead ? <FiCircle size={14} /> : <FiCheck size={14} />}
            <span className="ms-1 d-none d-sm-inline">
              {isRead ? "Mark Unread" : "Mark Read"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationCard;
