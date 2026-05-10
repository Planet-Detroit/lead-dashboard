/**
 * SystemTrendPanel.js
 *
 * Combined panel showing two stacked charts for a single selected water system:
 *   1. Annual Replacement Trend — lines replaced per year (2021–2024)
 *   2. Lead Levels Over Time — 90th percentile lead (ppb) across all monitoring years
 *
 * A single system dropdown at the top controls both charts simultaneously,
 * eliminating any risk of a user comparing mismatched systems across the two charts.
 *
 * Replaces the separate ReplacementTrendChart and LeadLevelTrendChart components
 * in Dashboard.js. Those files are kept as standalone exports in case they are
 * needed elsewhere, but their individual dropdowns are no longer used here.
 *
 * Data source: src/data/mergedData.js
 *
 * To add a new LSLR year (e.g. 2025):
 *   1. Add the year to the LSLR_YEARS array below
 *   2. Ensure mergedData.js has lines_replaced populated for that year
 *
 * Props:
 *   data {Array} — merged dataset (default: mergedData)
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import mergedData from '../data/mergedData';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Years covered by LSLR replacement data. Update when new years are added. */
const LSLR_YEARS = [2021, 2022, 2023, 2024];

/**
 * Lead action level thresholds:
 *   ACTION_LEVEL_NEW — 12 ppb, effective 2025 onwards (current standard)
 *   ACTION_LEVEL_OLD — 15 ppb, effective before 2025 (pre-2025 standard)
 *
 * Dot color rules:
 *   Year < 2025:  ppb > 15 → red,  12 < ppb ≤ 15 → orange,  ppb ≤ 12 → blue
 *   Year >= 2025: ppb > 12 → red,  ppb ≤ 12 → blue
 */
const ACTION_LEVEL_NEW = 12;  // current 2025 standard
const ACTION_LEVEL_OLD = 15;  // pre-2025 standard
const TRANSITION_YEAR  = 2025; // year the new standard took effect

const COLOR_RED    = '#dc2626'; // red — exceeds applicable action level
const COLOR_ORANGE = '#f97316'; // orange — between 12–15 ppb before 2025
const COLOR_BLUE   = '#3b82f6'; // blue — below action level
const COLOR_BAR    = '#3b82f6'; // blue — replacement bars
const COLOR_LINE   = '#3b82f6'; // blue — lead level line

/**
 * Returns the dot color for a given ppb reading and year.
 * Encodes the year-aware exceedance rules in one place so both
 * LeadDot and LeadTooltip use identical logic.
 *
 * @param {number} ppb
 * @param {number} year
 * @returns {string} hex color
 */
function getDotColor(ppb, year) {
  if (ppb == null) return COLOR_BLUE;
  if (year >= TRANSITION_YEAR) {
    return ppb > ACTION_LEVEL_NEW ? COLOR_RED : COLOR_BLUE;
  }
  // Before 2025: use the old 15 ppb threshold
  if (ppb > ACTION_LEVEL_OLD) return COLOR_RED;
  if (ppb > ACTION_LEVEL_NEW) return COLOR_ORANGE;
  return COLOR_BLUE;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns one entry per base_pwsid for the system dropdown.
 * When a base PWSID has multiple subsystems (resolved as -a, -b etc.), they are
 * grouped under the base PWSID using the shortest display_name as the label.
 * This prevents duplicate dropdown entries for cities like Traverse City that
 * were split by the pipeline due to multiple system name variants.
 *
 * @param {Array} data — full merged dataset
 * @returns {Array<{ base_pwsid: string, display_name: string }>}
 */
function getAllSystems(data) {
  const byBase = new Map();

  data.forEach((row) => {
    if (!byBase.has(row.base_pwsid)) {
      byBase.set(row.base_pwsid, row.display_name);
    } else {
      // Prefer the shorter name as the display label (e.g. "TRAVERSE CITY"
      // over "TRAVERSE CITY, CITY OF") — shorter names are typically cleaner
      const existing = byBase.get(row.base_pwsid);
      if (row.display_name.length < existing.length) {
        byBase.set(row.base_pwsid, row.display_name);
      }
    }
  });

  return Array.from(byBase.entries())
    .map(([base_pwsid, display_name]) => ({ base_pwsid, display_name }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}

/**
 * Returns the annual replacement series for a system across LSLR_YEARS.
 * Filters by base_pwsid so all subsystems (-a, -b etc.) are aggregated together.
 * Years with no data default to 0 so the x-axis stays consistent.
 *
 * @param {Array}  data       — full merged dataset
 * @param {string} basePwsid  — base_pwsid of the selected system
 * @returns {Array<{ year: string, replacements: number }>}
 */
function getReplacementSeries(data, basePwsid) {
  const totals = {};
  LSLR_YEARS.forEach((y) => { totals[y] = 0; });

  data
    .filter((row) =>
      row.base_pwsid === basePwsid &&
      LSLR_YEARS.includes(row.year) &&
      row.lines_replaced != null
    )
    .forEach((row) => {
      totals[row.year] = (totals[row.year] || 0) + row.lines_replaced;
    });

  return LSLR_YEARS.map((y) => ({ year: String(y), replacements: totals[y] }));
}

/**
 * Returns the lead monitoring time series for a system.
 * Filters by base_pwsid so all subsystems (-a, -b etc.) are included.
 * Only includes years the system actually has data for — x-axis is scoped
 * to the system's own history to avoid sparse charts.
 * When multiple rows exist for the same year (different monitoring_end_date
 * or different subsystems), the highest ppb value is used — showing the
 * worst-case reading is more informative for public health purposes.
 *
 * @param {Array}  data      — full merged dataset
 * @param {string} basePwsid — base_pwsid of the selected system
 * @returns {Array<{ year: string, ppb: number, aboveActionLevel: boolean }>}
 */
function getLeadSeries(data, basePwsid) {
  const worstByYear = {};

  data
    .filter((row) => row.base_pwsid === basePwsid && row.lead_90th_ppb != null)
    .forEach((row) => {
      const existing = worstByYear[row.year];
      // Use the highest ppb reading for the year across all subsystems
      if (!existing || row.lead_90th_ppb > existing.lead_90th_ppb) {
        worstByYear[row.year] = row;
      }
    });

  return Object.values(worstByYear)
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year:             String(row.year),  // string for XAxis label
      yearNum:          row.year,          // number for year-aware color logic
      ppb:              row.lead_90th_ppb,
      aboveActionLevel: row.above_action_level,
    }));
}

