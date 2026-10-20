/**
 * @file        reportCalculator.js
 * @module      Reports
 * @purpose     Pure JS calculation functions for all report KPIs.
 *              No Firestore, no React — only data in, numbers out.
 *              Called by useReports.js after data is fetched.
 *
 *              Calculation rules (documented per requirement):
 *              - Revenue uses sale.netAmount (after discount/tax)
 *              - Only COMPLETED sales are counted as revenue
 *              - Total Items Sold uses sale.totalItems (quantities, not records)
 *              - AOV = totalRevenue / totalCompletedSales (not item count)
 *              - Gross Profit = revenue - cost (at current purchasePrice)
 *              - Inventory KPIs reflect CURRENT state (not date-filtered)
 *              - Avoid divide-by-zero throughout
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
  date.getMonth()    === refDate.getMonth();

// Only count COMPLETED sales as revenue
const isCompleted = (sale) =>
  !sale.status || sale.status === 'Completed';


// ─────────────────────────────────────────────────────────────────────────────
// 1. calcSalesKPIs
// @param {object[]} sales — date-filtered sales array
// @returns sales summary KPIs
// Counts: ALL sales for transaction count; COMPLETED only for revenue sums.
// ─────────────────────────────────────────────────────────────────────────────
export const calcSalesKPIs = (sales) => {
  const now = new Date();

  const completedSales   = sales.filter(isCompleted);
  const totalSales       = sales.length;           // all statuses (transaction count)
  const totalRevenue     = completedSales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
  const totalItemsSold   = completedSales.reduce((sum, s) => sum + (Number(s.totalItems) || 0), 0);
  const avgOrderValue    = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

  const todaySales    = completedSales.filter((s) => isSameDay(s.date, now));
  const todayRevenue  = todaySales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
  const monthSales    = completedSales.filter((s) => isSameMonth(s.date, now));
  const monthRevenue  = monthSales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

  return {
    totalSales,
    completedSalesCount: completedSales.length,
    totalRevenue,
    totalItemsSold,
    avgOrderValue,
    todaySalesCount: todaySales.length,
    todayRevenue,
    monthRevenue,
    // avgSaleValue kept for backward compatibility
    avgSaleValue: avgOrderValue,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. calcInventoryKPIs
// @param {object[]} medicines — ALL active medicines (NOT date-filtered)
// @returns inventory summary KPIs — current stock state
// ─────────────────────────────────────────────────────────────────────────────
export const calcInventoryKPIs = (medicines) => {
  const today = todayStr();
  const totalMedicines = medicines.length;

  const totalStock = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0), 0
  );

  const outOfStock = medicines.filter((m) => Number(m.quantity) === 0).length;

  const lowStock = medicines.filter(
    (m) => Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock || 0)
  ).length;

  // Inventory value at purchase cost (current purchasePrice × current quantity)
  const inventoryValueCost = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.purchasePrice) || 0), 0
  );

  // Inventory value at selling price
  const inventoryValueSelling = medicines.reduce(
    (sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.sellingPrice) || 0), 0
  );

  const expired = medicines.filter(
    (m) => m.expiryDate && m.expiryDate < today
  ).length;

  // Category → count of medicines
  const categories = medicines.reduce((acc, m) => {
    const cat = m.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return {
    totalMedicines,
    totalStock,
    outOfStock,
    lowStock,
    inventoryValue: inventoryValueCost,    // primary value metric
    inventoryValueCost,
    inventoryValueSelling,
    expired,
    categories,
    uniqueCategories: Object.keys(categories).length,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. calcExpiryKPIs
// @param {object[]} medicines — all active medicines
// @returns expiry bucket counts + within90 as "expiring soon"
// ─────────────────────────────────────────────────────────────────────────────
export const calcExpiryKPIs = (medicines) => {
  const today  = todayStr();
  const day30  = thresholdStr(30);
  const day60  = thresholdStr(60);
  const day90  = thresholdStr(90);

  const expired  = medicines.filter((m) => m.expiryDate && m.expiryDate < today);
  const within30 = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day30);
  const within60 = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day60);
  const within90 = medicines.filter((m) => m.expiryDate >= today && m.expiryDate <= day90);

  return {
    expired:      expired.length,
    within30:     within30.length,
    within60:     within60.length,
    within90:     within90.length,
    expiredItems: expired,    // full objects for drill-through
    within30Items: within30,
    within60Items: within60,
    within90Items: within90,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. calcTopMedicines
// @param {object[]} saleItems — saleItems for the filtered sales
// @param {object[]} medicines — all active medicines (for enrichment)
// @returns array sorted by quantity desc
// ─────────────────────────────────────────────────────────────────────────────
export const calcTopMedicines = (saleItems, medicines = []) => {
  // Build medicine lookup map by ID for enrichment
  const medMap = {};
  medicines.forEach((m) => { medMap[m.id] = m; });

  const map = {};
  saleItems.forEach((item) => {
    const key    = item.medicineId || item.medicineName || 'Unknown';
    const name   = item.medicineName || 'Unknown';
    const medRec = medMap[item.medicineId] || {};

    if (!map[key]) {
      map[key] = {
        medicineId:    item.medicineId || key,
        medicineName:  name,
        quantitySold:  0,
        revenue:       0,
        category:      medRec.category || '—',
        currentStock:  Number(medRec.quantity) || 0,
        purchasePrice: Number(medRec.purchasePrice) || 0,
        sellingPrice:  Number(medRec.sellingPrice)  || 0,
        expiryDate:    medRec.expiryDate || '',
        supplier:      medRec.supplier   || '',
      };
    }
    map[key].quantitySold += Number(item.quantity) || 0;
    map[key].revenue      += Number(item.subtotal)  || 0;
  });

  const products = Object.values(map).map((p) => ({
    ...p,
    cost:   p.purchasePrice * p.quantitySold,
    profit: p.revenue - p.purchasePrice * p.quantitySold,
    margin: p.revenue > 0
      ? ((p.revenue - p.purchasePrice * p.quantitySold) / p.revenue) * 100
      : 0,
  }));

  return products.sort((a, b) => b.quantitySold - a.quantitySold);
};


// ─────────────────────────────────────────────────────────────────────────────
// 5. calcPaymentMethods
// @param {object[]} sales — filtered sales array (COMPLETED only for revenue)
// @returns { Cash, UPI, Card } each with count + revenue + pct
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
      if (isCompleted(sale)) {
        result[method].revenue += Number(sale.netAmount) || 0;
      }
    }
  });

  const totalCount = Object.values(result).reduce((s, m) => s + m.count, 0);
  const totalRev   = Object.values(result).reduce((s, m) => s + m.revenue, 0);

  Object.keys(result).forEach((m) => {
    result[m].pct        = totalCount > 0 ? Math.round((result[m].count / totalCount) * 100)   : 0;
    result[m].revenuePct = totalRev   > 0 ? Math.round((result[m].revenue / totalRev) * 100) : 0;
  });

  return result;
};


// ─────────────────────────────────────────────────────────────────────────────
// 6. calcSalesTrend
// Returns daily revenue + count data for the selected date range.
// Capped at 90 days; groups into weeks if range > 60 days.
// ─────────────────────────────────────────────────────────────────────────────
export const calcSalesTrend = (sales, dateRange) => {
  const labels   = [];
  const revenues = [];
  const counts   = [];
  const dateKeys = [];    // ISO date string per point (for cross-filter)

  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    return { labels, revenues, counts, dateKeys, daysRendered: 0 };
  }

  const completedSales = sales.filter(isCompleted);

  const start = new Date(dateRange.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateRange.endDate);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(Math.abs(end - start) / 86400000) + 1;
  const daysToRender = Math.min(diffDays, 90);

  for (let i = daysToRender - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);

    const labelOptions = daysToRender > 31
      ? { day: '2-digit' }
      : { day: '2-digit', month: 'short' };

    const label  = d.toLocaleDateString('en-IN', labelOptions);
    const dateKey = d.toISOString().split('T')[0];
    labels.push(label);
    dateKeys.push(dateKey);

    const daySales   = completedSales.filter((s) => isSameDay(s.date, d));
    const dayRevenue = daySales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);
    const dayCount   = daySales.length;

    revenues.push(dayRevenue);
    counts.push(dayCount);
  }

  return { labels, revenues, counts, dateKeys, daysRendered: daysToRender };
};


// ─────────────────────────────────────────────────────────────────────────────
// 7. calcCategoryStock
// @param {object[]} medicines
// @returns array of { category, count, stock, value, lowStock, expired }
// ─────────────────────────────────────────────────────────────────────────────
export const calcCategoryStock = (medicines) => {
  const today = todayStr();
  const map = {};

  medicines.forEach((m) => {
    const cat = m.category || 'Other';
    if (!map[cat]) {
      map[cat] = { category: cat, count: 0, stock: 0, value: 0, lowStock: 0, expired: 0 };
    }
    map[cat].count++;
    map[cat].stock += Number(m.quantity) || 0;
    map[cat].value += (Number(m.quantity) || 0) * (Number(m.purchasePrice) || 0);
    if (Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.minimumStock || 0)) {
      map[cat].lowStock++;
    }
    if (m.expiryDate && m.expiryDate < today) {
      map[cat].expired++;
    }
  });

  return Object.values(map).sort((a, b) => b.stock - a.stock);
};


// ─────────────────────────────────────────────────────────────────────────────
// 8. calcStockStatus
// Classifies medicines into In Stock / Low Stock / Out of Stock / Expired
// for the InventoryStatusChart pie chart.
// ─────────────────────────────────────────────────────────────────────────────
export const calcStockStatus = (medicines) => {
  const today = todayStr();
  const buckets = {
    'In Stock':    0,
    'Low Stock':   0,
    'Out of Stock':0,
    'Expired':     0,
  };

  medicines.forEach((m) => {
    // Expired overrides stock status
    if (m.expiryDate && m.expiryDate < today) {
      buckets['Expired']++;
    } else if (Number(m.quantity) === 0) {
      buckets['Out of Stock']++;
    } else if (Number(m.quantity) <= Number(m.minimumStock || 0)) {
      buckets['Low Stock']++;
    } else {
      buckets['In Stock']++;
    }
  });

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
};


// ─────────────────────────────────────────────────────────────────────────────
// 9. calcPurchaseKPIs
// @param {object[]} purchases — date-filtered purchases
// @returns purchase summary KPIs
// ─────────────────────────────────────────────────────────────────────────────
export const calcPurchaseKPIs = (purchases) => {
  const totalPurchases      = purchases.length;
  const totalPurchaseValue  = purchases.reduce(
    (sum, p) => sum + (Number(p.totalAmount) || 0), 0
  );
  const uniqueSuppliers     = new Set(purchases.map((p) => p.supplierName).filter(Boolean)).size;

  return { totalPurchases, totalPurchaseValue, uniqueSuppliers };
};


// ─────────────────────────────────────────────────────────────────────────────
// 10. calcSupplierStats
// @param {object[]} purchases — ALL purchases (not date-filtered for totals)
// @param {object[]} suppliers — all active suppliers
// @param {object[]} medicines — all medicines (for product count)
// @returns array of supplier summary objects sorted by purchase value desc
// ─────────────────────────────────────────────────────────────────────────────
export const calcSupplierStats = (purchases, suppliers, medicines = []) => {
  // Build per-supplier purchase map
  const purchaseMap = {};
  purchases.forEach((p) => {
    const name = (p.supplierName || '').toLowerCase();
    if (!purchaseMap[name]) {
      purchaseMap[name] = { totalAmount: 0, count: 0, lastDate: null };
    }
    purchaseMap[name].totalAmount += Number(p.totalAmount) || 0;
    purchaseMap[name].count++;
    const d = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
    if (!purchaseMap[name].lastDate || d > purchaseMap[name].lastDate) {
      purchaseMap[name].lastDate = d;
    }
  });

  // Build product count per supplier
  const productMap = {};
  medicines.forEach((m) => {
    const name = (m.supplier || '').toLowerCase();
    if (name) productMap[name] = (productMap[name] || 0) + 1;
  });

  return suppliers.map((s) => {
    const key  = (s.name || '').toLowerCase();
    const pData = purchaseMap[key] || { totalAmount: 0, count: 0, lastDate: null };
    return {
      ...s,
      totalPurchaseValue: pData.totalAmount,
      purchaseCount:      pData.count,
      lastPurchaseDate:   pData.lastDate,
      productCount:       productMap[key] || 0,
    };
  }).sort((a, b) => b.totalPurchaseValue - a.totalPurchaseValue);
};


// ─────────────────────────────────────────────────────────────────────────────
// 11. calcPurchaseTrend
// @param {object[]} purchases — date-filtered purchases
// @param {object} dateRange — { startDate, endDate }
// @returns daily purchase amounts for trend chart
// ─────────────────────────────────────────────────────────────────────────────
export const calcPurchaseTrend = (purchases, dateRange) => {
  const labels   = [];
  const amounts  = [];
  const counts   = [];
  const dateKeys = [];

  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    return { labels, amounts, counts, dateKeys };
  }

  const start = new Date(dateRange.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateRange.endDate);
  end.setHours(0, 0, 0, 0);

  const diffDays     = Math.ceil(Math.abs(end - start) / 86400000) + 1;
  const daysToRender = Math.min(diffDays, 90);

  for (let i = daysToRender - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);

    const label    = d.toLocaleDateString('en-IN', daysToRender > 31 ? { day: '2-digit' } : { day: '2-digit', month: 'short' });
    const dateKey  = d.toISOString().split('T')[0];
    labels.push(label);
    dateKeys.push(dateKey);

    const dayPurchases = purchases.filter((p) => {
      const pd = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
      return pd.toDateString() === d.toDateString();
    });

    amounts.push(dayPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0));
    counts.push(dayPurchases.length);
  }

  return { labels, amounts, counts, dateKeys };
};


// ─────────────────────────────────────────────────────────────────────────────
// 12. calcProfitSummary
// Uses saleItems + medicines to compute gross profit.
// LIMITATION: purchasePrice is current, not historical (documented in UI).
// @param {object[]} saleItems — items for filtered sales
// @param {object[]} medicines — all medicines (purchasePrice lookup)
// @returns { kpi, byProduct, byCategory }
// ─────────────────────────────────────────────────────────────────────────────
export const calcProfitSummary = (saleItems, medicines) => {
  const medMap = {};
  medicines.forEach((m) => { medMap[m.id] = m; });

  const productMap = {};

  saleItems.forEach((item) => {
    const qty       = Number(item.quantity || 1);
    const revenue   = Number(item.unitPrice || item.sellingPrice || 0) * qty;
    const medRec    = medMap[item.medicineId] || {};
    const cost      = Number(medRec.purchasePrice || 0) * qty;
    const profit    = revenue - cost;
    const category  = medRec.category || '—';
    const key       = item.medicineId || item.medicineName || 'Unknown';

    if (!productMap[key]) {
      productMap[key] = {
        medicineId:   item.medicineId || key,
        medicineName: item.medicineName || 'Unknown',
        category,
        revenue: 0, cost: 0, profit: 0, unitsSold: 0,
      };
    }
    productMap[key].revenue   += revenue;
    productMap[key].cost      += cost;
    productMap[key].profit    += profit;
    productMap[key].unitsSold += qty;
  });

  const byProduct = Object.values(productMap).map((p) => ({
    ...p,
    margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);

  // By category
  const catMap = {};
  byProduct.forEach((p) => {
    const cat = p.category || '—';
    if (!catMap[cat]) catMap[cat] = { category: cat, revenue: 0, cost: 0, profit: 0 };
    catMap[cat].revenue += p.revenue;
    catMap[cat].cost    += p.cost;
    catMap[cat].profit  += p.profit;
  });

  const byCategory = Object.values(catMap).map((c) => ({
    ...c,
    margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);

  const totalRevenue = byProduct.reduce((s, p) => s + p.revenue, 0);
  const totalCost    = byProduct.reduce((s, p) => s + p.cost,    0);
  const grossProfit  = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    kpi: { totalRevenue, totalCost, grossProfit, profitMargin },
    byProduct,
    byCategory,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// 13. calcExpiryDetail
// Returns full medicine objects classified by expiry bucket for detail tables.
// ─────────────────────────────────────────────────────────────────────────────
export const calcExpiryDetail = (medicines) => {
  const today = todayStr();
  const day30 = thresholdStr(30);
  const day60 = thresholdStr(60);
  const day90 = thresholdStr(90);

  const withDays = medicines
    .filter((m) => m.expiryDate)
    .map((m) => {
      const expDate   = new Date(m.expiryDate);
      const todayDate = new Date(today);
      const diffMs    = expDate - todayDate;
      const daysLeft  = Math.ceil(diffMs / 86400000);
      let bucket = 'ok';
      if (m.expiryDate < today)         bucket = 'expired';
      else if (m.expiryDate <= day30)   bucket = 'within30';
      else if (m.expiryDate <= day60)   bucket = 'within60';
      else if (m.expiryDate <= day90)   bucket = 'within90';
      return { ...m, daysLeft, bucket };
    });

  return {
    expired:  withDays.filter((m) => m.bucket === 'expired'),
    within30: withDays.filter((m) => m.bucket === 'within30'),
    within60: withDays.filter((m) => m.bucket === 'within60'),
    within90: withDays.filter((m) => m.bucket === 'within90'),
    all:      withDays,
  };
};
