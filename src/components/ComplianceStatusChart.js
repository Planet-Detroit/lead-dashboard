/**
 * ComplianceStatusChart.js
 *
 * Horizontal bar chart showing how many water systems fall into each
 * compliance status category statewide.
 *
 * Data source: src/data/waterSystemsData.js (existing dataset).
 * No changes needed when the pipeline CSV lands — this chart is a snapshot
 * of current compliance status, not a trend over time.
 *
 * Props:
 *   data {Array} — water systems array (default: waterSystemsData).
 *                  Each object must have: status (string), population (number).
 *
 * To add to Dashboard.js:
 *   import ComplianceStatusChart from './ComplianceStatusChart';
 *   // place inside the charts-grid div
 */

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import waterSystemsData from '../data/waterSystemsData';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Display order, labels, and colors for each status category.
 * Order is intentional: most actionable statuses (non-compliant, incomplete)
 * appear first so they draw attention before the positive categories.
 *
 * Colors match STATUS_CONFIG in WaterSystemDirectory.js — keep them in sync
 * if either file is updated.
 */
const STATUS_DISPLAY = [
  { status: 'Not compliant',                        label: '<20% avg replacement',       color: '#dc2626' },
  { status: 'Inventory not received or incomplete', label: 'Inventory incomplete',       color: '#7c3aed' },
  { status: 'Compliant',                            label: '>=20% avg replacement',      color: '#16a34a' },
  { status: '100% replaced',                        label: '100% replaced',             color: '#059669' },
  { status: 'No lead lines',                        label: 'No lead lines',             color: '#2563eb' },
  { status: 'No service lines; wholesale only',     label: 'Wholesale only',            color: '#6b7280' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Counts systems and sums population for each status category.
 * Categories with zero systems are included so the chart always shows
 * the full picture even when a category is empty.
 *
 * @param {Array} data — water systems array
 * @param {'systems'|'population'} metric — what to count
 * @returns {Array<{ status, label, color, value }>}
 */
function buildChartData(data, metric) {
  // Count systems or sum population per status
  const counts = {};
  data.forEach((system) => {
    if (!counts[system.status]) {
      counts[system.status] = { systems: 0, population: 0 };
    }
    counts[system.status].systems    += 1;
    counts[system.status].population += system.population || 0;
  });

  return STATUS_DISPLAY.map((entry) => ({
    ...entry,
    value: counts[entry.status]?.[metric] ?? 0,
  }));
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

/**
 * Custom tooltip showing full status label, count/population, and
 * percentage of total.
 */
function CustomTooltip({ active, payload, metric, total }) {
  if (!active || !payload?.length) return null;

  const { label, value, color } = payload[0].payload;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  const formatted = metric === 'population'
    ? value.toLocaleString() + ' residents'
    : value.toLocaleString() + ' systems';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '10px 14px',
      fontSize: '0.85rem',
      maxWidth: '220px',
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 600, color }}>{label}</p>
      <p style={{ margin: '0 0 2px', color: '#1f2937' }}>{formatted}</p>
      <p style={{ margin: 0, color: '#6b7280' }}>{pct}% of total</p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ComplianceStatusChart
 *
 * Horizontal bar chart of compliance status distribution.
 * Toggle between system count and population served.
 */
function ComplianceStatusChart({ data = waterSystemsData }) {
  // Toggle between counting systems vs. summing population served
  const [metric, setMetric] = useState('systems');

  const chartData = buildChartData(data, metric);

  // Total for percentage calculations in tooltip
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Largest value drives the x-axis domain
  const maxValue = Math.max(...chartData.map((d) => d.value));

  // How many systems are in the two most urgent categories
  const notCompliantCount  = chartData.find((d) => d.status === 'Not compliant')?.value ?? 0;
  const incompleteCount    = chartData.find((d) => d.status === 'Inventory not received or incomplete')?.value ?? 0;
  const urgentCount        = notCompliantCount + incompleteCount;
  const urgentPct          = total > 0 ? Math.round((urgentCount / total) * 100) : 0;

  return (
    <div className="chart-card">

      {/* Header row: title + metric toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <h3 style={{ margin: 0 }}>Compliance Status Breakdown</h3>

        {/* Toggle: count systems or population served */}
        <div style={{
          display: 'flex',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden',
          fontSize: '0.8rem',
        }}>
          {[
            { value: 'systems',    label: 'Systems' },
            { value: 'population', label: 'Population' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMetric(value)}
              style={{
                padding: '4px 12px',
                border: 'none',
                background: metric === value ? '#2563eb' : '#fff',
                color:      metric === value ? '#fff'    : '#6b7280',
                fontWeight: metric === value ? 600       : 400,
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal bar chart */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barSize={22}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            domain={[0, Math.ceil(maxValue * 1.1)]}
            tickFormatter={(v) =>
              metric === 'population' && v >= 1000
                ? `${(v / 1000).toFixed(0)}k`
                : v.toLocaleString()
            }
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            width={130}
          />
          <Tooltip content={<CustomTooltip metric={metric} total={total} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Insight box — language switches based on the active metric */}
      <div className="insight-box yellow">
        {metric === 'systems' ? (
          <>
            <strong>{urgentPct}% of systems</strong> ({urgentCount.toLocaleString()}) are
            below the 20% replacement requirement or have incomplete inventories.
          </>
        ) : (
          <>
            <strong>{urgentPct}% of the population served</strong> ({urgentCount.toLocaleString()} residents)
            are supplied by systems below the 20% replacement requirement or with incomplete inventories.
          </>
        )}
      </div>

      {/* Data note */}
      <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.5rem 0 0', lineHeight: 1.4 }}>
        Compliance threshold: ≥20% of service lines replaced (2021–2024).
        Data source: Michigan EGLE CDSMI and Lead Service Line Replacement Reports.
      </p>

    </div>
  );
}

export default ComplianceStatusChart;