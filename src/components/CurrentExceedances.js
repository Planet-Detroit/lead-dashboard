import React from 'react';
import {
  getCurrentExceedances,
  actionLevelForYear,
  ACTION_LEVEL_NEW,
} from '../data/exceedanceUtils';

/**
 * Current Exceedances — Overview card listing every water system whose most
 * recent 90th percentile lead result is above the action level in effect for
 * that monitoring period. Derived from the auto-updatable monitoring history,
 * so new state data surfaces here without a manual re-import.
 *
 * Props:
 *   onSelect {function} — optional; called with a base_pwsid when a system
 *                         name is clicked (used to drive the System Trends
 *                         panel above).
 */
function CurrentExceedances({ onSelect }) {
  const exceedances = getCurrentExceedances();

  const formatPeriod = (dateStr) => {
    const [y, m] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };

  const titleCase = (s) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="chart-card" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Current Lead Action Level Exceedances</h3>
        <span style={{
          background: '#fee2e2', color: '#b91c1c', fontWeight: 700,
          borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.8rem',
        }}>
          {exceedances.length} system{exceedances.length === 1 ? '' : 's'}
        </span>
      </div>
      <p style={{ margin: '0.4rem 0 0.9rem', fontSize: '0.85rem', color: '#6b7280' }}>
        Systems whose most recent 90th percentile lead result is above
        Michigan&rsquo;s {ACTION_LEVEL_NEW} ppb action level. Click a system to
        see its trend above.
      </p>

      {exceedances.length === 0 ? (
        <p style={{ color: '#16a34a', fontWeight: 600 }}>
          No systems currently exceed the action level.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.4rem 0.75rem 0.4rem 0' }}>Water System</th>
                <th style={{ padding: '0.4rem 0.75rem' }}>County</th>
                <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Latest Result</th>
                <th style={{ padding: '0.4rem 0 0.4rem 0.75rem' }}>Monitoring Period</th>
              </tr>
            </thead>
            <tbody>
              {exceedances.map((s) => (
                <tr key={s.basePwsid} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.45rem 0.75rem 0.45rem 0' }}>
                    <button
                      onClick={() => onSelect?.(s.basePwsid)}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#1d4ed8', fontWeight: 600, cursor: 'pointer',
                        textAlign: 'left', fontSize: 'inherit', fontFamily: 'inherit',
                        textDecoration: 'underline',
                      }}
                    >
                      {titleCase(s.name)}
                    </button>
                  </td>
                  <td style={{ padding: '0.45rem 0.75rem', color: '#374151' }}>
                    {titleCase(s.county || '')}
                  </td>
                  <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      {s.ppb.toLocaleString()} ppb
                    </span>
                    <span style={{ color: '#9ca3af' }}>
                      {' '}/ {actionLevelForYear(s.year)} ppb limit
                    </span>
                  </td>
                  <td style={{ padding: '0.45rem 0 0.45rem 0.75rem', color: '#374151' }}>
                    ending {formatPeriod(s.periodEnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CurrentExceedances;
