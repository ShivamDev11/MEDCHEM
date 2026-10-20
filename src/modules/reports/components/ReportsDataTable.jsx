/**
 * @file        ReportsDataTable.jsx
 * @module      Reports
 * @purpose     Reusable data table with search, sorting, pagination, status badge rendering,
 *              row click interaction, and CSV export.
 */

import React, { useState, useMemo } from 'react';
import {
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { exportToCSV } from '../utils/csvExport';

const ReportsDataTable = ({
  data = [],
  columns = [],
  defaultSortKey = '',
  defaultSortDir = 'desc',
  pageSize = 10,
  searchPlaceholder = 'Search records...',
  onRowClick,
  exportFilename = 'report_data',
  emptyMessage = 'No records found matching current criteria.',
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey]       = useState(defaultSortKey || (columns[0]?.key || ''));
  const [sortDir, setSortDir]       = useState(defaultSortDir);
  const [currentPage, setCurrentPage] = useState(1);

  // ── 1. Search Filter ──────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, columns, searchTerm]);

  // ── 2. Sorting ────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle dates
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      // Handle numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      // Handle strings
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  // ── 3. Pagination ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pageIndex  = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  // ── Sorting Click Handler ─────────────────────────────────────────────────
  const handleSort = (colKey) => {
    if (sortKey === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(colKey);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  // ── Export CSV Handler ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!sortedData.length) return;
    const exportRows = sortedData.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        let val = row[col.key];
        if (val instanceof Date) {
          val = val.toLocaleDateString('en-IN');
        }
        obj[col.label || col.key] = val !== undefined && val !== null ? val : '';
      });
      return obj;
    });
    exportToCSV(exportFilename, exportRows);
  };

  return (
    <div className="w-100">
      {/* Search and Table Actions Toolbar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
          <span className="input-group-text bg-transparent border-end-0">
            <FiSearch size={13} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            style={{ fontSize: '0.8rem', borderRadius: '0 8px 8px 0' }}
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted" style={{ fontSize: '0.74rem' }}>
            {sortedData.length} records found
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            style={{ fontSize: '0.75rem', borderRadius: '7px' }}
            onClick={handleExportCSV}
            disabled={sortedData.length === 0}
            title="Export filtered records to CSV"
          >
            <FiDownload size={12} /> CSV
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive rp-drawer-table-wrap">
        <table className="rp-table mb-0">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={col.className || ''}
                    style={{
                      cursor: col.sortable !== false ? 'pointer' : 'default',
                      width: col.width,
                      textAlign: col.align || 'left',
                    }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className={`d-flex align-items-center gap-1 ${col.align === 'right' ? 'justify-content-end' : col.align === 'center' ? 'justify-content-center' : ''}`}>
                      <span>{col.label}</span>
                      {col.sortable !== false && isSorted && (
                        sortDir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((col, idx) => (
                    <td key={idx}>
                      <span className="placeholder rounded" style={{ height: '14px', width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => {
                    let cellVal = row[col.key];

                    // Render custom cell formatter if provided
                    if (col.render) {
                      return (
                        <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                          {col.render(cellVal, row)}
                        </td>
                      );
                    }

                    // Date formatting default
                    if (cellVal instanceof Date) {
                      cellVal = cellVal.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                    }

                    // Currency formatting
                    if (col.isCurrency) {
                      cellVal = '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(cellVal) || 0);
                    }

                    return (
                      <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                        {cellVal !== undefined && cellVal !== null ? cellVal : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedData.length > pageSize && (
        <div className="rp-drawer-pagination mt-2 rounded">
          <span>
            Page <strong>{pageIndex}</strong> of <strong>{totalPages}</strong> ({sortedData.length} items)
          </span>
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <FiChevronLeft size={13} />
            </button>
            <button
              type="button"
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <FiChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDataTable;
