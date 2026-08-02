import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBarcode } from 'react-icons/fa';

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

  // Prevent form submission on Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If we only have one result, select it automatically (great for barcode scanners)
      if (results.length === 1) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div className="card shadow-sm mb-4 position-relative" ref={dropdownRef}>
      <div className="card-body">
        <h5 className="card-title text-primary mb-3">Search Medicine</h5>
        <div className="input-group input-group-lg">
          <span className="input-group-text bg-white border-end-0">
            <FaSearch className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search by Name, Generic Name, or Scan Barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="input-group-text bg-light" title="Barcode Scanner Ready">
            <FaBarcode className="text-secondary" />
          </span>
        </div>

        {isSearching && (
          <div className="mt-2 text-muted small">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            Searching inventory...
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <div className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((med) => {
              const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
              const stock = med.quantity ?? med.currentStock ?? 0;
              const isLowStock = stock <= (med.minimumStock || 10);
              const displayName = med.medicineName || med.name;
              
              return (
                <button
                  key={med.id}
                  type="button"
                  className="list-group-item list-group-item-action"
                  onClick={() => handleSelect(med)}
                  disabled={isExpired}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1 fw-bold">{displayName}</h6>
                    <small className="fw-bold text-success">₹{med.sellingPrice}</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">{med.genericName} | Batch: {med.batchNumber || 'N/A'}</small>
                    <small>
                      Stock: <span className={`badge ${isLowStock ? 'bg-danger' : 'bg-primary'}`}>{stock}</span>
                    </small>
                  </div>
                  {isExpired && <small className="text-danger d-block mt-1 fw-bold">Medicine Expired!</small>}
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && !isSearching && results.length === 0 && searchTerm.length >= 2 && (
          <div className="list-group position-absolute w-100 shadow mt-1" style={{ zIndex: 1000 }}>
            <div className="list-group-item text-muted text-center py-3">
              No medicines found matching "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMedicine;
