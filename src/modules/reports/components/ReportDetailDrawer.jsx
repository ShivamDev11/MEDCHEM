/**
 * @file        ReportDetailDrawer.jsx
 * @module      Reports
 * @purpose     Offcanvas drill-through detail drawer. Renders full data tables
 *              for sales, inventory, low-stock, expiry, purchases, and profit metrics.
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiArrowLeft, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { DRAWER_MODES } from '../constants/reportsConstants';
import ReportsDataTable from './ReportsDataTable';
import { getSaleItems } from '../../sales/services/salesService';

const fmtCurrency = (n) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0);

const ReportDetailDrawer = ({
  drawer,
  closeDrawer,
  sales = [],
  medicines = [],
  purchases = [],
  topMedicines = [],
  profitSummary,
  expiryDetail,
}) => {
  const [activeSale, setActiveSale]       = useState(null);
  const [saleItems, setSaleItems]         = useState([]);
  const [loadingItems, setLoadingItems]   = useState(false);

  // Reset drill-level state when drawer closes or mode changes
  useEffect(() => {
    if (!drawer.open) {
      setActiveSale(null);
      setSaleItems([]);
    }
  }, [drawer.open, drawer.mode]);

  // When a sale is clicked to inspect items
  const handleSaleClick = async (sale) => {
    setActiveSale(sale);
    setLoadingItems(true);
    try {
      const items = await getSaleItems(sale.id);
      setSaleItems(items);
    } catch (err) {
      console.error('Failed to load sale items:', err);
      setSaleItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  if (!drawer.open) return null;

  // ── Render Drawer Body based on Drawer Mode ───────────────────────────────
  const renderContent = () => {
    // 1. Single Sale Detail Drill-down view
    if (activeSale) {
      return (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0 mb-3 d-flex align-items-center gap-1"
            onClick={() => setActiveSale(null)}
          >
            <FiArrowLeft size={14} /> Back to Sales List
          </button>

          {/* Sale Summary Banner */}
          <div className="card border-0 shadow-sm p-3 mb-3" style={{ borderRadius: '10px', background: '#f8f9fa' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                Invoice #{activeSale.invoiceNumber || activeSale.id}
              </span>
              <span className={`rp-badge ${activeSale.status === 'Completed' ? 'rp-badge-success' : 'rp-badge-warning'}`}>
                {activeSale.status || 'Completed'}
              </span>
            </div>
            <div className="row g-2" style={{ fontSize: '0.78rem' }}>
              <div className="col-6">
                <span className="text-muted d-block">Customer</span>
                <strong>{activeSale.customerName || 'Walk-in Customer'}</strong>
              </div>
              <div className="col-6">
                <span className="text-muted d-block">Payment Method</span>
                <strong>{activeSale.paymentMethod || 'Cash'}</strong>
              </div>
              <div className="col-6">
                <span className="text-muted d-block">Sale Date</span>
                <strong>
                  {activeSale.date instanceof Date
                    ? activeSale.date.toLocaleDateString('en-IN')
                    : String(activeSale.date)}
                </strong>
              </div>
              <div className="col-6">
                <span className="text-muted d-block">Grand Total</span>
                <strong className="text-success">{fmtCurrency(activeSale.netAmount)}</strong>
              </div>
            </div>
          </div>

          <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem' }}>
            Purchased Medicines ({saleItems.length})
          </h6>

          <ReportsDataTable
            data={saleItems}
            loading={loadingItems}
            columns={[
              { key: 'medicineName', label: 'Medicine' },
              { key: 'batchNumber', label: 'Batch' },
              { key: 'quantity', label: 'Qty', align: 'center' },
              { key: 'unitPrice', label: 'Unit Price', align: 'right', isCurrency: true },
              { key: 'subtotal', label: 'Subtotal', align: 'right', isCurrency: true },
            ]}
            exportFilename={`invoice_${activeSale.invoiceNumber || activeSale.id}`}
            emptyMessage="No items found for this invoice."
          />
        </div>
      );
    }

    // 2. Sales Transactions List
    if (drawer.mode === DRAWER_MODES.SALES_LIST) {
      let data = sales;
      if (drawer.context?.paymentMethod) {
        data = data.filter((s) => s.paymentMethod === drawer.context.paymentMethod);
      }
      if (drawer.context?.dateStr) {
        data = data.filter((s) => {
          const d = s.date instanceof Date ? s.date.toISOString().split('T')[0] : '';
          return d === drawer.context.dateStr;
        });
      }

      return (
        <ReportsDataTable
          data={data}
          onRowClick={handleSaleClick}
          columns={[
            { key: 'invoiceNumber', label: 'Invoice No.' },
            {
              key: 'date',
              label: 'Date',
              render: (val) => (val instanceof Date ? val.toLocaleDateString('en-IN') : String(val)),
            },
            { key: 'customerName', label: 'Customer' },
            { key: 'totalItems', label: 'Items', align: 'center' },
            {
              key: 'paymentMethod',
              label: 'Payment',
              render: (val) => (
                <span className="rp-badge rp-badge-primary">{val || 'Cash'}</span>
              ),
            },
            {
              key: 'netAmount',
              label: 'Total (₹)',
              align: 'right',
              isCurrency: true,
            },
            {
              key: 'status',
              label: 'Status',
              render: (val) => (
                <span className={`rp-badge ${val === 'Completed' ? 'rp-badge-success' : 'rp-badge-warning'}`}>
                  {val || 'Completed'}
                </span>
              ),
            },
          ]}
          exportFilename="sales_transactions"
          searchPlaceholder="Search invoice, customer, payment..."
        />
      );
    }

    // 3. Inventory Medicines List
    if (drawer.mode === DRAWER_MODES.INVENTORY_LIST) {
      let data = medicines;
      if (drawer.context?.filterStatus === 'outOfStock') {
        data = data.filter((m) => Number(m.quantity) === 0);
      } else if (drawer.context?.category) {
        data = data.filter((m) => m.category === drawer.context.category);
      }

      return (
        <ReportsDataTable
          data={data}
          columns={[
            { key: 'medicineName', label: 'Medicine' },
            { key: 'category', label: 'Category' },
            { key: 'quantity', label: 'Stock', align: 'center' },
            { key: 'minimumStock', label: 'Min', align: 'center' },
            { key: 'purchasePrice', label: 'Cost (₹)', align: 'right', isCurrency: true },
            { key: 'sellingPrice', label: 'Price (₹)', align: 'right', isCurrency: true },
            { key: 'expiryDate', label: 'Expiry' },
            {
              key: 'quantity',
              label: 'Status',
              render: (val, row) => {
                const qty = Number(val) || 0;
                const min = Number(row.minimumStock) || 0;
                if (qty === 0) return <span className="rp-badge rp-badge-danger">Out of Stock</span>;
                if (qty <= min) return <span className="rp-badge rp-badge-warning">Low Stock</span>;
                return <span className="rp-badge rp-badge-success">In Stock</span>;
              },
            },
          ]}
          exportFilename="inventory_medicines"
          searchPlaceholder="Search medicine name, category, batch..."
        />
      );
    }

    // 4. Low-Stock List
    if (drawer.mode === DRAWER_MODES.LOW_STOCK_LIST) {
      const data = medicines.filter(
        (m) => Number(m.quantity) >= 0 && Number(m.quantity) <= Number(m.minimumStock || 0)
      );

      return (
        <div>
          <div className="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
            <FiAlertTriangle size={15} />
            <span>Showing items requiring reorder. Stock is at or below minimum threshold.</span>
          </div>
          <ReportsDataTable
            data={data}
            columns={[
              { key: 'medicineName', label: 'Medicine' },
              { key: 'category', label: 'Category' },
              { key: 'supplier', label: 'Supplier' },
              { key: 'quantity', label: 'Current Stock', align: 'center' },
              { key: 'minimumStock', label: 'Reorder Level', align: 'center' },
              {
                key: 'suggestedReorder',
                label: 'Suggested Order',
                align: 'center',
                render: (_, row) => {
                  const min = Number(row.minimumStock || 10);
                  const curr = Number(row.quantity || 0);
                  return <strong className="text-primary">{Math.max(1, min * 2 - curr)}</strong>;
                },
              },
              { key: 'purchasePrice', label: 'Unit Cost', align: 'right', isCurrency: true },
            ]}
            exportFilename="low_stock_reorder_list"
            searchPlaceholder="Search low stock medicines..."
          />
        </div>
      );
    }

    // 5. Expiry List
    if (drawer.mode === DRAWER_MODES.EXPIRY_LIST) {
      const bucket = drawer.context?.bucket || 'expired';
      let data = [];
      if (bucket === 'expired')  data = expiryDetail?.expired || [];
      if (bucket === 'within30') data = expiryDetail?.within30 || [];
      if (bucket === 'within60') data = expiryDetail?.within60 || [];
      if (bucket === 'within90') data = expiryDetail?.within90 || [];
      if (bucket === 'all')      data = expiryDetail?.all || [];

      return (
        <ReportsDataTable
          data={data}
          columns={[
            { key: 'medicineName', label: 'Medicine' },
            { key: 'batchNumber', label: 'Batch' },
            { key: 'category', label: 'Category' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity', label: 'Stock', align: 'center' },
            { key: 'expiryDate', label: 'Expiry Date' },
            {
              key: 'daysLeft',
              label: 'Days Remaining',
              align: 'center',
              render: (val) => {
                if (val < 0) return <span className="rp-badge rp-badge-danger">{Math.abs(val)}d Overdue</span>;
                if (val <= 30) return <span className="rp-badge rp-badge-warning">{val} days</span>;
                return <span className="rp-badge rp-badge-info">{val} days</span>;
              },
            },
          ]}
          exportFilename={`expiry_report_${bucket}`}
          searchPlaceholder="Search medicine, batch, supplier..."
        />
      );
    }

    // 6. Top Products & Product Performance
    if (drawer.mode === DRAWER_MODES.TOP_PRODUCTS) {
      return (
        <ReportsDataTable
          data={topMedicines}
          columns={[
            {
              key: 'rank',
              label: '#',
              width: '40px',
              render: (_, __, idx) => <span className="rp-rank-badge rp-rank-n">{idx + 1}</span>,
            },
            { key: 'medicineName', label: 'Medicine' },
            { key: 'category', label: 'Category' },
            { key: 'quantitySold', label: 'Qty Sold', align: 'center' },
            { key: 'revenue', label: 'Revenue (₹)', align: 'right', isCurrency: true },
            { key: 'profit', label: 'Gross Profit', align: 'right', isCurrency: true },
            {
              key: 'margin',
              label: 'Margin %',
              align: 'right',
              render: (val) => `${(Number(val) || 0).toFixed(1)}%`,
            },
            { key: 'currentStock', label: 'In Stock', align: 'center' },
          ]}
          exportFilename="top_selling_products"
          searchPlaceholder="Search product performance..."
        />
      );
    }

    // 7. Purchase Orders List
    if (drawer.mode === DRAWER_MODES.PURCHASE_LIST) {
      let data = purchases;
      if (drawer.context?.supplierName) {
        data = data.filter((p) => p.supplierName === drawer.context.supplierName);
      }

      return (
        <ReportsDataTable
          data={data}
          columns={[
            { key: 'id', label: 'Order ID' },
            {
              key: 'createdAt',
              label: 'Date',
              render: (val) => (val instanceof Date ? val.toLocaleDateString('en-IN') : String(val)),
            },
            { key: 'supplierName', label: 'Supplier' },
            {
              key: 'totalAmount',
              label: 'Amount (₹)',
              align: 'right',
              isCurrency: true,
            },
            {
              key: 'status',
              label: 'Status',
              render: (val) => (
                <span className="rp-badge rp-badge-success">{val || 'Completed'}</span>
              ),
            },
            { key: 'notes', label: 'Notes' },
          ]}
          exportFilename="purchase_invoices"
          searchPlaceholder="Search supplier or order ID..."
        />
      );
    }

    // 8. Profit Breakdown
    if (drawer.mode === DRAWER_MODES.PROFIT_LIST) {
      const products = profitSummary?.byProduct || [];

      return (
        <div>
          <div className="rp-disclaimer">
            <FiAlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Note on Profit Calculation:</strong> Profit is calculated as (Selling Price &minus; Current Purchase Price) &times; Units Sold. If purchase prices have changed over time, values reflect margins based on current inventory replacement cost.
            </span>
          </div>

          <ReportsDataTable
            data={products}
            columns={[
              { key: 'medicineName', label: 'Medicine' },
              { key: 'category', label: 'Category' },
              { key: 'unitsSold', label: 'Units Sold', align: 'center' },
              { key: 'revenue', label: 'Revenue (₹)', align: 'right', isCurrency: true },
              { key: 'cost', label: 'Cost of Goods (₹)', align: 'right', isCurrency: true },
              { key: 'profit', label: 'Gross Profit (₹)', align: 'right', isCurrency: true },
              {
                key: 'margin',
                label: 'Margin %',
                align: 'right',
                render: (val) => {
                  const num = Number(val) || 0;
                  const color = num >= 20 ? '#059669' : num >= 10 ? '#d97706' : '#dc2626';
                  return <strong style={{ color }}>{num.toFixed(1)}%</strong>;
                },
              },
            ]}
            exportFilename="profit_margin_analysis"
            searchPlaceholder="Search profit analysis by product..."
          />
        </div>
      );
    }

    return <p className="text-muted">No details available.</p>;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1045 }}
        onClick={closeDrawer}
      />

      {/* Offcanvas Drawer */}
      <div
        className="offcanvas offcanvas-end show rp-drawer shadow-lg"
        tabIndex="-1"
        style={{
          visibility: 'visible',
          zIndex: 1050,
          width: '750px',
          maxWidth: '100vw',
        }}
      >
        <div className="offcanvas-header d-flex justify-content-between align-items-center">
          <h5 className="offcanvas-title">{drawer.title || 'Record Details'}</h5>
          <button
            type="button"
            className="btn-close text-reset"
            aria-label="Close"
            onClick={closeDrawer}
          />
        </div>
        <div className="offcanvas-body">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ReportDetailDrawer;
