/**
 * @file        reportCalculator.js
 * @module      Reports
 * @purpose     Pure JS calculation functions for all report KPIs.
 *              No Firestore, no React — only data in, numbers out.
 *              Called by useReports.js after data is fetched.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const thresholdStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const isSameDay = (date, refDate) =>
  date.toDateString() === refDate.toDateString();

const isSameMonth = (date, refDate) =>
  date.getFullYear() === refDate.getFullYear() &&
  date.getMonth() === refDate.getMonth();


// ─────────────────────────────────────────────────────────────────────────────
// 1. calcSalesKPIs
// @param {object[]} sales — filtered sales array from fetchSalesData
// @returns sales summary KPIs
// ─────────────────────────────────────────────────────────────────────────────
export const calcSalesKPIs = (sales) => {
  const now = new Date();

  const totalSales    = sales.length;
  const totalRevenue  = sales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + (Number(s.totalItems) || 0), 0);
  const avgSaleValue  = totalSales > 0 ? totalRevenue / totalSales : 0;

  const todaySales = sales.filter((s) => isSameDay(s.date, now));
  const todayRevenue = todaySales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

  const monthSales = sales.filter((s) => isSameMonth(s.date, now));
  const monthRevenue = monthSales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

  return {
    totalSales,
    totalRevenue,
    totalItemsSold,
    avgSaleValue,
    todaySalesCount: todaySales.length,
    todayRevenue,
    monthRevenue,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. calcInventoryKPIs
// @param {object[]} medicines — all active medicines
// @returns inventory summary KPIs
// ─────────────────────────────────────────────────────────────────────────────
export const calcInventoryKPIs = (medicines) => {
  const totalMedicines = medicines.length;

  const totalStock = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0), 0
  );

  const outOfStock = medicines.filter((m) => Number(m.quantity) === 0).length;

  const lowStock = medicines.filter(
    (m) => Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock)
  ).length;

  const inventoryValue = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.purchasePrice) || 0), 0
  );

  // Category → count of medicines
  const categories = medicines.reduce((acc, m) => {
    const cat = m.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return { totalMedicines, totalStock, outOfStock, lowStock, inventoryValue, categories };
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. calcExpiryKPIs
// @param {object[]} medicines — all active medicines
// @returns expiry bucket counts
// ─────────────────────────────────────────────────────────────────────────────
export const calcExpiryKPIs = (medicines) => {
  const today  = todayStr();
  const day30  = thresholdStr(30);
  const day60  = thresholdStr(60);
  const day90  = thresholdStr(90);

  const expired    = medicines.filter((m) => m.expiryDate && m.expiryDate < today).length;
  const within30   = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day30).length;
  const within60   = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day60).length;
  const within90   = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day90).length;

  return { expired, within30, within60, within90 };
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. calcTopMedicines
// @param {object[]} saleItems — all saleItems for the filtered sales
// @returns array sorted by quantity desc
// ─────────────────────────────────────────────────────────────────────────────
export const calcTopMedicines = (saleItems) => {
  const map = {};

  saleItems.forEach((item) => {
    const key = item.medicineName || item.medicineId || 'Unknown';
    if (!map[key]) {
      map[key] = { medicineName: key, quantitySold: 0, revenue: 0 };
    }
    map[key].quantitySold += Number(item.quantity) || 0;
    map[key].revenue      += Number(item.subtotal)  || 0;
  });

  return Object.values(map).sort((a, b) => b.quantitySold - a.quantitySold);
};


// ─────────────────────────────────────────────────────────────────────────────
// 5. calcPaymentMethods
// @param {object[]} sales — filtered sales array
// @returns { Cash, UPI, Card } each with count + revenue
// ─────────────────────────────────────────────────────────────────────────────
export const calcPaymentMethods = (sales) => {
  const result = {
    Cash: { count: 0, revenue: 0 },
    UPI:  { count: 0, revenue: 0 },
    Card: { count: 0, revenue: 0 },
  };

  sales.forEach((sale) => {
    const method = sale.paymentMethod || 'Cash';
    if (result[method]) {
      result[method].count++;
      result[method].revenue += Number(sale.netAmount) || 0;
    }
  });

  return result;
};


// ─────────────────────────────────────────────────────────────────────────────
// 6. calcSalesTrend
// Returns daily revenue data for the trend chart within the selected dateRange.
// Capped at 90 days to prevent UI overload on massive custom ranges.
// @param {object[]} sales — filtered sales array
// @param {object} dateRange — { startDate, endDate }
// @returns { labels: string[], revenues: number[], counts: number[] }
// ─────────────────────────────────────────────────────────────────────────────
export const calcSalesTrend = (sales, dateRange) => {
  const labels   = [];
  const revenues = [];
  const counts   = [];

  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    return { labels, revenues, counts, daysRendered: 0 };
  }

  const start = new Date(dateRange.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateRange.endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Cap at 90 days to prevent browser lag on huge ranges
  const daysToRender = Math.min(diffDays + 1, 90);

  for (let i = daysToRender - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    
    // For many days, keep label short (just day number if > 31 days)
    const labelOptions = daysToRender > 31 
      ? { day: '2-digit' } 
      : { day: '2-digit', month: 'short' };
      
    const label = d.toLocaleDateString('en-IN', labelOptions);
    labels.push(label);

    const dayRevenue = sales
      .filter((s) => isSameDay(s.date, d))
      .reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

    const dayCount = sales.filter((s) => isSameDay(s.date, d)).length;

    revenues.push(dayRevenue);
    counts.push(dayCount);
  }

  return { labels, revenues, counts, daysRendered: daysToRender };
};


// ─────────────────────────────────────────────────────────────────────────────
// 7. calcCategoryStock
// @param {object[]} medicines
// @returns array of { category, count, stock } sorted by stock desc
// ─────────────────────────────────────────────────────────────────────────────
export const calcCategoryStock = (medicines) => {
  const map = {};

  medicines.forEach((m) => {
    const cat = m.category || 'Other';
    if (!map[cat]) map[cat] = { category: cat, count: 0, stock: 0 };
    map[cat].count++;
    map[cat].stock += Number(m.quantity) || 0;
  });

  return Object.values(map).sort((a, b) => b.stock - a.stock);
};
