/**
 * RankingTable.js
 *
 * Rankings tab — sortable, paginated table of Michigan water systems
 * organized into four view modes:
 *   - Most Lead Lines
 *   - Best Progress
 *   - Needs Attention (non-compliant only)
 *   - Most Unknown Lines
 *
 * Changes from original:
 *   - Added pagination (PAGE_SIZE rows per page)
 *   - Collapsed legend behind a toggle (same pattern as WaterSystemDirectory)
 *   - STATUS_CONFIG imported from shared constants to stay in sync with
 *     WaterSystemDirectory.js (see note below)
 *   - Added inventory_complete_flag awareness: incomplete inventory systems
 *     show a data caveat instead of a misleading 0% progress value
 *   - Mobile: horizontal scroll already handled by .table-container overflow-x
 *
 * NOTE on shared STATUS_CONFIG:
 *   Currently STATUS_CONFIG is duplicated here and in WaterSystemDirectory.js.
 *   When time allows, extract it to src/constants/statusConfig.js and import
 *   it in both components to keep colors in sync automatically.
 *
 * Data source: src/data/waterSystemsData.js
 */

import React, { useState, useMemo } from 'react';
import './RankingTable.css';
import waterSystemsData from '../data/waterSystemsData';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Number of rows shown per page. */
const PAGE_SIZE = 50;

/**
 * Status display config — colors and sort order.
 * NOTE: Keep these hex values in sync with WaterSystemDirectory.js
 * STATUS_CONFIG until a shared constants file is created.
 */
