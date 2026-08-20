/**
 * @file        ExpiryFilters.jsx
 * @module      Expiry
 * @purpose     Controls for filtering and sorting the expiry table.
 *              Includes search input, field selector, sort dropdown, and filter tabs.
 * @dependencies react, react-icons, expiryConstants, expiry.css
 * @exports     ExpiryFilters (default)
 */

import { useCallback, useRef } from "react";
import { FiSearch, FiX, FiFilter, FiSliders } from "react-icons/fi";
import {
  EXPIRY_SEARCH_FIELDS,
  EXPIRY_SORT_OPTIONS,
  EXPIRY_FILTER_TABS,
} from "../constants/expiryConstants";

/**
 * ExpiryFilters
 */
function ExpiryFilters({
  searchTerm,
  onSearchTermChange,
  searchField,
  onSearchFieldChange,
  sortValue,
  onSortChange,
  filterTab,
  onFilterTabChange,
  resultCount,
  totalCount,
  disabled = false,
}) {
  const inputRef = useRef(null);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTermChange = useCallback(
    (e) => onSearchTermChange(e.target.value),
    [onSearchTermChange]
  );

  const handleFieldChange = useCallback(
    (e) => {
      onSearchFieldChange(e.target.value);
      onSearchTermChange(""); // Clear term when switching field
      inputRef.current?.focus();
    },
    [onSearchFieldChange, onSearchTermChange]
  );

  const handleSortChange = useCallback(
    (e) => onSortChange(e.target.value),
    [onSortChange]
  );

  const handleClearSearch = useCallback(() => {
    onSearchTermChange("");
    inputRef.current?.focus();
  }, [onSearchTermChange]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isFiltering = searchTerm.trim().length > 0;
  const currentFieldLabel =
    EXPIRY_SEARCH_FIELDS.find((f) => f.value === searchField)?.label ??
    "Medicine Name";

  return (
    <div className="exp-toolbar-card mb-3">
      {/* ── Toolbar Flex Container ── */}
      <div className="d-flex align-items-center gap-3 flex-wrap">
        
        {/* Filter Tabs */}
        <div className="exp-tab-group">
          {EXPIRY_FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`exp-tab-btn ${filterTab === tab.value ? "active" : ""}`}
              onClick={() => onFilterTabChange(tab.value)}
              disabled={disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vertical divider */}
        <div className="exp-divider d-none d-lg-block" aria-hidden="true" />

        {/* Field Selector */}
        <div style={{ minWidth: "150px" }}>
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiFilter size={13} />
            </span>
            <select
              className="form-select inv-select"
              value={searchField}
              onChange={handleFieldChange}
              disabled={disabled}
              aria-label="Select field to search by"
              style={{ cursor: "pointer" }}
            >
              {EXPIRY_SEARCH_FIELDS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ flex: "1 1 200px" }}>
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiSearch size={14} />
            </span>
            <input
              ref={inputRef}
              type="text"
              className="form-control inv-search-input"
              placeholder={`Search by ${currentFieldLabel}…`}
              value={searchTerm}
              onChange={handleTermChange}
              disabled={disabled}
              aria-label={`Search medicines by ${currentFieldLabel}`}
              autoComplete="off"
            />
            {isFiltering && (
              <button
                type="button"
                className="btn inv-btn-clear"
                onClick={handleClearSearch}
                disabled={disabled}
                title="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="exp-divider d-none d-md-block" aria-hidden="true" />

        {/* Sort Dropdown */}
        <div style={{ minWidth: "160px" }}>
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiSliders size={13} />
            </span>
            <select
              className="form-select inv-select"
              value={sortValue}
              onChange={handleSortChange}
              disabled={disabled}
              aria-label="Sort medicines"
              style={{ cursor: "pointer" }}
            >
              {EXPIRY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Result count summary ───────────────────────────────────────── */}
      {(isFiltering || filterTab !== "ALL") && (
        <div className="inv-search-result-summary mt-2" role="status">
          <span className="inv-result-pill">
            {resultCount === 0 ? (
              <>No results found.</>
            ) : (
              <>
                Showing <strong>{resultCount}</strong> of{" "}
                <strong>{totalCount}</strong> medicines
              </>
            )}
          </span>
          <button
            type="button"
            className="btn-link inv-clear-link ms-2"
            onClick={() => {
              onSearchTermChange("");
              onFilterTabChange("ALL");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default ExpiryFilters;
