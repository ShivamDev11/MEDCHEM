/**
 * @file        Expiry.jsx
 * @module      Expiry
 * @purpose     Main orchestrator page for Expiry Management module.
 *              Fetches expiry data, applies client-side filtering/sorting,
 *              and renders Stats, Filters, and Table components.
 *              Triggers notification generation on demand.
 * @dependencies react, react-router-dom, react-toastify, expiryService,
 *               notificationService, InventoryHeader, ExpiryCards,
 *               ExpiryFilters, ExpiryTable
 * @exports     Expiry (default)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

import { getAllExpiredAndExpiring } from "../services/expiryService";
import { EXPIRY_TOAST_MESSAGES } from "../constants/expiryConstants";
import { playError } from "../../../shared/services/audioService";

import InventoryHeader from "../../inventory/components/InventoryHeader";
import ExpiryCards from "../components/ExpiryCards";
import ExpiryFilters from "../components/ExpiryFilters";
import ExpiryTable from "../components/ExpiryTable";

import "../expiry.css";

function Expiry() {
  const navigate = useNavigate();

  // ── States ─────────────────────────────────────────────────────────────────
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filter/Sort States
  const [filterTab, setFilterTab]     = useState("ALL");
  const [searchField, setSearchField] = useState("medicineName");
  const [searchTerm, setSearchTerm]   = useState("");
  const [sortValue, setSortValue]     = useState("nearest");

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllExpiredAndExpiring();
      setMedicines(data);
    } catch (err) {
      console.error("[Expiry] Failed to fetch medicines:", err);
      playError();
      setError(EXPIRY_TOAST_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleViewDetails = useCallback(
    (id) => {
      navigate(`/inventory/details/${id}`);
    },
    [navigate]
  );

  // ── Client-Side Filtering & Sorting ────────────────────────────────────────
  const filteredMedicines = useMemo(() => {
    let result = [...medicines];

    // 1. Apply Filter Tab
    if (filterTab !== "ALL") {
      if (filterTab === "EXPIRED") {
        result = result.filter((m) => m.daysRemaining < 0);
      } else {
        const daysLimit = parseInt(filterTab, 10);
        result = result.filter(
          (m) => m.daysRemaining >= 0 && m.daysRemaining <= daysLimit
        );
      }
    }

    // 2. Apply Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((m) => {
        const val = m[searchField];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(term);
      });
    }

    // 3. Apply Sort
    result.sort((a, b) => {
      const valA = a.daysRemaining;
      const valB = b.daysRemaining;
      return sortValue === "nearest" ? valA - valB : valB - valA;
    });

    return result;
  }, [medicines, filterTab, searchField, searchTerm, sortValue]);

  // ── Breadcrumb Structure ───────────────────────────────────────────────────
  const breadcrumbs = useMemo(() => [{ label: "Expiry Tracker" }], []);

  return (
    <div className="container-fluid py-4 exp-page-animate">
      
      {/* Page Header */}
      <InventoryHeader
        title="Expiry Management"
        subtitle="Track expiring medications, configure threshold warnings, and manage warehouse stock alerts."
        breadcrumbs={breadcrumbs}
      />

      {/* Error Panel */}
      {error && (
        <div className="alert inv-alert-error d-flex align-items-center mb-4">
          <FiAlertTriangle size={20} className="text-danger me-3" />
          <div>
            <h5 className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Error</h5>
            <p className="mb-0 small text-secondary">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <ExpiryCards medicines={medicines} loading={loading} />

      {/* Controls */}
      {medicines.length > 0 && (
        <ExpiryFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
          sortValue={sortValue}
          onSortChange={setSortValue}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
          resultCount={filteredMedicines.length}
          totalCount={medicines.length}
          disabled={loading}
        />
      )}

      {/* Table */}
      <ExpiryTable
        medicines={filteredMedicines}
        onViewDetails={handleViewDetails}
        loading={loading}
      />
    </div>
  );
}

export default Expiry;
