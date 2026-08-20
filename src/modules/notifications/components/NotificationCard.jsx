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
      return { Icon: FiPackage, cardTypeClass: "notif-type-low-stock" };
    case NOTIFICATION_TYPES.EXPIRY:
      return { Icon: FiClock, cardTypeClass: "notif-type-expiry" };
    case NOTIFICATION_TYPES.SALE:
      return { Icon: FiDollarSign, cardTypeClass: "notif-type-sale" };
    default:
      return { Icon: FiPackage, cardTypeClass: "notif-type-default" };
  }
};

/**
 * NotificationCard
 */
function NotificationCard({ notification, onToggleRead }) {
  const { type, message, timestamp, isRead } = notification;
  const { Icon, cardTypeClass } = getIconConfig(type);

  // Safely parse timestamp to Date object
  const dateObj = timestamp instanceof Date ? timestamp : (timestamp?.toDate ? timestamp.toDate() : new Date(timestamp));

  return (
    <div
      className={`card notif-card ${cardTypeClass} ${isRead ? "notif-read" : "notif-unread"}`}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-4">
        
        {/* Styled Icon wrapper */}
        <div className="notif-icon-wrap" aria-hidden="true">
          <Icon size={18} />
        </div>

        {/* Text Details */}
        <div className="flex-grow-1">
          <p className="mb-1 fw-semibold text-dark" style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
            {message}
          </p>
          <div className="d-flex align-items-center gap-2 small text-secondary" style={{ fontSize: "0.75rem" }}>
            <span>{formatRelativeTime(dateObj)}</span>
            <span>•</span>
            <span title={formatAbsoluteTime(dateObj)}>{formatAbsoluteTime(dateObj)}</span>
          </div>
        </div>

        {/* Toggle read/unread button */}
        <div className="flex-shrink-0">
          <button
            type="button"
            className={`btn notif-toggle-btn ${isRead ? "notif-toggle-btn-read" : "notif-toggle-btn-unread"}`}
            onClick={() => onToggleRead(notification)}
            title={isRead ? "Mark as Unread" : "Mark as Read"}
          >
            {isRead ? (
              <>
                <FiCircle size={12} />
                <span className="d-none d-sm-inline">Mark Unread</span>
              </>
            ) : (
              <>
                <FiCheck size={12} />
                <span className="d-none d-sm-inline">Mark Read</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default NotificationCard;
