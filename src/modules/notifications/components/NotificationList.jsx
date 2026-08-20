/**
 * @file        NotificationList.jsx
 * @module      Notifications
 * @purpose     Renders a list of NotificationCard components.
 *              Displays empty states if no notifications match the current filter.
 * @dependencies react, NotificationCard
 * @exports     NotificationList (default)
 */

import { FiBellOff } from "react-icons/fi";
import NotificationCard from "./NotificationCard";

/**
 * NotificationList
 */
function NotificationList({ notifications, onToggleRead, loading }) {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="inv-spinner-wrap">
          <div className="inv-brand-spinner" role="status" aria-label="Loading notifications" />
          <p className="text-muted small mb-0 mt-2">Loading alert logs…</p>
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="card notif-empty-card border-0 shadow-sm text-center p-5 bg-white">
        <div className="notif-empty-icon-wrap" aria-hidden="true">
          <FiBellOff size={24} />
        </div>
        <h5 className="fw-bold text-dark mb-1">No Alerts Logged</h5>
        <p className="text-secondary small mb-0">
          No alert logs match your selected filter categories.
        </p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {notifications.map((notif) => (
        <NotificationCard
          key={notif.id}
          notification={notif}
          onToggleRead={onToggleRead}
        />
      ))}
    </div>
  );
}

export default NotificationList;