/**
 * Returns the most recent total_to_identify_or_replace value for a system.
 * Looks across all subsystems (base_pwsid match) for the inventory row
 * with the most recent year that has a non-null value.
 * Used to show remaining lines context below the replacement trend chart.
 *
 * @param {Array}  data      — full merged dataset
 * @param {string} basePwsid — base_pwsid of the selected system
 * @returns {number|null}
 */
function getInventoryTotal(data, basePwsid) {
  const inventoryRows = data.filter(
    (row) => row.base_pwsid === basePwsid && row.total_to_identify_or_replace != null
  );
  if (inventoryRows.length === 0) return null;
  // Pick the most recent inventory year
  const latest = inventoryRows.reduce((best, row) => row.year > best.year ? row : best);
  return latest.total_to_identify_or_replace;
}

// =============================================================================
// CUSTOM TOOLTIPS
// =============================================================================

function ReplacementTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem' }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1f2937' }}>{label}</p>
      <p style={{ margin: 0, color: COLOR_BAR }}>{payload[0].value.toLocaleString()} lines replaced</p>
    </div>
  );
}

function LeadTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const ppb  = payload[0]?.value;
  const year = payload[0]?.payload?.yearNum; // numeric year for threshold logic
  const dotColor = getDotColor(ppb, year);
  const threshold = year >= TRANSITION_YEAR ? ACTION_LEVEL_NEW : ACTION_LEVEL_OLD;
  const isAbove = ppb != null && ppb > threshold;

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', minWidth: '180px' }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1f2937' }}>{label}</p>
      {ppb != null ? (
        <>
          <p style={{ margin: '0 0 2px', color: dotColor }}>
            {ppb.toFixed(1)} ppb (90th percentile)
          </p>
          {isAbove && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: dotColor, fontWeight: 600 }}>
              ⚠ Above {threshold} ppb action level
            </p>
          )}
        </>
      ) : (
        <p style={{ margin: 0, color: '#9ca3af' }}>No data this year</p>
      )}
    </div>
  );
}

// =============================================================================
// CUSTOM DOT — lead levels chart
// =============================================================================

/**
 * Year-aware colored dot for the lead levels chart.
 * Color logic matches getDotColor() — see constants section for rules.
 * Size: red/orange (exceedance) dots are slightly larger for visibility.
 */
