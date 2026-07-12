/**
 * @file        SearchBar.jsx
 * @module      Inventory
 * @purpose     Fully controlled search and sort toolbar for the Inventory list.
 *              Renders a field-selector dropdown, a text input with clear button,
 *              and a sort dropdown. All state lives in the parent (Inventory.jsx) —
 *              this component only fires callbacks.
 *              Client-side search strategy: parent calls searchMedicines() on
 *              every term change. Firestore is NOT queried on each keystroke.
 * @dependencies react, react-icons, inventoryConstants, inventory.css
 * @exports     SearchBar (default)
 */

import { useCallback, useRef } from "react";
import { FiSearch, FiX, FiFilter, FiSliders } from "react-icons/fi";
import {
  SEARCH_FIELDS,
  SORT_OPTIONS,
} from "../constants/inventoryConstants";

/**
 * SearchBar
 *
 * @param {object}   props
 * @param {string}   props.searchTerm           - Current search input value (controlled)
 * @param {Function} props.onSearchTermChange   - Called with new string on every keystroke
 * @param {string}   props.searchField          - Currently selected field key (controlled)
 * @param {Function} props.onSearchFieldChange  - Called with new field key on dropdown change
 * @param {string}   props.sortValue            - Current sort option value (controlled)
 * @param {Function} props.onSortChange         - Called with new SORT_OPTIONS value on change
 * @param {number}   [props.resultCount]        - Filtered result count (for summary text)
 * @param {number}   [props.totalCount]         - Total unfiltered count (for summary text)
 * @param {boolean}  [props.disabled]           - Disables all controls (e.g. during load)
 */
function SearchBar({
  searchTerm,
  onSearchTermChange,
  searchField,
  onSearchFieldChange,
  sortValue,
  onSortChange,
  resultCount,
  totalCount,
  disabled = false,
}) {
  const inputRef = useRef(null);

  // ── Handlers (stable references via useCallback) ───────────────────────────

  /**
   * Fires on every keystroke in the search input.
   * Parent runs searchMedicines() against the in-memory medicine array.
   */
  const handleTermChange = useCallback(
    (e) => {
      onSearchTermChange(e.target.value);
    },
    [onSearchTermChange]
  );

  /**
   * Updates the active search field. Clears the current term so stale
   * results from the previous field don't persist.
   */
  const handleFieldChange = useCallback(
    (e) => {
      onSearchFieldChange(e.target.value);
      // Clear term when switching field — prevents cross-field confusion
      onSearchTermChange("");
      inputRef.current?.focus();
    },
    [onSearchFieldChange, onSearchTermChange]
  );

  /**
   * Updates the active sort option. Parent re-fetches from Firestore
   * with the new orderBy field + direction.
   */
  const handleSortChange = useCallback(
    (e) => {
      onSortChange(e.target.value);
    },
    [onSortChange]
  );

  /**
   * Clears the search term and refocuses the input.
   */
  const handleClear = useCallback(() => {
    onSearchTermChange("");
    inputRef.current?.focus();
  }, [onSearchTermChange]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isFiltering     = searchTerm.trim().length > 0;
  const showResultCount = isFiltering &&
                          resultCount !== undefined &&
                          totalCount  !== undefined;

  const currentFieldLabel =
    SEARCH_FIELDS.find((f) => f.value === searchField)?.label ?? "Medicine Name";

  return (
    <div className="inv-search-bar-wrapper mb-3">
      {/* ── Top row: Field selector + Search input + Sort ────────────────── */}
      <div className="row g-2 align-items-center">

        {/* Field Selector Dropdown */}
        <div className="col-12 col-sm-4 col-md-3 col-lg-2">
          <div className="input-group inv-input-group">
            <span className="input-group-text inv-input-addon" aria-hidden="true">
              <FiFilter size={14} />
            </span>
            <select
              id="inv-search-field-select"
              className="form-select inv-select"
              value={searchField}
              onChange={handleFieldChange}
              disabled={disabled}
              aria-label="Select field to search by"
              title="Select search field"
            >
              {SEARCH_FIELDS.map((field) => (
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
            <span className="input-group-text inv-input-addon" aria-hidden="true">
              <FiSearch size={15} />
            </span>
            <input
              ref={inputRef}
              id="inv-search-input"
              type="text"
              className="form-control inv-search-input"
              placeholder={`Search by ${currentFieldLabel}…`}
              value={searchTerm}
              onChange={handleTermChange}
              disabled={disabled}
              aria-label={`Search medicines by ${currentFieldLabel}`}
              autoComplete="off"
              spellCheck="false"
            />
            {/* Clear button — only visible when there is text */}
            {isFiltering && (
              <button
                type="button"
                id="inv-search-clear-btn"
                className="btn inv-btn-clear"
                onClick={handleClear}
                disabled={disabled}
                aria-label="Clear search"
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
            <span className="input-group-text inv-input-addon" aria-hidden="true">
              <FiSliders size={14} />
            </span>
            <select
              id="inv-sort-select"
              className="form-select inv-select"
              value={sortValue}
              onChange={handleSortChange}
              disabled={disabled}
              aria-label="Sort medicines"
              title="Sort order"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Result count summary ─────────────────────────────── */}
      {showResultCount && (
        <div
          className="inv-search-result-summary mt-2"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="inv-result-pill">
            {resultCount === 0 ? (
              <>No results for &ldquo;<strong>{searchTerm}</strong>&rdquo;</>
            ) : (
              <>
                Showing <strong>{resultCount}</strong> of{" "}
                <strong>{totalCount}</strong> medicines
                {" "}matching &ldquo;<strong>{searchTerm}</strong>&rdquo;
              </>
            )}
          </span>

          {/* Quick-clear link */}
          <button
            type="button"
            className="btn-link inv-clear-link ms-2"
            onClick={handleClear}
            aria-label="Clear search and show all results"
          >
            Show all
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
