/**
 * @file        ExpiryStatusBadge.jsx
 * @module      Expiry
 * @purpose     Isolated, reusable badge component for expiry status.
 *              Reads color from EXPIRY_STATUS_COLORS constant — zero hardcoded colors.
 * @dependencies expiryConstants (EXPIRY_STATUS_COLORS)
 * @exports     ExpiryStatusBadge (default)
 */

import { EXPIRY_STATUS_COLORS } from "../constants/expiryConstants";

/**
 * ExpiryStatusBadge
 *
 * @param {object} props
 * @param {string} props.status - One of EXPIRY_STATUS values (EXPIRED, CRITICAL, etc.)
 */
function ExpiryStatusBadge({ status }) {
  const badgeClass = EXPIRY_STATUS_COLORS[status] || "bg-secondary text-white";

  return (
    <span className={`badge ${badgeClass} px-2 py-1`}>
      {status}
    </span>
  );
}

export default ExpiryStatusBadge;