const STATUS_CONFIG = {
  'No lead lines':                        { color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe', order: 5 },
  'Not compliant':                        { color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', order: 3 },
  'Compliant':                            { color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0', order: 2 },
  'Inventory not received or incomplete': { color: '#7c3aed', bgColor: '#faf5ff', borderColor: '#e9d5ff', order: 4 },
  '100% replaced':                        { color: '#059669', bgColor: '#ecfdf5', borderColor: '#a7f3d0', order: 1 },
  'No service lines; wholesale only':     { color: '#6b7280', bgColor: '#f9fafb', borderColor: '#e5e7eb', order: 6 },
};

/**
 * Maps data status values to the display labels shown in the UI.
 * Keeps the data keys ('Compliant', 'Not compliant') separate from
 * what users see, matching the original dashboard wording.
 */
const STATUS_DISPLAY_LABEL = {
  'Not compliant':                        '<20% average replacement, 2021–2024',
  'Compliant':                            '≥20% average replacement, 2021–2024',
  '100% replaced':                        '100% replaced',
  'No lead lines':                        'No lead lines',
  'Inventory not received or incomplete': 'Inventory not received or incomplete',
  'No service lines; wholesale only':     'No service lines; wholesale only',
};

/** Returns the user-facing display label for a status value. */
const getStatusLabel = (status) => STATUS_DISPLAY_LABEL[status] || status;

/**
 * Legend items shown in the collapsible legend panel.
 * Order matches STATUS_CONFIG order field (most actionable first).
 */
const LEGEND_ITEMS = [
  { color: '#7c3aed', label: 'Inventory not received or incomplete', description: 'No complete inventory filed' },
  { color: '#dc2626', label: '<20% average replacement, 2021–2024',  description: 'Not meeting state replacement requirements' },
  { color: '#16a34a', label: '≥20% average replacement, 2021–2024',  description: 'Meeting state replacement requirements' },
  { color: '#059669', label: '100% replaced',                        description: 'All identified lead lines replaced' },
  { color: '#2563eb', label: 'No lead lines',                        description: 'Inventory completed, no lead lines identified' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Returns STATUS_CONFIG entry for a status, falling back to gray. */
const getStatusStyle = (status) =>
  STATUS_CONFIG[status] || { color: '#6b7280', bgColor: '#f9fafb', borderColor: '#e5e7eb' };

/**
 * Formats an exceedance year for display.
 * Raw data sometimes stores years as floats (e.g. 2022.0).
 */
const formatExceedance = (val) => {
  if (!val || val === '-' || val === '') return null;
  return String(val).replace('.0', '');
};

/**
 * Returns the rank label for a row.
 * Best Progress tab shows emoji medals for top 3; all others show numbers.
 */
const getRankLabel = (index, viewMode) => {
  if (viewMode === 'best-progress') {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
  }
  return index + 1;
};

/**
 * Returns true if a system's progress value should be treated as unreliable
 * due to an incomplete inventory. Used to show a caveat instead of 0%.
 */
const hasIncompleteInventory = (system) =>
  system.status === 'Inventory not received or incomplete';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Collapsible legend panel — same pattern as WaterSystemDirectory.
 * Collapsed by default to reduce visual clutter above the table.
 */
function Legend() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="table-legend">
      <button
        className="legend-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="legend-toggle-icon">{isOpen ? '▾' : '▸'}</span>
        Status legend
      </button>

      {isOpen && (
        <div className="legend-body">
          <div className="legend-grid">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: item.color }} />
                <div className="legend-text">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            ))}
            <div className="legend-item">
              <span className="exceedance-icon">⚠️</span>
              <div className="legend-text">
                <strong>Lead Action Level Exceedance</strong>
                <span>Exceeded Michigan lead action level (most recent year shown)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sortable column header — shows sort indicator when active.
 */
function SortableTh({ field, label, sortField, sortDirection, onSort, className }) {
  const isActive = sortField === field;
  return (
    <th className={`sortable ${className || ''}`} onClick={() => onSort(field)}>
      {label}
      {isActive
        ? <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
        : <span className="sort-indicator sort-indicator--inactive"> ↕</span>
      }
    </th>
  );
}

/**
 * Pagination controls — first, prev, numbered pills, next, last.
 * Same logic as WaterSystemDirectory buildPageItems.
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const visible = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2
  );

  const items = visible.reduce((acc, pageIndex, idx, arr) => {
    if (idx > 0 && pageIndex - arr[idx - 1] > 1) acc.push(`ellipsis-${pageIndex}`);
    acc.push(pageIndex);
    return acc;
  }, []);

  return (
    <div className="ranking-pagination">
      <button className="pag-btn" onClick={() => onPageChange(0)} disabled={currentPage === 0}>«</button>
      <button className="pag-btn" onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>‹ Prev</button>

      {items.map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="pag-ellipsis">…</span>
        ) : (
          <button
            key={item}
            className={`pag-btn pag-btn--num ${item === currentPage ? 'pag-btn--active' : ''}`}
            onClick={() => onPageChange(item)}
          >
            {item + 1}
          </button>
        )
      )}

      <button className="pag-btn" onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}>Next ›</button>
      <button className="pag-btn" onClick={() => onPageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * RankingTable
 *
 * Accepts an optional `data` prop for testing; defaults to waterSystemsData.
 *
 * State:
 *   viewMode      — which filter/sort preset is active
 *   sortField     — which column to sort by
 *   sortDirection — 'asc' or 'desc'
 *   currentPage   — zero-indexed current page
 */
function RankingTable({ data = waterSystemsData }) {
  const [viewMode,      setViewMode]      = useState('most-lead');
  const [sortField,     setSortField]     = useState('leadLines');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage,   setCurrentPage]   = useState(0);

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(0);
  };

  // Switch view mode and reset sort + page to the mode's defaults
  const handleViewMode = (mode, defaultField, defaultDirection) => {
    setViewMode(mode);
    setSortField(defaultField);
    setSortDirection(defaultDirection);
    setCurrentPage(0);
  };

  // ---------------------------------------------------------------------------
  // Filter + sort
  // ---------------------------------------------------------------------------

  const sortedData = useMemo(() => {
    let filtered;

    switch (viewMode) {
      case 'most-lead':
        filtered = data.filter((d) => d.leadLines > 0);
        break;
      case 'most-unknown':
        filtered = data.filter((d) => d.unknown > 0);
        break;
      case 'best-progress':
        // Only systems actively replacing lines — excludes no-lead, wholesale, incomplete
        filtered = data.filter((d) =>
          d.status === 'Compliant' ||
          d.status === '100% replaced' ||
          d.status === 'Not compliant'
        );
        break;
      case 'worst-progress':
        // Only non-compliant systems that need attention
        filtered = data.filter((d) => d.status === 'Not compliant');
        break;
      default:
        filtered = data.filter((d) => d.leadLines > 0);
    }

    // Best Progress default sort: 100% replaced first, then by % replaced desc,
    // then by totalReplaced as tie-breaker
    if (viewMode === 'best-progress' && sortField === 'percentReplaced' && sortDirection === 'desc') {
      return [...filtered].sort((a, b) => {
        if (a.status === '100% replaced' && b.status !== '100% replaced') return -1;
        if (b.status === '100% replaced' && a.status !== '100% replaced') return 1;
        if (a.status === '100% replaced' && b.status === '100% replaced') return b.totalReplaced - a.totalReplaced;
        if (a.percentReplaced !== b.percentReplaced) return b.percentReplaced - a.percentReplaced;
        return b.totalReplaced - a.totalReplaced;
      });
    }

    // Worst Progress default sort: lowest % replaced first, then biggest total to replace
    if (viewMode === 'worst-progress' && sortField === 'percentReplaced' && sortDirection === 'asc') {
      return [...filtered].sort((a, b) => {
        if (a.percentReplaced !== b.percentReplaced) return a.percentReplaced - b.percentReplaced;
        return b.totalToReplace - a.totalToReplace;
      });
    }

    // Standard column sort with totalReplaced as tie-breaker
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      const primary = sortDirection === 'asc'
        ? (aVal > bVal ? 1 : aVal < bVal ? -1 : 0)
        : (aVal < bVal ? 1 : aVal > bVal ? -1 : 0);

      return primary !== 0 ? primary : b.totalReplaced - a.totalReplaced;
    });
  }, [data, viewMode, sortField, sortDirection]);

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages - 1);
  const pageData   = sortedData.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Global index for rank display (accounts for current page offset)
  const globalIndex = (localIndex) => safePage * PAGE_SIZE + localIndex;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="ranking-container">

      {/* Page header */}
      <div className="ranking-header">
        <h2>System Rankings</h2>
        <p>Compare lead service line replacement progress across Michigan water systems</p>
      </div>

      {/* View mode buttons */}
      <div className="view-controls">
        <button
          className={`view-btn ${viewMode === 'most-lead' ? 'active' : ''}`}
          onClick={() => handleViewMode('most-lead', 'leadLines', 'desc')}
        >
          Most Lead Lines
        </button>
        <button
          className={`view-btn ${viewMode === 'best-progress' ? 'active' : ''}`}
          onClick={() => handleViewMode('best-progress', 'percentReplaced', 'desc')}
        >
          Best Progress
        </button>
        <button
          className={`view-btn ${viewMode === 'worst-progress' ? 'active' : ''}`}
          onClick={() => handleViewMode('worst-progress', 'percentReplaced', 'asc')}
        >
          Needs Attention
        </button>
        <button
          className={`view-btn ${viewMode === 'most-unknown' ? 'active' : ''}`}
          onClick={() => handleViewMode('most-unknown', 'unknown', 'desc')}
        >
          Most Unknown Lines
        </button>
      </div>

      {/* Collapsible legend */}
      <Legend />

      {/* Results count + page info */}
      <div className="ranking-meta">
        <span className="results-count">
          Showing <strong>{sortedData.length.toLocaleString()}</strong> systems
          {totalPages > 1 && ` — page ${safePage + 1} of ${totalPages}`}
        </span>
        <span className="filter-explanation">
          {viewMode === 'most-lead'      && 'Systems with identified lead service lines.'}
          {viewMode === 'most-unknown'   && 'Systems with service lines of unknown material still needing identification.'}
          {viewMode === 'best-progress'  && 'Systems actively replacing lead lines (≥20% replaced, <20% replaced, or 100% Replaced).'}
          {viewMode === 'worst-progress' && 'Non-compliant systems (<20% replacement), sorted by lowest progress first.'}
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <SortableTh field="name"           label="Water System"      sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTh field="population"     label="Population"        sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="leadLines"      label="Known Lead"        sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="gpcl"           label="GPCL"              sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="unknown"        label="Unknown"           sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="totalReplaced"  label="Replaced"          sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="totalToReplace" label="Total to ID/Replace" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <SortableTh field="percentReplaced" label="Progress"         sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="number-col" />
              <th className="status-col">Status</th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((system, localIndex) => {
              const statusStyle   = getStatusStyle(system.status);
              const exceedance    = formatExceedance(system.exceedance);
              const isTopThree    = globalIndex(localIndex) < 3 && viewMode === 'best-progress';
              const isIncomplete  = hasIncompleteInventory(system);

              return (
                <tr key={system.pwsid} className={isTopThree ? 'top-three' : ''}>

                  {/* Rank */}
                  <td className="rank-col">
                    <span className="rank-badge">
                      {getRankLabel(globalIndex(localIndex), viewMode)}
                    </span>
                  </td>

                  {/* System name + exceedance tag */}
                  <td className="system-name">
                    {system.name}
                    {exceedance && (
                      <span
                        className="exceedance-tag"
                        title={`Exceeded Michigan lead action level in ${exceedance}`}
                      >
                        ⚠️ {exceedance}
                      </span>
                    )}
                  </td>

                  <td className="number-col">{system.population.toLocaleString()}</td>
                  <td className="number-col lead-count">{system.leadLines.toLocaleString()}</td>
                  <td className="number-col gpcl-count">{system.gpcl.toLocaleString()}</td>
                  <td className="number-col unknown-count">{system.unknown.toLocaleString()}</td>
                  <td className="number-col">{system.totalReplaced.toLocaleString()}</td>
                  <td className="number-col">{system.totalToReplace.toLocaleString()}</td>

                  {/* Progress — show caveat for incomplete inventory */}
                  <td className="number-col">
                    {isIncomplete ? (
                      <span className="progress-incomplete" title="Inventory not complete — progress cannot be accurately calculated">
                        N/A
                      </span>
                    ) : (
                      <span
                        className="progress-badge"
                        style={{
                          color:           statusStyle.color,
                          backgroundColor: statusStyle.bgColor,
                          borderColor:     statusStyle.borderColor,
                        }}
                      >
                        {system.status === '100% replaced' ? '100.0' : system.percentReplaced.toFixed(1)}%
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="status-col">
                    <div className="status-cell">
                      <span className="status-dot" style={{ backgroundColor: statusStyle.color }} />
                      <span className="status-text">{getStatusLabel(system.status)}</span>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Footer */}
      <div className="table-footer">
        <p className="filter-explanation">
          If the water utility you are looking for is not listed here, look them up on
          the <strong>Search Systems</strong> page.
        </p>
      </div>

    </div>
  );
}

export default RankingTable;