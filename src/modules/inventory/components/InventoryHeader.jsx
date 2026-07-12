/**
 * @file        InventoryHeader.jsx
 * @module      Inventory
 * @purpose     Reusable page-level header for every Inventory page.
 *              Renders a dynamic title, breadcrumb trail, optional subtitle,
 *              and an optional primary action button (e.g. "Add Medicine").
 *              Accepts all values via props — zero hardcoded strings inside.
 * @dependencies react, react-router-dom, react-icons, inventory.css
 * @exports     InventoryHeader (default)
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiChevronRight, FiPlus } from "react-icons/fi";

/**
 * InventoryHeader
 *
 * @param {object}   props
 * @param {string}   props.title              - Main page heading text
 * @param {string}   [props.subtitle]         - Optional descriptive subtitle
 * @param {Array}    props.breadcrumbs        - Trail items: [{ label, path? }]
 *                                             Last item is always active (no link)
 * @param {object}   [props.actionButton]     - Primary CTA config (optional)
 * @param {string}   props.actionButton.label - Button label text
 * @param {string}   props.actionButton.path  - Route to navigate on click
 * @param {boolean}  [props.actionButton.disabled] - Disables the button when true
 */
function InventoryHeader({ title, subtitle, breadcrumbs = [], actionButton }) {
  const navigate = useNavigate();

  /**
   * Stable navigation handler.
   * useCallback prevents unnecessary re-renders in parent that passes this down.
   */
  const handleActionClick = useCallback(() => {
    if (actionButton?.path) {
      navigate(actionButton.path);
    }
  }, [navigate, actionButton?.path]);

  return (
    <div className="inv-header-wrapper">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="breadcrumb" className="inv-breadcrumb-nav">
        <ol className="breadcrumb mb-1">
          {/* Static home crumb */}
          <li className="breadcrumb-item">
            <span
              className="inv-breadcrumb-link"
              onClick={() => navigate("/dashboard")}
              role="button"
              aria-label="Go to Dashboard"
            >
              <FiHome size={13} className="me-1" />
              Dashboard
            </span>
          </li>

          {/* Dynamic breadcrumb items */}
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li
                key={`crumb-${index}`}
                className={`breadcrumb-item d-flex align-items-center ${
                  isLast ? "active" : ""
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                <FiChevronRight size={12} className="inv-crumb-separator me-1" />
                {isLast || !crumb.path ? (
                  <span className="inv-breadcrumb-active">{crumb.label}</span>
                ) : (
                  <span
                    className="inv-breadcrumb-link"
                    onClick={() => navigate(crumb.path)}
                    role="button"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── Title Row ───────────────────────────────────────────────────── */}
      <div className="inv-header-row">
        {/* Left: Title + subtitle */}
        <div className="inv-header-title-block">
          <h1 className="inv-page-title">{title}</h1>
          {subtitle && (
            <p className="inv-page-subtitle mb-0">{subtitle}</p>
          )}
        </div>

        {/* Right: Action button (optional) */}
        {actionButton && (
          <div className="inv-header-action">
            <button
              type="button"
              id="inv-add-medicine-btn"
              className="btn inv-btn-primary d-flex align-items-center gap-2"
              onClick={handleActionClick}
              disabled={actionButton.disabled || false}
              aria-label={actionButton.label}
            >
              <FiPlus size={18} />
              <span>{actionButton.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <hr className="inv-header-divider" />
    </div>
  );
}

export default InventoryHeader;
