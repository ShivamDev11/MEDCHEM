/**
 * @file        csvExport.js
 * @module      Reports
 * @purpose     Reusable CSV export utility.
 *              Converts flat records into structured, downloadable CSVs.
 *              Compatible with Power BI dataset ingestion.
 */

// ─────────────────────────────────────────────────────────────────────────────
// exportToCSV
// Converts an array of flat objects to a CSV file and triggers browser download.
//
// @param {string}   filename - File name without extension (e.g. 'sales_report')
// @param {object[]} rows     - Array of flat objects (each key = column header)
// ─────────────────────────────────────────────────────────────────────────────
export const exportToCSV = (filename, rows) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    // Wrap in quotes if value contains comma, quote, or newline
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// Data mappers — shape raw report data into clean Power BI-ready rows.
// ─────────────────────────────────────────────────────────────────────────────

export const exportSalesReport = (sales) => {
  const rows = sales.map((s) => ({
    saleId:        s.id || '',
    invoiceNumber: s.invoiceNumber || '',
    saleDate:      s.date ? new Date(s.date).toLocaleDateString('en-IN') : '',
    customerName:  s.customerName || 'Walk-in Customer',
    paymentMethod: s.paymentMethod || '',
    subtotal:      s.subtotal || 0,
    discount:      s.discount || 0,
    tax:           s.tax || 0,
    netAmount:     s.netAmount || 0,
    totalItems:    s.totalItems || 0,
    status:        s.status || 'Completed',
  }));
  exportToCSV('sales_report', rows);
};

export const exportInventoryReport = (medicines) => {
  const rows = medicines.map((m) => ({
    medicineId:    m.id || '',
    medicineName:  m.medicineName || '',
    genericName:   m.genericName || '',
    category:      m.category || '',
    manufacturer:  m.manufacturer || '',
    supplier:      m.supplier || '',
    batchNumber:   m.batchNumber || '',
    expiryDate:    m.expiryDate || '',
    currentStock:  m.quantity || 0,
    minimumStock:  m.minimumStock || 0,
    purchasePrice: m.purchasePrice || 0,
    sellingPrice:  m.sellingPrice || 0,
  }));
  exportToCSV('inventory_report', rows);
};

export const exportExpiryReport = (medicines) => {
  const today = new Date().toISOString().split('T')[0];
  const rows  = medicines
    .filter((m) => m.expiryDate)
    .map((m) => ({
      medicineId:   m.id || '',
      medicineName: m.medicineName || '',
      category:     m.category || '',
      batchNumber:  m.batchNumber || '',
      expiryDate:   m.expiryDate || '',
      currentStock: m.quantity || 0,
      status:       m.expiryDate < today ? 'Expired' : 'Active',
    }));
  exportToCSV('expiry_report', rows);
};

export const exportTopMedicines = (topMedicines) => {
  const rows = topMedicines.map((m, i) => ({
    rank:          i + 1,
    medicineName:  m.medicineName || '',
    category:      m.category || '',
    quantitySold:  m.quantitySold || 0,
    revenue:       m.revenue || 0,
    grossProfit:   m.profit || 0,
    profitMargin:  `${(m.margin || 0).toFixed(1)}%`,
    currentStock:  m.currentStock || 0,
  }));
  exportToCSV('top_medicines_report', rows);
};

export const exportPaymentReport = (paymentMethods) => {
  const rows = Object.entries(paymentMethods).map(([method, data]) => ({
    paymentMethod:      method,
    transactionCount:   data.count || 0,
    totalRevenue:       data.revenue || 0,
    revenuePercentage:  `${data.revenuePct || 0}%`,
  }));
  exportToCSV('payment_methods_report', rows);
};

export const exportPurchasesReport = (purchases) => {
  const rows = purchases.map((p) => ({
    purchaseId:   p.id || '',
    orderDate:    p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
    supplierName: p.supplierName || '',
    totalAmount:  p.totalAmount || 0,
    status:       p.status || 'Completed',
    notes:        p.notes || '',
  }));
  exportToCSV('purchases_report', rows);
};

export const exportSuppliersReport = (suppliers) => {
  const rows = suppliers.map((s) => ({
    supplierId:         s.id || '',
    name:               s.name || '',
    contactNumber:      s.contactNumber || '',
    email:              s.email || '',
    totalPurchaseValue: s.totalPurchaseValue || 0,
    purchaseCount:      s.purchaseCount || 0,
    catalogProducts:    s.productCount || 0,
  }));
  exportToCSV('supplier_analytics_report', rows);
};

export const exportProfitReport = (profitSummary) => {
  if (!profitSummary || !profitSummary.byProduct) return;
  const rows = profitSummary.byProduct.map((p) => ({
    medicineName:  p.medicineName,
    category:      p.category,
    unitsSold:     p.unitsSold,
    revenue:       p.revenue,
    costOfGoods:   p.cost,
    grossProfit:   p.profit,
    profitMargin:  `${(p.margin || 0).toFixed(1)}%`,
  }));
  exportToCSV('profit_margin_report', rows);
};
