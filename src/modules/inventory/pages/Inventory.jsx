/**
 * @file        Inventory.jsx
 * @module      Inventory
 * @purpose     Main list page for the Inventory module.
 *              Displays page headers, 5 stat cards, controlled search & sort toolbars,
 *              a responsive table of active medicines, and pagination controls.
 *              Integrates the service layer and manages loading, error, empty, and success states.
 * @dependencies react, react-router-dom, react-toastify, inventoryService, 
 *               inventoryConstants, InventoryHeader, InventoryStats, SearchBar, 
 *               MedicineTable, showDeleteConfirmation, showDeleteSuccess, inventory.css
 * @exports     Inventory (default)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { FiRefreshCw, FiAlertCircle, FiPlus } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

import { 
  getMedicines, 
  softDeleteMedicine, 
  searchMedicines 
} from "../services/inventoryService";
import { 
  TOAST_MESSAGES, 
  SORT_OPTIONS, 
  SEARCH_FIELDS 
} from "../constants/inventoryConstants";

import InventoryHeader from "../components/InventoryHeader";
import InventoryStats from "../components/InventoryStats";
import SearchBar from "../components/SearchBar";
import MedicineTable from "../components/MedicineTable";
import { showDeleteConfirmation, showDeleteSuccess } from "../components/DeleteModal";

import "../inventory.css";

function Inventory() {
  const navigate = useNavigate();

  // ── States ─────────────────────────────────────────────────────────────────
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Sort states
  const [sortValue, setSortValue] = useState("newest"); // Matches SORT_OPTIONS value
  
  // Search states
  const [searchField, setSearchField] = useState("medicineName");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  
  // Stack of cursors to support backward pagination
  // cursors[0] represents the starting cursor (null)
  const [cursors, setCursors] = useState([null]);
  
  // Key to force reload statistics when a CRUD action happens
  const [statsKey, setStatsKey] = useState(0);

  // ── Memoized Sort Parameters ───────────────────────────────────────────────
  const activeSort = useMemo(() => {
    const option = SORT_OPTIONS.find((o) => o.value === sortValue);
    return option || SORT_OPTIONS[0]; // Fallback to newest first
  }, [sortValue]);

  // ── Fetch Page Data ────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (cursor = null, direction = "next") => {
    setLoading(true);
    setError(null);
    try {
      const { field, direction: dir } = activeSort;
      const result = await getMedicines(field, dir, cursor);
      
      setMedicines(result.medicines);
      setHasMore(result.hasMore);
      setLastVisibleDoc(result.lastVisible);

      // Manage cursor stacks based on navigation direction
      if (direction === "next" && result.lastVisible) {
        setCursors((prev) => {
          // Only push if cursor does not already exist at the next page slot
          if (prev.length <= currentPage) {
            return [...prev, result.lastVisible];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("[Inventory] Failed to fetch medicines:", err);
      setError(TOAST_MESSAGES.LOAD_ERROR);
      toast.error(TOAST_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [activeSort, currentPage]);

  // ── Reload/Reset List ──────────────────────────────────────────────────────
  const handleReload = useCallback(() => {
    setCurrentPage(1);
    setCursors([null]);
    fetchPage(null, "next");
    setStatsKey((prev) => prev + 1); // Refresh stat aggregates
  }, [fetchPage]);

  // Trigger load when active sort parameters change
  useEffect(() => {
    handleReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortValue]);

  // ── Navigation callbacks ───────────────────────────────────────────────────
  const handleNextPage = useCallback(() => {
    if (!hasMore || loading) return;
    const nextCursor = cursors[currentPage];
    setCurrentPage((prev) => prev + 1);
    fetchPage(nextCursor, "next");
  }, [hasMore, loading, currentPage, cursors, fetchPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage === 1 || loading) return;
    const prevCursor = cursors[currentPage - 2];
    setCurrentPage((prev) => prev - 1);
    fetchPage(prevCursor, "prev");
  }, [currentPage, loading, cursors, fetchPage]);

  // ── Search & Filter ────────────────────────────────────────────────────────
  // Client-side search filters the active page's elements
  const filteredMedicines = useMemo(() => {
    return searchMedicines(medicines, searchField, searchTerm);
  }, [medicines, searchField, searchTerm]);

  // ── Sort Column Header Toggle Callback ─────────────────────────────────────
  const handleHeaderSortChange = useCallback((columnKey, newDirection) => {
    // Find matching sort option based on database field and direction
    const matchedOption = SORT_OPTIONS.find(
      (o) => o.field === columnKey && o.direction === newDirection
    );
    if (matchedOption) {
      setSortValue(matchedOption.value);
    }
  }, []);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleViewDetails = useCallback((id) => {
    navigate(`/inventory/details/${id}`);
  }, [navigate]);

  const handleEdit = useCallback((id) => {
    navigate(`/inventory/edit/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id) => {
    const target = medicines.find((m) => m.id === id);
    if (!target) return;

    try {
      // 1. Confirm deletion with SweetAlert2
      const confirmed = await showDeleteConfirmation(target.medicineName, target.batchNumber);
      if (!confirmed) return;

      setLoading(true);
      // 2. Trigger soft delete in Firestore
      await softDeleteMedicine(id, "system"); // Fallback UID
      
      // 3. Show Toast Notification & SweetAlert success popup
      toast.success(TOAST_MESSAGES.MEDICINE_DELETED);
      showDeleteSuccess(target.medicineName);

      // 4. Reload page contents and stat panels
      handleReload();
    } catch (err) {
      console.error("[Inventory] Deletion failed:", err);
      toast.error(TOAST_MESSAGES.DELETE_ERROR);
      setLoading(false);
    }
  }, [medicines, handleReload]);

  // ── Breadcrumb Structure ───────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => [{ label: "Inventory" }], []);

  // ── Render States ──────────────────────────────────────────────────────────
  
  // Render: Error Alert Panel
  const errorPanel = error && (
    <div className="alert inv-alert-error d-flex align-items-center justify-content-between p-4 mb-4 shadow-sm" role="alert">
      <div className="d-flex align-items-center gap-2">
        <FiAlertCircle size={24} className="text-danger flex-shrink-0" />
        <div>
          <h5 className="alert-heading fw-bold mb-1">Failed to Load Inventory</h5>
          <p className="mb-0 small">{error}</p>
        </div>
      </div>
      <button 
        type="button" 
        className="btn btn-outline-danger d-flex align-items-center gap-1"
        onClick={handleReload}
      >
        <FiRefreshCw size={14} />
        Retry
      </button>
    </div>
  );

  // Render: Main Body (Table/Empty View)
  const bodyContent = useMemo(() => {
    if (loading && medicines.length === 0) {
      return (
        <div className="inv-spinner-wrap text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Inventory...</span>
          </div>
          <p className="text-muted mt-2 small">Loading inventory list...</p>
        </div>
      );
    }

    if (!loading && medicines.length === 0) {
      return (
        <div className="inv-empty-state text-center p-5 card border-0 shadow-sm">
          <div className="py-4">
            <FiAlertCircle size={48} className="text-muted mb-3" />
            <h4 className="fw-bold text-dark">No Medicine Records</h4>
            <p className="text-muted mb-4 max-w-md mx-auto">
              Your pharmacy database does not contain any medicines yet, or they have all been deleted. Add a new medicine record to get started.
            </p>
            <button
              type="button"
              className="btn inv-btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => navigate("/inventory/add")}
            >
              <FiPlus size={18} />
              Add First Medicine
            </button>
          </div>
        </div>
      );
    }

    return (
      <MedicineTable
        medicines={filteredMedicines}
        sortField={activeSort.field}
        sortDir={activeSort.direction}
        onSortChange={handleHeaderSortChange}
        currentPage={currentPage}
        hasMore={hasMore}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />
    );
  }, [
    loading, 
    medicines, 
    filteredMedicines, 
    activeSort, 
    currentPage, 
    hasMore, 
    handleHeaderSortChange, 
    handlePrevPage, 
    handleNextPage, 
    handleViewDetails, 
    handleEdit, 
    handleDelete,
    navigate
  ]);

  return (
    <div className="container-fluid py-4 inv-page-container">
      {/* Toast Notification Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Page Header */}
      <InventoryHeader
        title="Inventory Management"
        subtitle="Track stock, purchase values, batch details, and check expiries."
        breadcrumbs={breadcrumbs}
        actionButton={{
          label: "Add Medicine",
          path: "/inventory/add",
          disabled: loading
        }}
      />

      {/* Aggregate Statistics panel (Refreshed on state changes using statsKey) */}
      <InventoryStats key={statsKey} />

      {/* Controlled Search & Sorting Toolbar */}
      {medicines.length > 0 && (
        <SearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          sortValue={sortValue}
          onSortChange={setSortValue}
          resultCount={filteredMedicines.length}
          totalCount={medicines.length}
          disabled={loading}
        />
      )}

      {/* Error messages if any */}
      {errorPanel}

      {/* Primary List View */}
      {bodyContent}
    </div>
  );
}

export default Inventory;
