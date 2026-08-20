import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaBarcode } from 'react-icons/fa';

const SearchMedicine = ({ onSearch, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        const res = await onSearch(searchTerm);
        setResults(res || []);
        setShowDropdown(true);
        setIsSearching(false);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const handleSelect = (medicine) => {
    onSelect(medicine);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length === 1) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div className="card shadow-sm mb-4 position-relative border-0 sales-search-wrapper" ref={dropdownRef}>
      <div className="card-body p-4">
        <h5 className="card-title text-dark fw-bold mb-3" style={{ fontSize: "1rem" }}>Medicine Search / Scanner</h5>
        <div className="input-group sales-search-input-group">
          <span className="input-group-text sales-search-addon border-0 pe-2">
            <FiSearch size={16} />
          </span>
          <input
            type="text"
            className="form-control sales-search-input"
            placeholder="Type medicine name or scan product barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="input-group-text border-0 bg-transparent text-muted" title="Barcode Scanner Ready" style={{ paddingRight: "1rem" }}>
            <FaBarcode size={16} className="text-secondary" />
          </span>
        </div>

        {isSearching && (
          <div className="mt-2 text-muted small d-flex align-items-center gap-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "12px", height: "12px" }} />
            <span>Scanning inventory...</span>
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <div className="list-group position-absolute w-100 sales-search-dropdown mt-1" style={{ left: 0, right: 0 }}>
            {results.map((med) => {
              const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
              const stock = med.quantity ?? med.currentStock ?? 0;
              const isLowStock = stock <= (med.minimumStock || 10);
              const displayName = med.medicineName || med.name;
              
              return (
                <button
                  key={med.id}
                  type="button"
                  className="list-group-item list-group-item-action sales-search-dropdown-item d-flex align-items-center justify-content-between py-3 px-4"
                  onClick={() => handleSelect(med)}
                  disabled={isExpired}
                >
                  <div className="flex-grow-1 me-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h6 className="mb-0 fw-bold text-dark">{displayName}</h6>
                      {isExpired && <span className="badge bg-danger text-white">Expired</span>}
                      {isLowStock && !isExpired && <span className="badge bg-warning text-dark">Low Stock</span>}
                    </div>
                    <div className="small text-muted">
                      {med.genericName || "No generic name"} | Batch: <span className="font-monospace fw-bold">{med.batchNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div className="fw-bold text-primary mb-1">₹{Number(med.sellingPrice).toFixed(2)}</div>
                    <div className="small text-secondary">
                      Stock: <strong className={isLowStock ? 'text-danger' : 'text-success'}>{stock}</strong> units
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && !isSearching && results.length === 0 && searchTerm.length >= 2 && (
          <div className="list-group position-absolute w-100 sales-search-dropdown mt-1" style={{ left: 0, right: 0 }}>
            <div className="list-group-item text-muted text-center py-4">
              No active medicines found matching "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMedicine;
