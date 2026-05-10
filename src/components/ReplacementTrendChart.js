/**
 * ReplacementTrendChart.js
 *
 * Line chart showing annual lead service line replacements (2021–2024)
 * for a selected water system.
 *
 * Data source: src/data/mergedData.js (converted from the pipeline CSV).
 *
 * Props:
 *   data {Array} — merged dataset (default: mergedData).
 *                  Each row must have: resolved_pwsid, display_name,
 *                  lines_replaced (number|null), year (number).
 *
 * Data notes:
 *   - Only rows with year 2021–2024 and non-null lines_replaced are shown,
 *     because 2025 is inventory-only (no LSLR replacement data).
 *   - The system dropdown is derived dynamically from rows that have at
 *     least one year of lines_replaced data.
 *   - The insight box calculates % change from 2021 to 2024 automatically.
 *   - When a system has no data for a year, that year shows 0 replacements
 *     (initialized to 0 in aggregateByYear) so the x-axis stays consistent.
 */

import React, { useState, useMemo } from 'react';
import {
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

// Years covered by LSLR data — update when new years are added
const LSLR_YEARS = [2021, 2022, 2023, 2024];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns a deduplicated list of systems that have at least one year of
 * lines_replaced data, sorted alphabetically by display_name.
 * Used to populate the system selector dropdown.
 *
 * @param {Array} data — full merged dataset
 * @returns {Array<{ resolved_pwsid: string, display_name: string }>}
 */
function getSystemsWithReplacementData(data) {
  const seen = new Set();
  const systems = [];

  data
    .filter((row) => LSLR_YEARS.includes(row.year) && row.lines_replaced != null)
    .forEach((row) => {
      if (!seen.has(row.resolved_pwsid)) {
        seen.add(row.resolved_pwsid);
        systems.push({
          resolved_pwsid: row.resolved_pwsid,
          display_name:   row.display_name,
        });
      }
    });

  return systems.sort((a, b) => a.display_name.localeCompare(b.display_name));
}

/**
 * Aggregates lines_replaced by year for a single system.
 * All LSLR years are initialized to 0 so the x-axis stays consistent
 * even when a system has no data for a particular year.
 *
 * @param {Array}  data          — full merged dataset
 * @param {string} resolvedPwsid — resolved_pwsid of the selected system
 * @returns {Array<{ year: string, replacements: number }>}
 */
function getSystemReplacementSeries(data, resolvedPwsid) {
  const totals = {};
  LSLR_YEARS.forEach((y) => { totals[y] = 0; });

  data
    .filter((row) =>
      row.resolved_pwsid === resolvedPwsid &&
      LSLR_YEARS.includes(row.year) &&
      row.lines_replaced != null
    )
    .forEach((row) => {
      totals[row.year] = (totals[row.year] || 0) + row.lines_replaced;
    });

  return LSLR_YEARS.map((y) => ({
    year:         String(y),
    replacements: totals[y],
  }));
}

/**
 * Returns the percentage change from the first to the last year's value.
 * Returns null if the first year value is zero (avoids division by zero).
 *
 * @param {Array<{ replacements: number }>} chartData
 * @returns {number|null}
 */
function calcPctChange(chartData) {
  const first = chartData[0]?.replacements;
  const last  = chartData[chartData.length - 1]?.replacements;
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

/**
 * Custom Recharts tooltip showing year and formatted replacement count.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   '#fff',
      border:       '1px solid #e2e8f0',
      borderRadius: '6px',
      padding:      '10px 14px',
      fontSize:     '0.85rem',
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1f2937' }}>{label}</p>
      <p style={{ margin: 0, color: '#3b82f6' }}>
        {payload[0].value.toLocaleString()} lines replaced
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ReplacementTrendChart
 *
 * Renders a per-system annual replacement trend line chart.
 * Defaults to the first system with available replacement data.
 */
function ReplacementTrendChart({ data = mergedData }) {

  // Derive the list of selectable systems from the dataset
  const availableSystems = useMemo(
    () => getSystemsWithReplacementData(data),
    [data]
  );

  // Default to the first available system
  const [selectedPwsid, setSelectedPwsid] = useState(
    () => availableSystems[0]?.resolved_pwsid ?? null
  );

  // Replacement series for the selected system
  const chartData = useMemo(
    () => selectedPwsid ? getSystemReplacementSeries(data, selectedPwsid) : [],
    [data, selectedPwsid]
  );

  // Display name for the selected system
  const selectedName = availableSystems.find(
    (s) => s.resolved_pwsid === selectedPwsid
  )?.display_name ?? '';

  // Auto-calculate insight: % change from 2021 to 2024
  const pctChange     = calcPctChange(chartData);
  const insightText   = pctChange != null
    ? `${pctChange > 0 ? '+' : ''}${pctChange}% change from ${LSLR_YEARS[0]} to ${LSLR_YEARS[LSLR_YEARS.length - 1]}`
    : 'Insufficient data to calculate trend';
  const insightClass  = pctChange != null && pctChange > 0 ? 'green' : 'yellow';

  return (
    <div className="chart-card">

      {/* Header row: title + system selector */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '0.75rem',
        flexWrap:       'wrap',
        gap:            '0.5rem',
      }}>
        <h3 style={{ margin: 0 }}>Annual Replacement Trend</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label
            htmlFor="trendSystemFilter"
            style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}
          >
            System
          </label>
          <select
            id="trendSystemFilter"
            value={selectedPwsid ?? ''}
            onChange={(e) => setSelectedPwsid(e.target.value)}
            style={{
              height:       '30px',
              padding:      '0 0.5rem',
              fontSize:     '0.82rem',
              border:       '1px solid #d1d5db',
              borderRadius: '6px',
              background:   '#fff',
              color:        '#1f2937',
              cursor:       'pointer',
              maxWidth:     '220px',
            }}
          >
            {availableSystems.map((s) => (
              <option key={s.resolved_pwsid} value={s.resolved_pwsid}>
                {s.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {availableSystems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
          No replacement data available.
        </div>
      ) : (
        <>
          {/* Line chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 13 }} padding={{ right: 20 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#e2e8f0" />
              <Line
                type="monotone"
                dataKey="replacements"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 6 }}
                activeDot={{ r: 8 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Auto-calculated insight box */}
          <div className={`insight-box ${insightClass}`}>
            <strong>{insightText}</strong>
            {selectedName && <span> for {selectedName}</span>}
          </div>

          {/* Data note */}
          <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.5rem 0 0', lineHeight: 1.4 }}>
            2021–2024 data from EGLE Lead Service Line Replacement Reports.
            2025 inventory data is not shown here as it does not include replacement counts.
          </p>
        </>
      )}

    </div>
  );
}

export default ReplacementTrendChart;