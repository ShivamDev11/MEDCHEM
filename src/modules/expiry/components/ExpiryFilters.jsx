/**
 * @file        ExpiryFilters.jsx
 * @module      Expiry
 * @purpose     Controls for filtering and sorting the expiry table.
 *              Includes search input, field selector, sort dropdown, and filter tabs.
 * @dependencies react, react-icons, expiryConstants, inventory.css
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
 *
 * @param {object}   props
 * @param {string}   props.searchTerm           - Current search input value
 * @param {Function} props.onSearchTermChange   - Called with new string on every keystroke
 * @param {string}   props.searchField          - Currently selected field key
 * @param {Function} props.onSearchFieldChange  - Called with new field key
 * @param {string}   props.sortValue            - Current sort option value
 * @param {Function} props.onSortChange         - Called with new sort option
 * @param {string}   props.filterTab            - Current filter tab value
 * @param {Function} props.onFilterTabChange    - Called with new filter tab value
 * @param {number}   props.resultCount          - Filtered result count
 * @param {number}   props.totalCount           - Total unfiltered count
 * @param {boolean}  props.disabled             - Disables all controls
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
    <div className="inv-search-bar-wrapper mb-3">
      {/* ── Top row: Filter Tabs ─────────────────────────────────────────── */}
      <div className="mb-3 d-flex flex-wrap gap-2">
        {EXPIRY_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`btn btn-sm ${
              filterTab === tab.value ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => onFilterTabChange(tab.value)}
            disabled={disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Middle row: Field selector + Search input + Sort ─────────────── */}
      <div className="row g-2 align-items-center">
        {/* Field Selector */}
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiFilter size={14} />
            </span>
            <select
              className="form-select inv-select"
              value={searchField}
              onChange={handleFieldChange}
              disabled={disabled}
              aria-label="Select field to search by"
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
        <div className="col-12 col-sm-8 col-md-6 col-lg-7">
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiSearch size={15} />
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
                <FiX size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="col-12 col-sm-12 col-md-3 col-lg-3">
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon">
              <FiSliders size={14} />
            </span>
            <select
              className="form-select inv-select"
              value={sortValue}
              onChange={handleSortChange}
              disabled={disabled}
              aria-label="Sort medicines"
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

      {/* ── Bottom row: Result count summary ─────────────────────────────── */}
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
