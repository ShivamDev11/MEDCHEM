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
  FiActivity,
  FiHash
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

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
    if (id) fetchDetails();
  }, [id, fetchDetails]);

  // ── Derived computations ───────────────────────────────────────────────────
  const stockStatus = useMemo(() => {
    if (!medicine) return { text: "", class: "" };
    const qty = Number(medicine.quantity) || 0;
    const min = Number(medicine.minimumStock) || 0;
    let text = STOCK_STATUS.NORMAL;
    if (qty === 0) text = STOCK_STATUS.OUT_OF_STOCK;
    else if (qty <= min) text = STOCK_STATUS.LOW;
    return { text, class: STOCK_STATUS_COLORS[text] || "bg-secondary" };
  }, [medicine]);

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

  const financialMetrics = useMemo(() => {
    if (!medicine) return { markup: 0, margin: 0 };
    const buy  = Number(medicine.purchasePrice) || 0;
    const sell = Number(medicine.sellingPrice)  || 0;
    if (buy <= 0) return { markup: sell, margin: 100 };
    const markup = sell - buy;
    const margin = (markup / sell) * 100;
    return { markup: markup.toFixed(2), margin: margin.toFixed(1) };
  }, [medicine]);

  const formatTimestamp = useCallback((timestampObj) => {
    if (!timestampObj) return "N/A";
    if (typeof timestampObj.toDate === "function") {
      return timestampObj.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    }
    try {
      const date = new Date(timestampObj);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
      }
    } catch { /* return raw */ }
    return String(timestampObj);
  }, []);

  const breadcrumbs = useMemo(() => [
    { label: "Inventory", path: "/inventory" },
    { label: "Medicine Details" }
  ], []);

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container-fluid py-4 inv-page-container" aria-busy="true">
        <InventoryHeader title="Loading Details..." breadcrumbs={breadcrumbs} />
        <div className="inv-spinner-wrap">
          <div className="inv-brand-spinner" role="status" aria-label="Loading record details" />
          <p className="text-muted small mb-0">Fetching medicine record…</p>
        </div>
      </div>
    );
  }

  // ── Render: Error ──────────────────────────────────────────────────────────
  if (error || !medicine) {
    return (
      <div className="container-fluid py-4 inv-page-container">
        <InventoryHeader title="Record Unavailable" breadcrumbs={breadcrumbs} />
        <div className="inv-empty-state text-center p-5 card border-0 shadow-sm">
          <div className="py-4">
            <div className="inv-empty-icon-wrap">
              <FiXCircle size={30} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Details Unavailable</h4>
            <p className="text-muted mb-4" style={{ maxWidth: "360px", margin: "0 auto 1.5rem" }}>
              {error || "Could not resolve record details."}
            </p>
            <button
              type="button"
              className="btn inv-btn-secondary d-inline-flex align-items-center gap-2"
              onClick={() => navigate("/inventory")}
            >
              <FiArrowLeft size={15} />
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Success ────────────────────────────────────────────────────────
  const ExpiryIcon = expiryStatus.icon;

  return (
    <div className="container-fluid py-4 inv-page-container">
      {/* Page Header */}
      <InventoryHeader
        title={medicine.medicineName}
        subtitle={medicine.genericName ? `Generic: ${medicine.genericName}` : "Medicine Details"}
        breadcrumbs={breadcrumbs}
      />

      <div className="row g-4">
        {/* ── Left Column ── */}
        <div className="col-12 col-lg-8">

          {/* Expiry Notification */}
          <div className={`d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded ${expiryStatus.class} inv-details-card-animate`}>
            <ExpiryIcon size={18} className="flex-shrink-0" />
            <div>
              <span className="fw-bold">Expiry Status:</span> {expiryStatus.label}
            </div>
          </div>

          {/* Card: Technical Specifications */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card inv-details-card-animate">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiActivity className="text-primary" size={17} />
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1rem" }}>Technical Specifications</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">Medicine Name</span>
                    <span className="inv-detail-value" style={{ fontSize: "1.05rem" }}>{medicine.medicineName}</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">Generic Formulation</span>
                    <span className="inv-detail-value">{medicine.genericName || "Not Specified"}</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">
                      <FiTruck size={11} className="me-1" />Manufacturer
                    </span>
                    <span className="inv-detail-value">{medicine.manufacturer}</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">
                      <FiTruck size={11} className="me-1" />Supplier
                    </span>
                    <span className="inv-detail-value">{medicine.supplier}</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">
                      <FiTag size={11} className="me-1" />Category
                    </span>
                    <span className="mt-1">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1" style={{ fontSize: "0.82rem" }}>
                        {medicine.category}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">
                      <FiHash size={11} className="me-1" />Batch Identifier
                    </span>
                    <span className="font-monospace fw-bold text-dark inv-detail-value">{medicine.batchNumber}</span>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="inv-detail-item">
                    <span className="inv-detail-label">
                      <FiCalendar size={11} className="me-1" />Expiry Date
                    </span>
                    <span className="inv-detail-value">{medicine.expiryDate}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card: Description */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card inv-details-card-animate">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiFileText className="text-primary" size={17} />
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1rem" }}>Dosage & Description</h5>
            </div>
            <div className="card-body p-4">
              <p className="text-secondary mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.7, fontSize: "0.925rem" }}>
                {medicine.description || "No description or remarks provided for this record."}
              </p>
            </div>
          </div>

          {/* Card: Audit Trail */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card inv-details-card-animate" style={{ background: "var(--inv-bg-subtle)" }}>
            <div className="card-body p-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
                <FiClock size={15} className="text-secondary" />
                Audit Trail
              </h6>
              <div className="row g-3" style={{ fontSize: "0.835rem" }}>
                <div className="col-12 col-sm-6">
                  <div className="text-muted mb-1">Created On</div>
                  <div className="text-dark fw-semibold">{formatTimestamp(medicine.createdAt)}</div>
                  <div className="text-muted mt-2 mb-1">Created By</div>
                  <div className="text-dark fw-semibold font-monospace">{medicine.createdBy || "System"}</div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="text-muted mb-1">Last Updated</div>
                  <div className="text-dark fw-semibold">{formatTimestamp(medicine.updatedAt)}</div>
                  <div className="text-muted mt-2 mb-1">Updated By</div>
                  <div className="text-dark fw-semibold font-monospace">{medicine.updatedBy || "System"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="col-12 col-lg-4">

          {/* Card: Stock Tracker */}
          <div className="card border-0 shadow-sm mb-4 text-center overflow-hidden inv-details-card-animate">
            <div className="card-body py-4 px-4">
              <span className={`badge ${stockStatus.class} px-3 py-2 rounded-pill inv-status-pill mb-3 d-inline-block`}>
                {stockStatus.text}
              </span>
              <div className="mb-1">
                <span className="text-muted small d-block mb-1">Current Stock Count</span>
                <div className="fw-bold text-dark" style={{ fontSize: "2.5rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {Number(medicine.quantity).toLocaleString()}
                </div>
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>units</span>
              </div>
              <div className="border-top mt-3 pt-3 text-start" style={{ fontSize: "0.83rem" }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Minimum Alert Limit</span>
                  <span className="fw-bold text-dark">{Number(medicine.minimumStock).toLocaleString()} units</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Restock Required</span>
                  <span className={`fw-bold ${Number(medicine.quantity) <= Number(medicine.minimumStock) ? "text-danger" : "text-success"}`}>
                    {Number(medicine.quantity) <= Number(medicine.minimumStock) ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Pricing Analytics */}
          <div className="card border-0 shadow-sm mb-4 inv-details-card inv-details-card-animate">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <FiDollarSign className="text-primary" size={17} />
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1rem" }}>Pricing Analytics</h5>
            </div>
            <div className="card-body p-4">
              {/* Price comparison */}
              <div className="row g-0 mb-4 text-center">
                <div className="col-6 border-end">
                  <div className="text-muted small mb-1">Purchase Price</div>
                  <div className="fw-bold text-dark" style={{ fontSize: "1.35rem" }}>₹{Number(medicine.purchasePrice).toFixed(2)}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted small mb-1">Selling Price</div>
                  <div className="fw-bold text-primary" style={{ fontSize: "1.35rem" }}>₹{Number(medicine.sellingPrice).toFixed(2)}</div>
                </div>
              </div>

              {/* Margin details */}
              <div className="p-3 rounded" style={{ background: "var(--inv-bg-subtle)", border: "1px solid var(--inv-border-light)" }}>
                <div className="text-center mb-3">
                  <span className="fw-bold text-dark" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <FiActivity size={13} className="me-1 text-success" />
                    Estimated Margins
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: "0.83rem" }}>
                  <span className="text-muted">Markup per unit</span>
                  <span className="text-success fw-bold">₹{financialMetrics.markup}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: "0.83rem" }}>
                  <span className="text-muted">Gross Profit Margin</span>
                  <span className="badge bg-success text-white px-2 py-1 fw-bold">
                    {financialMetrics.margin}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column gap-2 mb-4">
            <button
              type="button"
              className="btn inv-btn-primary d-flex align-items-center justify-content-center gap-2 py-2"
              onClick={() => navigate(`/inventory/edit/${medicine.id}`)}
            >
              <FiEdit size={15} />
              Edit Specifications
            </button>
            <button
              type="button"
              className="btn inv-btn-secondary d-flex align-items-center justify-content-center gap-2 py-2"
              onClick={() => navigate("/inventory")}
            >
              <FiArrowLeft size={15} />
              Back to Inventory
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MedicineDetails;
