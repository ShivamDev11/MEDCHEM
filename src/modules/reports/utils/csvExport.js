/**
 * @file        csvExport.js
 * @module      Reports
 * @purpose     Reusable CSV export utility.
 *              One function handles all report exports — no library needed.
 *              Data is structured for clean Power BI consumption in Module 6.
 */

// ─────────────────────────────────────────────────────────────────────────────
// exportToCSV
// Converts an array of flat objects to a CSV file and triggers download.
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
// Each mapper returns a flat array of objects with consistent field names.
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
    batchNumber:   m.batchNumber || '',
    expiryDate:    m.expiryDate || '',
    currentStock:  m.quantity || 0,
    minimumStock:  m.minimumStock || 0,
    sellingPrice:  m.sellingPrice || 0,
    purchasePrice: m.purchasePrice || 0,
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
    rank:         i + 1,
    medicineName: m.medicineName || '',
    quantitySold: m.quantitySold || 0,
    revenue:      m.revenue || 0,
  }));
  exportToCSV('top_medicines', rows);
};

export const exportPaymentReport = (paymentMethods) => {
  const rows = Object.entries(paymentMethods).map(([method, data]) => ({
    paymentMethod:      method,
    transactionCount:   data.count || 0,
    totalRevenue:       data.revenue || 0,
  }));
  exportToCSV('payment_methods_report', rows);
};
