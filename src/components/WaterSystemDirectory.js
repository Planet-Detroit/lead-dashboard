/**
 * WaterSystemDirectory.js
 *
 * Searchable, filterable, paginated table of Michigan water systems showing
 * lead service line replacement status. Replaces the original card-grid layout
 * with a table that is faster to scan and lighter on the DOM.
 *
 * Key features:
 *  - Search by system name or PWSID
 *  - Filter by compliance status, LCR exceedance, or missing map location
 *  - Sort by any column (click column header)
 *  - Click any row to expand and see full details + yearly sparkline
 *  - Paginated (25 / 50 / 100 rows per page)
 *  - Color-coded rows match the original card header colors
 *
 * Data source: src/data/waterSystemsData.js
 * Each system object is expected to have the fields documented in
 * src/data/waterSystemsData.js (pwsid, name, population, status,
 * leadLines, gpcl, unknown, totalToReplace, totalReplaced,
 * percentReplaced, y2021–y2024, exceedance, latitude, longitude, epaLink).
 *
 * To add a new year of data (e.g. y2025):
 *  1. Add the field to waterSystemsData.js
 *  2. Update SparkBars to include the new year
 *  3. Update the hasYearlyData check in ExpandedDetail
 */

import React, { useState, useMemo, useCallback } from 'react';
import './WaterSystemDirectory.css';
import waterSystemsData from '../data/waterSystemsData';

// =============================================================================
// CONFIGURATION — edit these objects to change status labels, colors, or legend
// =============================================================================

/**
 * Maps each status string to its CSS badge class.
 * Badge colors are defined entirely in WaterSystemDirectory.css.
 * If EGLE adds a new status category, add an entry here and a matching
 * .badge-* rule in the CSS.
 */
const STATUS_CONFIG = {
  'No lead lines':                        { badgeClass: 'badge-nolead' },
  'Not compliant':                        { badgeClass: 'badge-noncompliant' },
  'Compliant':                            { badgeClass: 'badge-compliant' },
  'Inventory not received or incomplete': { badgeClass: 'badge-incomplete' },
  '100% replaced':                        { badgeClass: 'badge-complete' },
  'No service lines; wholesale only':     { badgeClass: 'badge-wholesale' },
  'Unknown':                              { badgeClass: 'badge-unknown' },
};

/**
 * Maps each status string to its table-row CSS modifier class.
 * Controls the background tint and left border accent on each row.
 * Defined in WaterSystemDirectory.css under "Row status colors".
 */
/**
 * Maps data status values to the display labels shown in the UI.
 * The data uses short keys like 'Compliant'/'Not compliant' internally;
 * these labels match the original dashboard wording shown to users.
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

const STATUS_ROW_CLASS = {
  'Not compliant':                        'dir-row--noncompliant',
  'Compliant':                            'dir-row--compliant',
  '100% replaced':                        'dir-row--complete',
  'No lead lines':                        'dir-row--nolead',
  'Inventory not received or incomplete': 'dir-row--incomplete',
  'No service lines; wholesale only':     'dir-row--wholesale',
};

/**
 * Items shown in the collapsible status legend.
 * colorStyle is used for the small swatch square next to each label.
 */
const LEGEND_ITEMS = [
  {
    badgeClass:  'badge-incomplete',
    label:       'Inventory not received or incomplete',
    description: 'No complete inventory filed with EGLE',
    colorStyle:  { background: '#7c3aed' },
  },
  {
    badgeClass:  'badge-noncompliant',
    label:       '<20% average replacement, 2021–2024',
    description: 'Not meeting state replacement requirements',
    colorStyle:  { background: '#dc2626' },
  },
  {
    badgeClass:  'badge-compliant',
    label:       '≥20% average replacement, 2021–2024',
    description: 'Meeting state replacement requirements',
    colorStyle:  { background: '#16a34a' },
  },
  {
    badgeClass:  'badge-complete',
    label:       '100% replaced',
    description: 'All identified lead lines replaced',
    colorStyle:  { background: '#059669' },
  },
  {
    badgeClass:  'badge-nolead',
    label:       'No lead lines',
    description: 'Inventory completed, no lead lines identified',
    colorStyle:  { background: '#2563eb' },
  },
  {
    badgeClass:  'badge-wholesale',
    label:       'No service lines; wholesale only',
    description: 'Wholesale water provider with no service lines',
    colorStyle:  { background: '#6b7280' },
  },
];

