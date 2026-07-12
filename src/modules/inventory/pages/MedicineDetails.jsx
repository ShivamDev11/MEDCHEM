/**
 * @file        MedicineDetails.jsx
 * @module      Inventory
 * @purpose     Page component for rendering a read-only details dashboard of a medicine.
 *              Fetches the record on mount using useParams `id`. Displays all business
 *              fields, stock status indicators, expiry warnings, created/updated audits,
 *              and advanced business calculations (Markup and Profit Margin).
 * @dependencies react, react-router-dom, react-icons, inventoryService,
 *               inventoryConstants, InventoryHeader, inventory.css
 * @exports     MedicineDetails (default)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiEdit, 
  FiCalendar, 
  FiPackage, 
  FiTag, 
  FiDollarSign, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle, 
  FiTruck, 
  FiActivity 
} from "react-icons/fi";

import { getMedicineById } from "../services/inventoryService";
import { 
  STOCK_STATUS, 
  STOCK_STATUS_COLORS, 
  EXPIRY_WARNING_DAYS 
} from "../constants/inventoryConstants";
import InventoryHeader from "../components/InventoryHeader";

import "../inventory.css";

function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── States ─────────────────────────────────────────────────────────────────
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch Details ──────────────────────────────────────────────────────────
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicineById(id);
      if (!data) {
        setError("Medicine record not found or has been soft-deleted.");
        return;
      }
      setMedicine(data);
    } catch (err) {
      console.error("[MedicineDetails] Failed to load details:", err);
      setError("Failed to retrieve medicine details. Please reload.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, fetchDetails]);

  // ── Helpers & Business Computations ────────────────────────────────────────

  // Stock status determination
  const stockStatus = useMemo(() => {
    if (!medicine) return { text: "", class: "" };
    
    const qty = Number(medicine.quantity) || 0;
    const min = Number(medicine.minimumStock) || 0;
    
    let text = STOCK_STATUS.NORMAL;
    if (qty === 0) text = STOCK_STATUS.OUT_OF_STOCK;
    else if (qty <= min) text = STOCK_STATUS.LOW;
    
    return {
      text,
      class: STOCK_STATUS_COLORS[text] || "bg-secondary"
    };
  }, [medicine]);

  // Expiry evaluation
  const expiryStatus = useMemo(() => {
    if (!medicine || !medicine.expiryDate) return { label: "Unknown", class: "text-muted", icon: FiXCircle };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(medicine.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (expiry < today) {
      return { label: "Expired", class: "text-danger fw-bold alert alert-danger border-0", icon: FiXCircle };
    }
    if (diffDays >= 0 && diffDays <= EXPIRY_WARNING_DAYS) {
      return { label: `Expiring Soon (${diffDays} days left)`, class: "text-warning fw-bold alert alert-warning border-0 text-dark", icon: FiAlertTriangle };
    }
    return { label: "Good / Active", class: "text-success alert alert-success border-0", icon: FiCheckCircle };
  }, [medicine]);

  // Business Analytics: Markup (₹) & Margin (%)
  const financialMetrics = useMemo(() => {
    if (!medicine) return { markup: 0, margin: 0 };
    
    const buy  = Number(medicine.purchasePrice) || 0;
    const sell = Number(medicine.sellingPrice) || 0;
    
    if (buy <= 0) return { markup: sell, margin: 100 };
    
    const markup = sell - buy;
    const margin = (markup / sell) * 100;
    
    return {
      markup: markup.toFixed(2),
      margin: margin.toFixed(1)
    };
  }, [medicine]);

  // Formatted date string parser (handles Firestore timestamps safely)
  const formatTimestamp = useCallback((timestampObj) => {
    if (!timestampObj) return "N/A";
    
    // Check if it is a Firestore Timestamp object with toDate()
    if (typeof timestampObj.toDate === "function") {
      return timestampObj.toDate().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    }
    
    // Check if ISO string or parseable string
    try {
      const date = new Date(timestampObj);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        });
      }
    } catch {
      // return raw value if parsing fails
    }
    
    return String(timestampObj);
  }, []);

  // ── Breadcrumb Structure ───────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => [
    { label: "Inventory", path: "/inventory" },
    { label: "Medicine Details" }
  ], []);

  // ── Render: Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container-fluid py-4 inv-page-container" aria-busy="true">
        <InventoryHeader title="Loading Details..." breadcrumbs={breadcrumbs} />
        <div className="inv-spinner-wrap text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Record Details...</span>
          </div>
          <p className="text-muted mt-2 small">Fetching record specifications...</p>
        </div>
      </div>
    );
  }

  // ── Render: Error state ────────────────────────────────────────────────────
  if (error || !medicine) {
    return (
      <div className="container-fluid py-4 inv-page-container">
        <InventoryHeader title="Record Unavailable" breadcrumbs={breadcrumbs} />
        <div className="inv-empty-state text-center p-5 card border-0 shadow-sm">
          <div className="py-4">
            <FiXCircle size={48} className="text-danger mb-3" />
            <h4 className="fw-bold text-dark">Details Unavailable</h4>
            <p className="text-muted mb-4 max-w-sm mx-auto">{error || "Could not resolve record details."}</p>
            <button
              type="button"
              className="btn inv-btn-secondary d-inline-flex align-items-center gap-2"
              onClick={() => navigate("/inventory")}
            >
              <FiArrowLeft size={16} />
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Success state ──────────────────────────────────────────────────
  const ExpiryIcon = expiryStatus.icon;

  return (
    <div className="container-fluid py-4 inv-page-container">
      {/* Page Header */}
      <InventoryHeader
        title={medicine.medicineName}
        subtitle={medicine.genericName ? `Generic: ${medicine.genericName}` : "Medicine Details Page"}
        breadcrumbs={breadcrumbs}
      />

      <div className="row g-4 justify-content-center">
        {/* Left Column: Visual Analytics & Details Panels */}
        <div className="col-12 col-lg-8">
          
          {/* Expiry Notification Alert Box */}
          <div className={`d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded ${expiryStatus.class}`}>
            <ExpiryIcon size={20} className="flex-shrink-0" />
            <div>
              <span className="fw-bold">Expiry Condition:</span> {expiryStatus.label}
            </div>
          </div>

          {/* Card Module: Specific Details */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiActivity className="text-primary" size={18} />
              <h5 className="mb-0 fw-bold text-dark">Technical Specifications</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label d-block text-muted small mb-1">Medicine Name</span>
                    <strong className="inv-detail-value text-dark h5 mb-0 d-block">{medicine.medicineName}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label d-block text-muted small mb-1">Generic Formulation</span>
                    <span className="inv-detail-value text-dark fw-semibold">{medicine.genericName || "Not Specified"}</span>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label d-block text-muted small mb-1">Manufacturer</span>
                    <span className="inv-detail-value text-dark fw-semibold">{medicine.manufacturer}</span>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label d-block text-muted small mb-1">Supplier</span>
                    <span className="inv-detail-value text-dark fw-semibold">{medicine.supplier}</span>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item flex-row d-flex gap-2">
                    <div className="input-group-text bg-light border-0 rounded p-2"><FiTag size={16} className="text-secondary" /></div>
                    <div>
                      <span className="inv-detail-label d-block text-muted small">Category Group</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{medicine.category}</span>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item flex-row d-flex gap-2">
                    <div className="input-group-text bg-light border-0 rounded p-2"><FiPackage size={16} className="text-secondary" /></div>
                    <div>
                      <span className="inv-detail-label d-block text-muted small">Batch Identifier</span>
                      <span className="font-monospace fw-bold text-dark">{medicine.batchNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiFileText className="text-primary" size={18} />
              <h5 className="mb-0 fw-bold text-dark">Dosage & Description Details</h5>
            </div>
            <div className="card-body p-4">
              <p className="text-secondary mb-0 leading-relaxed font-sans" style={{ whiteSpace: "pre-line" }}>
                {medicine.description || "No dosage description or remarks provided for this record."}
              </p>
            </div>
          </div>

          {/* Audit Trail Section */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card bg-light border">
            <div className="card-body p-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-1">
                <FiClock size={16} />
                Audit Logs
              </h6>
              <div className="row g-3 small text-secondary">
                <div className="col-12 col-sm-6">
                  <div>Created On: <span className="text-dark fw-semibold">{formatTimestamp(medicine.createdAt)}</span></div>
                  <div>Created By: <span className="text-dark fw-semibold font-monospace">{medicine.createdBy || "System"}</span></div>
                </div>
                <div className="col-12 col-sm-6">
                  <div>Last Updated: <span className="text-dark fw-semibold">{formatTimestamp(medicine.updatedAt)}</span></div>
                  <div>Last Updated By: <span className="text-dark fw-semibold font-monospace">{medicine.updatedBy || "System"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Quantity Statistics */}
        <div className="col-12 col-lg-4">
          
          {/* Card Module: Stock Tracker */}
          <div className="card border-0 shadow-sm mb-4 text-center overflow-hidden">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <span className={`badge ${stockStatus.class} px-3 py-2 rounded-pill inv-status-pill`}>
                {stockStatus.text}
              </span>
            </div>
            <div className="card-body py-4 px-4">
              <div className="mb-2">
                <span className="text-muted small d-block">Current Stock Count</span>
                <span className="display-4 fw-extrabold text-dark tracking-tight">
                  {Number(medicine.quantity).toLocaleString()}
                </span>
                <span className="text-muted ms-1">units</span>
              </div>
              <div className="border-top my-3 pt-3 text-start small text-secondary">
                <div className="d-flex justify-content-between mb-1">
                  <span>Minimum Alert Limit:</span>
                  <span className="fw-bold text-dark">{Number(medicine.minimumStock).toLocaleString()} units</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Restock Action Required:</span>
                  <span className={Number(medicine.quantity) <= Number(medicine.minimumStock) ? "text-danger fw-bold" : "text-success fw-bold"}>
                    {Number(medicine.quantity) <= Number(medicine.minimumStock) ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Module: Pricing & Profit Margins */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiDollarSign className="text-primary" size={18} />
              <h5 className="mb-0 fw-bold text-dark">Pricing Analytics</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col-6 text-center border-end">
                    <span className="text-muted small d-block">Purchase Price</span>
                    <h4 className="fw-bold text-dark mb-0">₹{Number(medicine.purchasePrice).toFixed(2)}</h4>
                  </div>
                  <div className="col-6 text-center">
                    <span className="text-muted small d-block">Selling Price</span>
                    <h4 className="fw-bold text-primary mb-0">₹{Number(medicine.sellingPrice).toFixed(2)}</h4>
                  </div>
                </div>
              </div>
              
              {/* Derived Financial Analytics */}
              <div className="p-3 bg-light rounded border">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-1 justify-content-center">
                  <FiActivity size={14} className="text-success" />
                  Estimated Margin Details
                </h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Markup (Profit / Unit):</span>
                  <span className="text-success fw-bold">₹{financialMetrics.markup}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Gross Profit Margin:</span>
                  <span className="badge bg-success text-white px-2 py-1 fw-bold">
                    {financialMetrics.margin}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex flex-column gap-2 mb-4">
            <button
              type="button"
              className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              onClick={() => navigate(`/inventory/edit/${medicine.id}`)}
            >
              <FiEdit size={16} />
              Edit Specifications
            </button>
            <button
              type="button"
              className="btn btn-secondary d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              onClick={() => navigate("/inventory")}
            >
              <FiArrowLeft size={16} />
              Back to Inventory
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MedicineDetails;
