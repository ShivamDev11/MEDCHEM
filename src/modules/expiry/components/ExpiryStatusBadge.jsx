/**
 * @file        ExpiryStatusBadge.jsx
 * @module      Expiry
 * @purpose     Isolated, reusable badge component for expiry status.
 *              Uses design tokens from expiry.css.
 * @dependencies expiryConstants
 * @exports     ExpiryStatusBadge (default)
 */

import { EXPIRY_STATUS } from "../constants/expiryConstants";

/**
 * ExpiryStatusBadge
 *
 * @param {object} props
 * @param {string} props.status - One of EXPIRY_STATUS values
 */
function ExpiryStatusBadge({ status }) {
  let badgeStyleClass = "exp-badge-safe";

  switch (status) {
    case EXPIRY_STATUS.EXPIRED:
      badgeStyleClass = "exp-badge-expired";
      break;
    case EXPIRY_STATUS.CRITICAL:
      badgeStyleClass = "exp-badge-critical";
      break;
    case EXPIRY_STATUS.WARNING:
      badgeStyleClass = "exp-badge-warning";
      break;
    case EXPIRY_STATUS.UPCOMING:
      badgeStyleClass = "exp-badge-upcoming";
      break;
    case EXPIRY_STATUS.SAFE:
    default:
      badgeStyleClass = "exp-badge-safe";
      break;
  }

  return (
    <span className={`exp-badge ${badgeStyleClass}`}>
      {status}
    </span>
  );
}

export default ExpiryStatusBadge;