function LeadDot({ cx, cy, payload }) {
  if (payload.ppb == null) return null;
  const color   = getDotColor(payload.ppb, payload.yearNum);
  const isAbove = color !== COLOR_BLUE;
  return (
    <circle
      cx={cx} cy={cy}
      r={isAbove ? 8 : 6}
      fill={color}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

// =============================================================================
// SHARED DROPDOWN STYLES
// =============================================================================

const selectStyle = {
  height:       '30px',
  padding:      '0 0.5rem',
  fontSize:     '0.82rem',
  border:       '1px solid #d1d5db',
  borderRadius: '6px',
  background:   '#fff',
  color:        '#1f2937',
  cursor:       'pointer',
  maxWidth:     '240px',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SystemTrendPanel
 *
 * Single card containing:
 *   - One shared system selector dropdown
 *   - Annual Replacement Trend bar chart (top)
 *   - Lead Levels Over Time line chart (bottom)
 *
 * Both charts always reflect the same selected system.
 */
function SystemTrendPanel({ data = mergedData }) {

  // All systems — union of monitoring and replacement data
  const allSystems = useMemo(() => getAllSystems(data), [data]);

  // Default to the first system
  const [selectedPwsid, setSelectedPwsid] = useState(
    () => allSystems[0]?.base_pwsid ?? null
  );

  // eslint-disable-next-line no-unused-vars
  const selectedName = allSystems.find(
    (s) => s.base_pwsid === selectedPwsid
  )?.display_name ?? '';

  // Replacement data for selected system
  const replacementData = useMemo(
    () => selectedPwsid ? getReplacementSeries(data, selectedPwsid) : [],
    [data, selectedPwsid]
  );

  // Total lines remaining from 2025 inventory (aggregated across subsystems)
  const inventoryTotal = useMemo(
    () => selectedPwsid ? getInventoryTotal(data, selectedPwsid) : null,
    [data, selectedPwsid]
  );

  // Lead monitoring data for selected system
  const leadData = useMemo(
    () => selectedPwsid ? getLeadSeries(data, selectedPwsid) : [],
    [data, selectedPwsid]
  );

  // Y-axis upper bound for lead chart — always shows the 12 ppb line
  const maxPpb = Math.max(...leadData.map((d) => d.ppb), ACTION_LEVEL_OLD + 2);
  const yMax   = Math.ceil(maxPpb * 1.15);

  // totalReplaced still needed for potential future use
  const totalReplaced = replacementData.reduce((sum, d) => sum + d.replacements, 0); // eslint-disable-line no-unused-vars

  return (
    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Shared header: title + single system selector ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '0.75rem',
        flexWrap:       'wrap',
        gap:            '0.5rem',
      }}>
        <h3 style={{ margin: 0 }}>System Trends</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label
            htmlFor="systemTrendSelect"
            style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}
          >
            Water system
          </label>
          <select
            id="systemTrendSelect"
            value={selectedPwsid ?? ''}
            onChange={(e) => setSelectedPwsid(e.target.value)}
            style={selectStyle}
          >
            {allSystems.map((s) => (
              <option key={s.base_pwsid} value={s.base_pwsid}>
                {s.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Chart 1: Annual Replacement Trend ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        Annual Replacement Trend
      </p>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        Lead and GPCL service lines replaced per year (2021–2024)
      </p>

      <ResponsiveContainer width="100%" style={{ flex: 1 }} height="100%" minHeight={160}>
        <BarChart data={replacementData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} padding={{ right: 20 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<ReplacementTooltip />} />
          <Bar dataKey="replacements" fill={COLOR_BAR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Lines remaining — inventory context to give the replacement numbers scale */}
      {inventoryTotal != null && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '0.5rem',
          margin:         '0.5rem 0',
          padding:        '0.5rem 0.75rem',
          background:     '#f8fafc',
          border:         '1px solid #e2e8f0',
          borderRadius:   '6px',
          fontSize:       '0.82rem',
          color:          '#374151',
        }}>
          <span style={{ color: '#6b7280' }}>Lines remaining to identify or replace:</span>
          <strong style={{ fontSize: '1rem', color: '#111827' }}>
            {inventoryTotal.toLocaleString()}
          </strong>
          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(2025 inventory)</span>
        </div>
      )}

      {/* Replacement insight */}
      {/* insight box removed per client request */}
      </div> {/* end flex:1 wrapper */}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: '0.75rem' }} />

      {/* ── Chart 2: Lead Levels Over Time ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        Lead Levels Over Time
      </p>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        90th percentile lead concentration (ppb) — red dots exceed the applicable action level (15 ppb before 2025, 12 ppb from 2025)
      </p>

      {leadData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          No lead monitoring data available for this system.
        </div>
      ) : (
        <ResponsiveContainer width="100%" style={{ flex: 1 }} height="100%" minHeight={160}>
          <LineChart data={leadData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              padding={{ left: 10, right: 20 }}
              angle={leadData.length > 6 ? -45 : 0}
              textAnchor={leadData.length > 6 ? 'end' : 'middle'}
              height={leadData.length > 6 ? 48 : 30}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              domain={[0, yMax]}
              tickFormatter={(v) => `${v} ppb`}
              width={56}
            />
            <Tooltip content={<LeadTooltip />} />
            {/* 15 ppb — pre-2025 standard (orange) */}
            <ReferenceLine
              y={ACTION_LEVEL_OLD}
              stroke={COLOR_ORANGE}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value:      `${ACTION_LEVEL_OLD} ppb (before 2025)`,
                position:   'insideBottomLeft',
                fontSize:   10,
                fill:       COLOR_ORANGE,
                fontWeight: 600,
                dy:         -5,
              }}
            />
            {/* 12 ppb — current 2025 standard (red) */}
            <ReferenceLine
              y={ACTION_LEVEL_NEW}
              stroke={COLOR_RED}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value:      `${ACTION_LEVEL_NEW} ppb (from 2025)`,
                position:   'insideBottomLeft',
                fontSize:   10,
                fill:       COLOR_RED,
                fontWeight: 600,
                dy:         -5,
              }}
            />
            <Line
              type="monotone"
              dataKey="ppb"
              stroke={COLOR_LINE}
              strokeWidth={3}
              dot={<LeadDot />}
              activeDot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      </div> {/* end lead chart flex:1 wrapper */}
    </div>
  );
}

export default SystemTrendPanel;
