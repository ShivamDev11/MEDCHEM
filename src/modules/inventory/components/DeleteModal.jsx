/**
 * @file        DeleteModal.jsx
 * @module      Inventory
 * @purpose     Provides a SweetAlert2-based delete confirmation dialog.
 *              Triggers a beautifully styled, accessible modal popup for soft-deleting
 *              medicines, leveraging Bootstrap 5 buttons for UI consistency.
 *              Guards against accidental deletion by showing specific item details.
 * @dependencies sweetalert2, inventoryConstants, inventory.css
 * @exports     showDeleteConfirmation
 */

import Swal from "sweetalert2";
import { TOAST_MESSAGES } from "../constants/inventoryConstants";

/**
 * Renders a SweetAlert2 confirmation dialog for soft-deleting a medicine.
 * Customizes the dialog to match MedChem's design aesthetics using Bootstrap 5 classes.
 * 
 * @param {string} medicineName - Name of the medicine to be deleted
 * @param {string} batchNumber  - Batch number of the medicine to be deleted
 * @returns {Promise<boolean>}  - Resolves to true if confirmed, false if cancelled/closed
 */
export const showDeleteConfirmation = async (medicineName, batchNumber) => {
  const result = await Swal.fire({
    title: "Delete Medicine?",
    html: `
      <div class="inv-delete-modal-content">
        <p class="mb-3 text-secondary">
          Are you sure you want to delete <strong>${medicineName}</strong>?
        </p>
        <div class="p-2 bg-light rounded text-start font-monospace small mb-3 border">
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted">Batch No:</span>
            <span class="text-dark fw-bold">${batchNumber}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="text-muted">Action:</span>
            <span class="text-danger fw-bold">Soft Delete (Audit Preserved)</span>
          </div>
        </div>
        <p class="text-muted mb-0 small">
          This record will be hidden from active inventory lists but preserved in audit logs.
        </p>
      </div>
    `,
    icon: "warning",
    iconColor: "#dc3545", // Bootstrap danger red
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "inv-swal-popup border-0 shadow rounded-3",
      title: "inv-swal-title fw-bold text-dark pt-4",
      htmlContainer: "inv-swal-html py-2",
      confirmButton: "btn btn-danger px-4 py-2 fw-semibold",
      cancelButton: "btn btn-outline-secondary px-4 py-2 fw-semibold me-2",
      actions: "inv-swal-actions pb-4 pt-2 d-flex flex-row-reverse gap-2 justify-content-center"
    },
    buttonsStyling: false, // Turn off SweetAlert2 default button styles to use Bootstrap classes
    reverseButtons: false, // Keeps cancel on left and confirm on right
    focusCancel: true, // Focus cancel button by default for safety
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading()
  });

  return result.isConfirmed;
};

/**
 * Triggers a success dialog after deletion has completed.
 * 
 * @param {string} medicineName - Name of the deleted medicine
 */
export const showDeleteSuccess = (medicineName) => {
  Swal.fire({
    title: "Deleted!",
    text: `${medicineName} ${TOAST_MESSAGES.MEDICINE_DELETED}`,
    icon: "success",
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: {
      popup: "inv-swal-popup border-0 shadow rounded-3",
      title: "inv-swal-title fw-bold text-success pt-4"
    }
  });
};
