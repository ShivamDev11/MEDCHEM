/**
 * @file        SectionHeader.jsx
 * @module      Reports
 * @purpose     Reusable section header with title, subtitle, icon, badge, and optional action link.
 */

const SectionHeader = ({
  title,
  subtitle,
  badgeText,
  badgeColor = 'primary',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mt-4 pt-2">
      <div>
        <div className="d-flex align-items-center gap-2">
          <h2 className="rp-card-title mb-0" style={{ fontSize: '1.05rem' }}>
            {title}
          </h2>
          {badgeText && (
            <span className={`rp-badge rp-badge-${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && <p className="rp-card-subtitle mt-1 mb-0">{subtitle}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0"
          style={{ fontSize: '0.8rem', fontWeight: 600 }}
          onClick={onAction}
        >
          {actionLabel} &rarr;
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
