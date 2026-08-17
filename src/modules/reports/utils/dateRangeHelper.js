/**
 * @file        dateRangeHelper.js
 * @module      Reports
 * @purpose     Provides the initial date range for the reports dashboard on load.
 */

export const buildInitialRange = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 86399999);

  // Default to Last 30 Days
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  
  return { startDate: start, endDate: endOfToday };
};
