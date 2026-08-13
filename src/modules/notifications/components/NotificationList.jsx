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
 *
 * @param {object}   props
 * @param {object[]} props.notifications - Array of notification objects
 * @param {Function} props.onToggleRead  - Callback passed down to cards
 * @param {boolean}  props.loading       - Loading state
 */
function NotificationList({ notifications, onToggleRead, loading }) {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2 small">Loading notifications...</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center p-5 bg-white">
        <FiBellOff size={48} className="text-muted mb-3 mx-auto" />
        <h4 className="fw-bold text-dark">No Notifications</h4>
        <p className="text-muted mb-0">
          You don't have any notifications matching this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
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
