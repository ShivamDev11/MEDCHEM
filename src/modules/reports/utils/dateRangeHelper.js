/**
 * @file        dateRangeHelper.js
 * @module      Reports
 * @purpose     Builds { startDate, endDate, preset } from a preset key or raw dates.
 *              Used by useReportsFilters and DateFilter component.
 */

// ─────────────────────────────────────────────────────────────────────────────
// buildRangeFromPreset
// Returns { startDate: Date, endDate: Date, preset: string }
// ─────────────────────────────────────────────────────────────────────────────
export const buildRangeFromPreset = (preset) => {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 86399999); // 23:59:59.999

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: endOfToday, preset };

    case 'yesterday': {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return { startDate: yest, endDate: new Date(yest.getTime() + 86399999), preset };
    }

    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: endOfToday, preset };
    }

    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: endOfToday, preset };
    }

    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: endOfToday, preset };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end, preset };
    }

    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: endOfToday, preset };
    }

    default:
      return { startDate: today, endDate: endOfToday, preset: 'today' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// buildInitialRange — default "Last 30 Days" for page load
// ─────────────────────────────────────────────────────────────────────────────
export const buildInitialRange = () => buildRangeFromPreset('last30days');

// ─────────────────────────────────────────────────────────────────────────────
// formatDateRangeLabel — human-readable label for active range
// ─────────────────────────────────────────────────────────────────────────────
export const formatDateRangeLabel = (startDate, endDate, preset) => {
  if (preset && preset !== 'custom') {
    const MAP = {
      today:      'Today',
      yesterday:  'Yesterday',
      last7days:  'Last 7 Days',
      last30days: 'Last 30 Days',
      thisMonth:  'This Month',
      lastMonth:  'Last Month',
      thisYear:   'This Year',
    };
    return MAP[preset] || 'Custom';
  }
  if (!startDate || !endDate) return 'All Time';
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// isInRange — checks if a Date falls within [startDate, endDate]
// ─────────────────────────────────────────────────────────────────────────────
export const isInRange = (date, startDate, endDate) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return d >= startDate && d <= endDate;
};