/** How many rows per page are offered to the user. */
const PAGE_SIZE_OPTIONS = [25, 50, 100];

/**
 * Michigan's regulatory compliance threshold for lead service line replacement.
 * Used by the progress bar tick mark and the narrative sentences.
 * Update this value if the regulatory threshold changes.
 */
const COMPLIANCE_THRESHOLD = 20;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Returns the STATUS_CONFIG entry for a status, falling back to 'Unknown'. */
const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG['Unknown'];

/** Returns the row CSS modifier class for a given status string. */
const getRowClass = (status) => STATUS_ROW_CLASS[status] || '';



/**
 * Returns true if the system has a recorded lead action level exceedance.
 * Raw data uses empty string or '-' to mean no exceedance.
 */
const hasExceedance = (system) =>
  system.exceedance &&
  system.exceedance !== '' &&
  system.exceedance !== '-';

/** Returns true if the system is missing map coordinates. */
const hasNoLocation = (system) =>
  !system.latitude || !system.longitude;

/**
 * Returns true if the system should show lead line counts and a progress bar.
 * Systems with no lead lines, 100% replaced, or wholesale-only skip these
 * fields because they are not meaningful in those contexts.
 */
const shouldShowLeadDetails = (system) =>
  system.status !== 'No lead lines' &&
  system.status !== '100% replaced' &&
  system.status !== 'No service lines; wholesale only';

/**
 * Formats an exceedance year for display.
 * Raw data sometimes stores years as floats (e.g. 2022.0) — strips the decimal.
 */
const formatExceedance = (val) => String(val).replace('.0', '');

/**
 * Returns true if this system is the City of Flint.
 * Flint receives a special data caveat note because pre-2021 replacements
 * are excluded from the dataset for historical reasons.
 */
const isFlintSystem = (system) => {
  const nameUpper = system.name.toUpperCase();
  return (
    nameUpper.includes('FLINT, CITY OF') ||
    nameUpper.includes('CITY OF FLINT') ||
    nameUpper === 'FLINT' ||
    system.pwsid === 'MI0002520'
  );
};

/**
 * Returns the CSS color modifier for a progress bar fill based on percent replaced.
 *   >= COMPLIANCE_THRESHOLD  -> 'good' (green)
 *   >= 10%                   -> 'mid'  (orange)
 *   <  10%                   -> 'low'  (red)
 */
const getProgressColorClass = (pct) => {
  if (pct >= COMPLIANCE_THRESHOLD) return 'good';
  if (pct >= 10) return 'mid';
  return 'low';
};

// =============================================================================
// NARRATIVE BUILDER
// =============================================================================

/**
 * Builds a plain-English one-sentence summary of a water system's status.
 * Displayed at the top of the expanded detail panel.
 *
 * Returns { text: string, tone: 'good' | 'bad' | 'warn' | 'neutral' }
 * The tone controls the background color of the narrative block.
 *
 * @param {Object} system - A water system object from waterSystemsData.js
 * @returns {{ text: string, tone: string }}
 */
