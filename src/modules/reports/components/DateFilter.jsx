/**
 * @file        DateFilter.jsx
 * @module      Reports
 * @purpose     Date range filter bar. Preset buttons + custom date inputs.
 *              Calls onFilterChange({ startDate, endDate }) on every selection.
 */

import { useState } from 'react';
import { DATE_FILTERS, DEFAULT_DATE_FILTER } from '../constants/reportsConstants';

// ── Builds { startDate, endDate } from a preset key ──────────────────────────
const buildRange = (preset) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 86399999); // 23:59:59.999

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: endOfToday };

    case 'yesterday': {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return { startDate: yest, endDate: new Date(yest.getTime() + 86399999) };
    }

    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: endOfToday };
    }

    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: endOfToday };
    }

    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: endOfToday };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    default:
      return { startDate: today, endDate: endOfToday };
  }
};

function DateFilter({ onFilterChange }) {
  const [active, setActive]           = useState(DEFAULT_DATE_FILTER);
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [customError, setCustomError] = useState('');

  const handlePreset = (preset) => {
    setActive(preset);
    setCustomError('');
    if (preset !== 'custom') {
      onFilterChange(buildRange(preset));
    }
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end dates.');
      return;
    }
    const start = new Date(customStart);
    const end   = new Date(customEnd + 'T23:59:59.999');
    if (start > end) {
      setCustomError('Start date cannot be after end date.');
      return;
    }
    setCustomError('');
    onFilterChange({ startDate: start, endDate: end });
  };

  return (
    <div className="rp-filter-card">
      <div className="d-flex flex-wrap align-items-center gap-2">
        {/* Preset Buttons */}
        {DATE_FILTERS.filter((f) => f.value !== 'custom').map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`rp-filter-btn ${active === filter.value ? 'active' : ''}`}
            onClick={() => handlePreset(filter.value)}
          >
            {filter.label}
          </button>
        ))}

        {/* Custom Range Toggle */}
        <button
          type="button"
          className={`rp-filter-btn ${active === 'custom' ? 'active' : ''}`}
          onClick={() => handlePreset('custom')}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Date Inputs — shown only when 'custom' is active */}
      {active === 'custom' && (
        <div className="d-flex flex-wrap align-items-end gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div>
            <label className="form-label mb-1" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>From</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ borderRadius: '8px', fontSize: '0.82rem' }}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label mb-1" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>To</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ borderRadius: '8px', fontSize: '0.82rem' }}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', padding: '6px 18px' }}
            onClick={handleCustomApply}
          >
            Apply
          </button>
          {customError && (
            <span className="text-danger align-self-center" style={{ fontSize: '0.78rem' }}>{customError}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default DateFilter;
