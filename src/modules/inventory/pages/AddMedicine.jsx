/**
 * @file        AddMedicine.jsx
 * @module      Inventory
 * @purpose     Page component for adding a new medicine to the inventory.
 *              Wraps the reusable MedicineForm component and coordinates the
 *              creation service call. Integrates real-time toast notifications,
 *              duplicate checks, and redirects to the inventory list upon success.
 * @dependencies react, react-router-dom, react-toastify, inventoryService,
 *               inventoryConstants, InventoryHeader, MedicineForm, inventory.css
 * @exports     AddMedicine (default)
 */

import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { createMedicine } from "../services/inventoryService";
import { TOAST_MESSAGES, FORM_DEFAULT_VALUES } from "../constants/inventoryConstants";
import InventoryHeader from "../components/InventoryHeader";
import MedicineForm from "../components/MedicineForm";

import "../inventory.css";

function AddMedicine() {
  const navigate = useNavigate();

  // ── Breadcrumb Structure ───────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => [
    { label: "Inventory", path: "/inventory" },
    { label: "Add Medicine" }
  ], []);

  // ── Form Submission Handler ────────────────────────────────────────────────
  const handleSubmit = useCallback(async (formData) => {
    try {
      // Trigger create in service layer (passes current user or falls back to "system")
      await createMedicine(formData, "system");
      
      // Notify user
      toast.success(TOAST_MESSAGES.MEDICINE_ADDED);
      
      // Wait briefly for the toast to be readable before redirecting
      setTimeout(() => {
        navigate("/inventory");
      }, 1500);
    } catch (error) {
      console.error("[AddMedicine] Failed to add medicine:", error);
      
      if (error.code === "DUPLICATE") {
        toast.warning(TOAST_MESSAGES.DUPLICATE_FOUND);
      } else {
        toast.error(TOAST_MESSAGES.CREATE_ERROR);
      }
      
      // Re-throw error to notify the form component (resets the submit button state)
      throw error;
    }
  }, [navigate]);

  return (
    <div className="container-fluid py-4 inv-page-container">
      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Page Header */}
      <InventoryHeader
        title="Add New Medicine"
        subtitle="Insert detailed information to catalog a new pharmaceutical item."
        breadcrumbs={breadcrumbs}
      />

      {/* Form Container Wrapper */}
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card border-0 shadow-sm p-4 inv-form-container-card">
            <MedicineForm
              initialValues={FORM_DEFAULT_VALUES}
              onSubmit={handleSubmit}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddMedicine;