function buildNarrative(system) {
  // Title-case the name for readable display (raw data is ALL CAPS)
  const name = system.name.charAt(0).toUpperCase() + system.name.slice(1).toLowerCase();
  const pop  = system.population.toLocaleString();
  const pct  = system.percentReplaced.toFixed(1);

  // Append exceedance year as a short factual note when present
  const excYear   = hasExceedance(system) ? formatExceedance(system.exceedance) : null;
  const excSuffix = excYear ? ` Most recent lead action level exceedance: ${excYear}.` : '';

  switch (system.status) {
    case 'No lead lines':
      return {
        text: `${name} serves ${pop} residents and has completed its service line inventory — no lead lines were identified.`,
        tone: 'good',
      };
    case '100% replaced':
      return {
        text: `${name} serves ${pop} residents and has replaced all identified lead service lines.`,
        tone: 'good',
      };
    case 'No service lines; wholesale only':
      return {
        text: `${name} is a wholesale-only water provider serving ${pop} residents and has no direct service lines.`,
        tone: 'neutral',
      };
    case 'Inventory not received or incomplete':
      return {
        text: `${name} serves ${pop} residents but has not filed a complete service line inventory with EGLE. The full scope of lead lines is unknown.`,
        tone: 'warn',
      };
    case 'Compliant':
      return {
        text: `${name} serves ${pop} residents and has replaced ${pct}% of its service lines, meeting the ≥${COMPLIANCE_THRESHOLD}% replacement requirement.${excSuffix}`,
        tone: 'good',
      };
    case 'Not compliant':
      return {
        text: `${name} serves ${pop} residents and has replaced ${pct}% of its service lines — below the ${COMPLIANCE_THRESHOLD}% replacement requirement.${excSuffix}`,
        tone: 'bad',
      };
    default:
      return {
        text: `${name} serves ${pop} residents. Status: ${system.status}.`,
        tone: 'neutral',
      };
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Colored pill badge showing a system's compliance status.
 * Color is controlled entirely by the .badge-* CSS classes.
 */
function StatusBadge({ status }) {
  const { badgeClass } = getStatusConfig(status);
  return (
    <span className={`status-badge ${badgeClass}`}>
      {getStatusLabel(status)}
    </span>
  );
}

/**
 * Inline progress bar shown in the table row.
 * Shows N/A for systems without replaceable lines,
 * and a dash for systems with incomplete inventory.
 */
function ProgressBar({ percentReplaced, status }) {
  const noProgress = status === 'No lead lines' || status === 'No service lines; wholesale only';
  const noData     = status === 'Inventory not received or incomplete';

  if (noProgress) return <span className="prog-na">N/A</span>;
  if (noData)     return <span className="prog-na">—</span>;

  const pct       = Math.min(percentReplaced, 100);
  const fillClass = getProgressColorClass(pct);

  return (
    <div className="prog-bar-wrap">
      <div className="prog-bar">
        <div className={`prog-fill prog-fill--${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="prog-val">{percentReplaced.toFixed(1)}%</span>
    </div>
  );
}

/**
 * Small bar chart showing lines replaced per year (2021-2024).
 * Bars are scaled relative to the highest single-year value.
 *
 * To add a new year (e.g. 2025):
 *  1. Add y2025 to the vals and years arrays below
 *  2. Add the y2025 prop to all SparkBars usages
 *  3. Add y2025 to waterSystemsData.js
 */
function SparkBars({ y2021, y2022, y2023, y2024 }) {
  const vals  = [y2021, y2022, y2023, y2024];
  const years = ['2021', '2022', '2023', '2024'];
  const max   = Math.max(...vals, 1); // avoid division by zero

  return (
    <div className="spark-wrap">
      <p className="spark-label">Lines replaced per year</p>
      <div className="spark-bars">
        {vals.map((count, i) => {
          const barHeight = Math.round((count / max) * 40);
          return (
            <div key={years[i]} className="spark-col">
              <span className="spark-count">{count.toLocaleString()}</span>
              <div className="spark-bar" style={{ height: `${Math.max(barHeight, 2)}px` }} />
              <span className="spark-year">{years[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Sort direction indicator shown next to column header text.
 * Inactive (gray ↕) when not the active sort column.
 * Active (blue ↑ or ↓) when this column is being sorted.
 */
function SortIcon({ field, sortField, sortDirection }) {
  if (sortField !== field) {
    return <span className="sort-icon sort-icon--inactive">↕</span>;
  }
  return (
    <span className="sort-icon sort-icon--active">
      {sortDirection === 'asc' ? '↑' : '↓'}
    </span>
  );
}

/**
 * Collapsible legend explaining status categories and the progress formula.
 * Collapsed by default to keep the page uncluttered.
 * Toggle state is local — it does not affect the table.
 */
function Legend() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="legend-panel">
      <button
        className="legend-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="legend-toggle-icon">{isOpen ? '▾' : '▸'}</span>
        Status legend &amp; progress formula
      </button>

      {isOpen && (
        <div className="legend-body">
          <div className="legend-grid">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.label} className="legend-item">
                <span className="legend-swatch" style={item.colorStyle} />
                <div className="legend-text">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
              </div>
            ))}
            {/* Exceedance indicator — separate from status colors */}
            <div className="legend-item">
              <span className="legend-swatch legend-swatch--exc">⚠️</span>
              <div className="legend-text">
                <strong>Lead Action Level Exceedance</strong>
                <span>Exceeded Michigan lead action level (most recent year shown)</span>
              </div>
            </div>
          </div>

          <div className="legend-formula">
            <p className="legend-formula-title">Understanding "Progress"</p>
            <code className="legend-formula-code">
              % Replaced = (Lines Replaced / (Total to Identify and/or Replace + Lines Replaced)) x 100
            </code>
            <p className="legend-formula-note">
              <strong>Note:</strong> Systems with many "Unknown" lines may show low progress
              even if they have replaced all known lead lines. Unknown lines still need to be
              identified and potentially replaced, which is why they are included in the denominator.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Expanded detail panel shown below a row when the user clicks it.
 *
 * Layout (top to bottom):
 *  1. Flint data caveat (Flint only)
 *  2. Narrative summary sentence (color-coded by tone)
 *  3. Large progress bar with a tick mark at the compliance threshold
 *  4. Stat cards grid (population, lead lines, GPCL, unknown, totals, exceedance)
 *  5. Yearly sparkline bar chart (when year data is available)
 *  6. Footer with PWSID, warning badges, and EPA ECHO link
 */
function ExpandedDetail({ system }) {
  const showLeadDetails = shouldShowLeadDetails(system);
  const exceedance      = hasExceedance(system);
  const noLocation      = hasNoLocation(system);
  const flint           = isFlintSystem(system);
  const narrative       = buildNarrative(system);
  const progressColor   = getProgressColorClass(system.percentReplaced);

  // Only show the sparkline if at least one year has replacement data
  const hasYearlyData = showLeadDetails && (
    system.y2021 > 0 || system.y2022 > 0 || system.y2023 > 0 || system.y2024 > 0
  );

  return (
    <div className="expand-inner">

      {/* 1. Flint data caveat */}
      {flint && (
        <div className="expand-notice expand-notice--info">
          <span className="expand-notice-icon">i</span>
          Data for City of Flint does not include lead or galvanized service lines replaced
          between 2015 and 2021.
        </div>
      )}

      {/* 2. Plain-English summary sentence */}
      <p className={`expand-narrative expand-narrative--${narrative.tone}`}>
        {narrative.text}
      </p>

      {/* 3. Large progress bar with compliance threshold tick mark */}
      {showLeadDetails && system.totalToReplace > 0 && (
        <div className="expand-progress-row">
          <div className="expand-progress-label">
            <span className="expand-progress-pct">{system.percentReplaced.toFixed(1)}%</span>
            <span className="expand-progress-sub">replaced (2021-2024)</span>
          </div>
          <div className="expand-progress-bar">
            <div
              className={`expand-progress-fill expand-progress-fill--${progressColor}`}
              style={{ width: `${Math.min(system.percentReplaced, 100)}%` }}
            />
            {/* Tick mark at the compliance threshold */}
            <span
              className="expand-progress-threshold"
              style={{ left: `${COMPLIANCE_THRESHOLD}%` }}
              title={`${COMPLIANCE_THRESHOLD}% compliance threshold`}
            />
          </div>
        </div>
      )}

      {/* 4. Stat cards */}
      <div className="expand-grid">

        <div className="expand-stat">
          <span className="expand-stat-label">Population served</span>
          <span className="expand-stat-val">{system.population.toLocaleString()}</span>
        </div>

        {/* Lead line breakdown — only for applicable statuses */}
        {showLeadDetails && (
          <>
            {system.leadLines > 0 && (
              <div className="expand-stat">
                <span className="expand-stat-label">Lead lines</span>
                <span className="expand-stat-val expand-stat-val--lead">
                  {system.leadLines.toLocaleString()}
                </span>
              </div>
            )}
            {system.gpcl > 0 && (
              <div className="expand-stat">
                <span className="expand-stat-label">GPCL</span>
                <span className="expand-stat-val">{system.gpcl.toLocaleString()}</span>
              </div>
            )}
            {system.unknown > 0 && (
              <div className="expand-stat">
                <span className="expand-stat-label">Unknown material</span>
                <span className="expand-stat-val expand-stat-val--unknown">
                  {system.unknown.toLocaleString()}
                </span>
              </div>
            )}
            {system.totalToReplace > 0 && (
              <div className="expand-stat">
                <span className="expand-stat-label">Total to replace</span>
                <span className="expand-stat-val">{system.totalToReplace.toLocaleString()}</span>
              </div>
            )}
            {system.totalReplaced > 0 && (
              <div className="expand-stat">
                <span className="expand-stat-label">Total replaced (2021-2024)</span>
                <span className="expand-stat-val expand-stat-val--good">
                  {system.totalReplaced.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}

        {/* LCR exceedance — shown for any status if data is present */}
        {exceedance && (
          <div className="expand-stat">
            <span className="expand-stat-label">LCR exceedance year</span>
            <span className="expand-stat-val expand-stat-val--warn">
              {formatExceedance(system.exceedance)}
            </span>
          </div>
        )}

      </div>

      {/* 5. Yearly sparkline */}
      {hasYearlyData && (
        <SparkBars
          y2021={system.y2021}
          y2022={system.y2022}
          y2023={system.y2023}
          y2024={system.y2024}
        />
      )}

      {/* 6. Footer: PWSID, badges, EPA link */}
      <div className="expand-footer">
        <span className="expand-pwsid">PWSID: {system.pwsid}</span>
        {noLocation && (
          <span className="expand-badge expand-badge--noloc">No map location</span>
        )}
        {exceedance && (
          <span className="expand-badge expand-badge--exc">
            ⚠️ LCR Exceedance {formatExceedance(system.exceedance)}
          </span>
        )}
        {system.epaLink && (
          <a href={system.epaLink} target="_blank" rel="noopener noreferrer" className="expand-epa-link">
            View on EPA ECHO ↗
          </a>
        )}
      </div>

    </div>
  );
}

/**
 * Builds the list of page items (numbers and ellipsis placeholders) for pagination.
 * Always includes the first page, last page, and pages within 2 of the current page.
 * Inserts string placeholders where consecutive page numbers are skipped.
 *
 * Example: 10 total pages, currently on page 5 (zero-indexed):
 *   [0, 'ellipsis-3', 3, 4, 5, 6, 7, 'ellipsis-9', 9]
 *
 * @param {number} totalPages
 * @param {number} currentPage - zero-indexed
 * @returns {Array<number|string>}
 */
function buildPageItems(totalPages, currentPage) {
  const visiblePages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2
  );

  return visiblePages.reduce((acc, pageIndex, idx, arr) => {
    if (idx > 0 && pageIndex - arr[idx - 1] > 1) {
      acc.push(`ellipsis-${pageIndex}`);
    }
    acc.push(pageIndex);
    return acc;
  }, []);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * WaterSystemDirectory
 *
 * Top-level component for the "Search Systems" tab.
 * Accepts an optional `data` prop for testing; defaults to the full dataset.
 *
 * State summary:
 *   searchTerm        - Text input filtering by name or PWSID
 *   filterStatus      - Dropdown filtering by compliance status
 *   filterExceedances - Checkbox: show only systems with LCR exceedances
 *   filterNoLocation  - Checkbox: show only systems missing map coordinates
 *   sortField         - Which data field to sort by
 *   sortDirection     - 'asc' or 'desc'
 *   currentPage       - Zero-indexed current page
 *   pageSize          - Rows per page (25 / 50 / 100)
 *   expandedId        - PWSID of the currently open row, or null
 */
function WaterSystemDirectory({ data = waterSystemsData }) {

  // Filter state
  const [searchTerm,        setSearchTerm]        = useState('');
  const [filterStatus,      setFilterStatus]      = useState('all');
  const [filterExceedances, setFilterExceedances] = useState(false);
  const [filterNoLocation,  setFilterNoLocation]  = useState(false);

  // Sort state
  const [sortField,     setSortField]     = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize,    setPageSize]    = useState(25);

  // Expand state: only one row can be open at a time
  const [expandedId, setExpandedId] = useState(null);

  // Derive unique status values from the dataset for the filter dropdown.
  // Recalculates only when the data prop changes.
  const availableStatuses = useMemo(
    () => Array.from(new Set(data.map((s) => s.status))).sort(),
    [data]
  );

  // Apply all active filters and the current sort order.
  // Recalculates only when a filter, sort, or data dependency changes.
  const processedData = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = data.filter((system) => {
      // Text search matches against both name and PWSID
      if (term && !system.name.toLowerCase().includes(term) && !system.pwsid.toLowerCase().includes(term)) {
        return false;
      }
      if (filterStatus !== 'all' && system.status !== filterStatus) {
        return false;
      }
      if (filterExceedances && !hasExceedance(system)) {
        return false;
      }
      if (filterNoLocation && !hasNoLocation(system)) {
        return false;
      }
      return true;
    });

    // Sort strings case-insensitively; push null values to the end
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal == null) aVal = sortDirection === 'asc' ?  Infinity : -Infinity;
      if (bVal == null) bVal = sortDirection === 'asc' ?  Infinity : -Infinity;

      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [data, searchTerm, filterStatus, filterExceedances, filterNoLocation, sortField, sortDirection]);

  // Clamp currentPage so it never exceeds the available pages after a filter change
  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages - 1);
  const pageData   = processedData.slice(safePage * pageSize, safePage * pageSize + pageSize);

  // All filter and sort changes should reset to page 1 to avoid empty pages
  const resetPage = useCallback(() => setCurrentPage(0), []);

  // Event handlers — each calls resetPage() after updating its filter value
  const handleSearch            = (e) => { setSearchTerm(e.target.value);           resetPage(); };
  const handleStatusFilter      = (e) => { setFilterStatus(e.target.value);          resetPage(); };
  const handleExceedancesFilter = (e) => { setFilterExceedances(e.target.checked);   resetPage(); };
  const handleNoLocationFilter  = (e) => { setFilterNoLocation(e.target.checked);    resetPage(); };
  const handlePageSize          = (e) => { setPageSize(Number(e.target.value));       resetPage(); };

  const handleSort = (field) => {
    if (sortField === field) {
      // Same column clicked: flip the sort direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // New column: default to ascending for name, descending for numeric fields
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
    resetPage();
  };

  // Toggle a row open; clicking the same row again closes it
  const toggleExpand = (pwsid) => {
    setExpandedId((prev) => (prev === pwsid ? null : pwsid));
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="dir-container">

      {/* Page header */}
      <div className="dir-header">
        <h1>Michigan Water System Directory</h1>
        <p>Search and explore lead service line data for water systems across Michigan</p>
      </div>

      {/* Search input, filter controls, and results count */}
      <div className="dir-controls">

        {/* Text search */}
        <div className="dir-search-wrap">
          <span className="dir-search-icon" aria-hidden="true">⌕</span>
          <input
            type="text"
            className="dir-search-input"
            placeholder="Search by system name or PWSID…"
            value={searchTerm}
            onChange={handleSearch}
          />
          {/* Clear button appears only when there is text to clear */}
          {searchTerm && (
            <button
              className="dir-search-clear"
              onClick={() => { setSearchTerm(''); resetPage(); }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="dir-filters">

          <div className="dir-filter-group">
            <label className="dir-filter-label" htmlFor="statusFilter">Status</label>
            <select id="statusFilter" className="dir-select" value={filterStatus} onChange={handleStatusFilter}>
              <option value="all">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <label className="dir-checkbox-label">
            <input type="checkbox" checked={filterExceedances} onChange={handleExceedancesFilter} />
            <span>Exceedances only</span>
          </label>

          {/* Available for data quality review — shows systems without map pins */}
          <label className="dir-checkbox-label">
            <input type="checkbox" checked={filterNoLocation} onChange={handleNoLocationFilter} />
            <span>No map location</span>
          </label>

          {/* Rows-per-page selector, pushed to the far right */}
          <div className="dir-filter-group dir-filter-group--right">
            <label className="dir-filter-label" htmlFor="pageSize">Rows</label>
            <select id="pageSize" className="dir-select dir-select--sm" value={pageSize} onChange={handlePageSize}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Results count and current page */}
        <div className="dir-meta">
          <span className="dir-count">
            Showing <strong>{processedData.length.toLocaleString()}</strong> of {data.length.toLocaleString()} systems
          </span>
          {processedData.length > 0 && (
            <span className="dir-page-info">Page {safePage + 1} of {totalPages}</span>
          )}
        </div>

      </div>

      {/* Collapsible status legend */}
      <Legend />

      {/* Data table */}
      <div className="dir-table-wrap">
        <table className="dir-table">
          <thead>
            <tr>
              <th className="col-name"   onClick={() => handleSort('name')}>
                System name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="col-pop"    onClick={() => handleSort('population')}>
                Population <SortIcon field="population" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="col-status">Status</th>
              <th className="col-prog"   onClick={() => handleSort('percentReplaced')}>
                Progress <SortIcon field="percentReplaced" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="col-lead"   onClick={() => handleSort('leadLines')}>
                Lead lines <SortIcon field="leadLines" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="col-pwsid">PWSID</th>
              {/* Exceedance column: shows full text inline so users don't need to expand */}
              <th className="col-exc">LCR Exceedance</th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={7} className="dir-no-results">
                  <p>No water systems match your filters.</p>
                  <p className="dir-no-results-hint">Try adjusting your search or clearing a filter.</p>
                </td>
              </tr>
            ) : (
              pageData.map((system) => {
                const isExpanded = expandedId === system.pwsid;
                const exceedance = hasExceedance(system);

                return (
                  // React.Fragment lets us render two sibling <tr> elements under one key:
                  // the data row and the optional expanded detail row.
                  <React.Fragment key={system.pwsid}>

                    {/* Data row — click to expand or collapse */}
                    <tr
                      className={`dir-row ${getRowClass(system.status)} ${isExpanded ? 'dir-row--expanded' : ''}`}
                      onClick={() => toggleExpand(system.pwsid)}
                      aria-expanded={isExpanded}
                    >
                      <td className="col-name">
                        <span className="dir-row-expand-icon">{isExpanded ? '▾' : '▸'}</span>
                        <span className="dir-system-name">{system.name}</span>
                      </td>
                      <td className="col-pop">{system.population.toLocaleString()}</td>
                      <td className="col-status">
                        <StatusBadge status={system.status} />
                      </td>
                      <td className="col-prog">
                        <ProgressBar percentReplaced={system.percentReplaced} status={system.status} />
                      </td>
                      <td className="col-lead">
                        {system.leadLines > 0
                          ? system.leadLines.toLocaleString()
                          : <span className="dir-dash">—</span>
                        }
                      </td>
                      <td className="col-pwsid">
                        <span className="dir-pwsid-cell">{system.pwsid}</span>
                      </td>
                      <td className="col-exc">
                        {exceedance
                          ? <span className="exc-text">⚠️ LCR {formatExceedance(system.exceedance)}</span>
                          : <span className="dir-dash">—</span>
                        }
                      </td>
                    </tr>

                    {/* Expanded detail row — only rendered when this row is open */}
                    {isExpanded && (
                      <tr className="dir-expand-row">
                        <td colSpan={7} className="dir-expand-cell">
                          <ExpandedDetail system={system} />
                        </td>
                      </tr>
                    )}

                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — only rendered when there is more than one page */}
      {totalPages > 1 && (
        <div className="dir-pagination">
          <button className="dir-pag-btn" onClick={() => setCurrentPage(0)} disabled={safePage === 0}>
            «
          </button>
          <button className="dir-pag-btn" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
            ‹ Prev
          </button>

          {buildPageItems(totalPages, safePage).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="dir-pag-ellipsis">…</span>
            ) : (
              <button
                key={item}
                className={`dir-pag-btn dir-pag-btn--num ${item === safePage ? 'dir-pag-btn--active' : ''}`}
                onClick={() => setCurrentPage(item)}
              >
                {item + 1}
              </button>
            )
          )}

          <button className="dir-pag-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
            Next ›
          </button>
          <button className="dir-pag-btn" onClick={() => setCurrentPage(totalPages - 1)} disabled={safePage >= totalPages - 1}>
            »
          </button>
        </div>
      )}

    </div>
  );
}

export default WaterSystemDirectory;