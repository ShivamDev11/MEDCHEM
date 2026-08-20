/**
 * @file        EditMedicine.jsx
 * @module      Inventory
 * @purpose     Page component for modifying an existing medicine record in Firestore.
 *              Fetches the document by router parameter `id` on mount, loads it as
 *              initial form values, and triggers the update service call.
 *              Handles loading states, document existence checks, and duplicate errors.
 * @dependencies react, react-router-dom, react-toastify, inventoryService,
 *               inventoryConstants, InventoryHeader, MedicineForm, inventory.css
 * @exports     EditMedicine (default)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { FiAlertTriangle, FiArrowLeft } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

import { getMedicineById, updateMedicine } from "../services/inventoryService";
import { TOAST_MESSAGES, VALIDATION_RULES } from "../constants/inventoryConstants";
import { playInventoryUpdated, playError } from "../../../shared/services/audioService";
import InventoryHeader from "../components/InventoryHeader";
import MedicineForm from "../components/MedicineForm";

import "../inventory.css";

function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── States ─────────────────────────────────────────────────────────────────
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch Existing Doc ─────────────────────────────────────────────────────
  const loadMedicine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedicineById(id);
      if (!data) {
        // Document either does not exist or has been soft-deleted
        setError("Medicine record not found or has been removed.");
        toast.error("Medicine record not found.");
        return;
      }
      setMedicine(data);
    } catch (err) {
      console.error("[EditMedicine] Failed to load medicine:", err);
      setError("Failed to fetch medicine details. Please try again.");
      toast.error(TOAST_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadMedicine();
    }
  }, [id, loadMedicine]);

  // ── Breadcrumb Structure ───────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => [
    { label: "Inventory", path: "/inventory" },
    { label: "Edit Medicine" }
  ], []);

  // ── Form Submission Handler ────────────────────────────────────────────────
  const handleSubmit = useCallback(async (formData) => {
    try {
      // Trigger update in service layer
      await updateMedicine(id, formData, "system"); // Fallback UID
      
      playInventoryUpdated();
      toast.success(TOAST_MESSAGES.MEDICINE_UPDATED);
      
      // Delay redirect to allow toast consumption
      setTimeout(() => {
        navigate("/inventory");
      }, 1500);
    } catch (err) {
      console.error("[EditMedicine] Update failed:", err);
      playError();
      
      if (err.code === "DUPLICATE") {
        toast.warning(TOAST_MESSAGES.DUPLICATE_FOUND);
      } else {
        toast.error(TOAST_MESSAGES.UPDATE_ERROR);
      }
      
      // Re-throw to reset form submission loading state
      throw err;
    }
  }, [id, navigate]);

  // ── Render States ──────────────────────────────────────────────────────────
  
  // Render: Document Not Found / Load Failure
  const errorState = error && (
    <div className="inv-empty-state text-center p-5 card border-0 shadow-sm">
      <div className="py-4">
        <div className="inv-empty-icon-wrap">
          <FiAlertTriangle size={28} />
        </div>
        <h4 className="fw-bold text-dark mb-2">Record Unavailable</h4>
        <p className="text-muted mb-4" style={{ maxWidth: "360px", margin: "0 auto 1.5rem" }}>{error}</p>
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
  );

  return (
    <div className="container-fluid py-4 inv-page-container">
      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Page Header */}
      <InventoryHeader
        title={medicine ? `Edit: ${medicine.medicineName}` : "Edit Medicine"}
        subtitle="Update specifications and stock details for this inventory item."
        breadcrumbs={breadcrumbs}
      />

      {/* Error State or Form Render */}
      {errorState ? (
        errorState
      ) : (
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-sm inv-form-container-card">
              <MedicineForm
                initialValues={medicine}
                onSubmit={handleSubmit}
                isEditMode={true}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditMedicine;
