import React, { useState, useMemo } from 'react';
import './RankingTable.css';
import waterSystemsData from '../data/waterSystemsData';

// Status configuration matching other components
const STATUS_CONFIG = {
  'No lead lines': {
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    order: 5
  },
  'Not compliant': {
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    order: 3
  },
  'Compliant': {
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    order: 2
  },
  'Inventory not received or incomplete': {
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    order: 4
  },
  '100% replaced': {
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    order: 1
  },
  'No service lines; wholesale only': {
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    order: 6
  }
};

function RankingTable({ data = waterSystemsData }) {
  const [sortField, setSortField] = useState('leadLines');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('most-lead');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    let filtered;
    
    switch (viewMode) {
      case 'most-lead':
        // Systems with known lead lines
        filtered = [...data].filter(d => d.leadLines > 0);
        break;
      case 'most-unknown':
        // Systems with unknown lines
        filtered = [...data].filter(d => d.unknown > 0);
        break;
      case 'best-progress':
        // Systems that have lines to replace (exclude no-lead, wholesale, incomplete inventory)
        filtered = [...data].filter(d => 
          d.status === 'Compliant' || 
          d.status === '100% replaced' || 
          d.status === 'Not compliant'
        );
        break;
      case 'worst-progress':
        // Only show non-compliant systems that need attention
        filtered = [...data].filter(d => 
          d.status === 'Not compliant'
        );
        break;
      default:
        filtered = [...data].filter(d => d.leadLines > 0);
    }
    
    // Sort based on view mode
    if (viewMode === 'best-progress' && sortField === 'percentReplaced' && sortDirection === 'desc') {
      // Default best-progress sort: 100% replaced first, then by percentReplaced, then by totalReplaced
      filtered.sort((a, b) => {
        // 100% replaced always comes first
        if (a.status === '100% replaced' && b.status !== '100% replaced') return -1;
        if (b.status === '100% replaced' && a.status !== '100% replaced') return 1;
        // Within 100% replaced, sort by totalReplaced descending
        if (a.status === '100% replaced' && b.status === '100% replaced') {
          return b.totalReplaced - a.totalReplaced;
        }
        // Then by percent replaced descending
        if (a.percentReplaced !== b.percentReplaced) {
          return b.percentReplaced - a.percentReplaced;
        }
        // Finally by totalReplaced descending as tie-breaker
        return b.totalReplaced - a.totalReplaced;
      });
    } else if (viewMode === 'worst-progress' && sortField === 'percentReplaced' && sortDirection === 'asc') {
      // Default worst-progress sort: by percent replaced ascending, then by total to replace descending
      filtered.sort((a, b) => {
        // First sort by percent replaced (ascending - worst first)
        if (a.percentReplaced !== b.percentReplaced) {
          return a.percentReplaced - b.percentReplaced;
        }
        // Then by total to replace (descending - biggest problems first)
        return b.totalToReplace - a.totalToReplace;
      });
    } else {
      // Standard sorting for all views when user clicks a column header
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        // Primary sort
        let comparison;
        if (sortDirection === 'asc') {
          comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          comparison = aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        
        // Secondary sort by totalReplaced descending if primary values are equal
        if (comparison === 0) {
          return b.totalReplaced - a.totalReplaced;
        }
        
        return comparison;
      });
    }
    
    return filtered;
  }, [data, sortField, sortDirection, viewMode]);

  // Get status styling
  const getStatusStyle = (status) => {
    return STATUS_CONFIG[status] || { color: '#6b7280', bgColor: '#f9fafb', borderColor: '#e5e7eb' };
  };

  // Only show award badges for "Best Progress" tab
  const getRank = (index) => {
    if (viewMode === 'best-progress') {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
    }
    return index + 1;
  };

  // Format exceedance year (remove .0)
  const formatExceedance = (exceedance) => {
    if (!exceedance || exceedance === '-' || exceedance === '') return null;
    return String(exceedance).replace('.0', '');
  };

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h2>System Rankings</h2>
        <p>Compare lead service line replacement progress across Michigan water systems</p>
      </div>

      <div className="view-controls">
        <button 
          className={`view-btn ${viewMode === 'most-lead' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('most-lead');
            setSortField('leadLines');
            setSortDirection('desc');
          }}
        >
          Most Lead Lines
        </button>
        <button 
          className={`view-btn ${viewMode === 'best-progress' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('best-progress');
            setSortField('percentReplaced');
            setSortDirection('desc');
          }}
        >
          Best Progress
        </button>
        <button 
          className={`view-btn ${viewMode === 'worst-progress' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('worst-progress');
            setSortField('percentReplaced');
            setSortDirection('asc');
          }}
        >
          Needs Attention
        </button>
        <button 
          className={`view-btn ${viewMode === 'most-unknown' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('most-unknown');
            setSortField('unknown');
            setSortDirection('desc');
          }}
        >
          Most Unknown Lines
        </button>
      </div>

      {/* Legend */}
      <div className="table-legend">
        <h4>Status Legend</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#9333ea' }}></span>
            <div className="legend-text">
              <strong>Inventory not received or incomplete</strong>
              <span>No complete inventory filed</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#dc2626' }}></span>
            <div className="legend-text">
              <strong>Not compliant</strong>
              <span>&lt;20% average replacement, 2021–2024</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#16a34a' }}></span>
            <div className="legend-text">
              <strong>Compliant</strong>
              <span>≥20% average replacement, 2021–2024</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#059669' }}></span>
            <div className="legend-text">
              <strong>100% replaced</strong>
              <span>All identified lead lines replaced</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
            <div className="legend-text">
              <strong>No lead lines</strong>
              <span>Inventory completed, no lead lines identified</span>
            </div>
          </div>
          <div className="legend-item exceedance-legend">
            <span className="exceedance-icon">⚠️</span>
            <div className="legend-text">
              <strong>Lead Action Level Exceedance</strong>
              <span>Exceeded Michigan lead action level (most recent year shown)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <th 
                className="sortable" 
                onClick={() => handleSort('name')}
              >
                Water System
                {sortField === 'name' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('population')}
              >
                Population
                {sortField === 'population' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('leadLines')}
              >
                Known Lead
                {sortField === 'leadLines' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('gpcl')}
              >
                GPCL
                {sortField === 'gpcl' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('unknown')}
              >
                Unknown
                {sortField === 'unknown' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('totalReplaced')}
              >
                Replaced
                {sortField === 'totalReplaced' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('totalToReplace')}
              >
                Total to ID/Replace
                {sortField === 'totalToReplace' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="sortable number-col" 
                onClick={() => handleSort('percentReplaced')}
              >
                Progress
                {sortField === 'percentReplaced' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th className="status-col">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((system, index) => {
              const statusStyle = getStatusStyle(system.status);
              const exceedance = formatExceedance(system.exceedance);
              const isTopThree = index < 3 && viewMode === 'best-progress';
              
              return (
                <tr key={system.pwsid} className={isTopThree ? 'top-three' : ''}>
                  <td className="rank-col">
                    <span className="rank-badge">{getRank(index)}</span>
                  </td>
                  <td className="system-name">
                    {system.name}
                    {exceedance && (
                      <span className="exceedance-tag" title={`Exceeded Michigan lead action level in ${exceedance}`}>
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
                  <td className="number-col">
                    <span 
                      className="progress-badge"
                      style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.bgColor,
                        borderColor: statusStyle.borderColor
                      }}
                    >
                      {system.status === '100% replaced' ? '100.0' : system.percentReplaced.toFixed(1)}%
                    </span>
                  </td>
                  <td className="status-col">
                    <div className="status-cell">
                      <span 
                        className="status-dot"
                        style={{ backgroundColor: statusStyle.color }}
                      ></span>
                      <span className="status-text">{system.status}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <p className="results-count">Showing {sortedData.length.toLocaleString()} water systems</p>
        <p className="filter-explanation">
          {viewMode === 'most-lead' && (
            <>This view shows only systems with identified lead service lines.</>
          )}
          {viewMode === 'most-unknown' && (
            <>This view shows only systems with service lines of unknown material that still need to be identified.</>
          )}
          {viewMode === 'best-progress' && (
            <>This view shows systems actively replacing lead lines (Compliant, Not Compliant, or 100% Replaced). Systems with no lead lines, incomplete inventories, or wholesale-only operations are excluded.</>
          )}
          {viewMode === 'worst-progress' && (
            <>This view shows only non-compliant systems (&lt;20% average replacement), sorted by lowest progress first. These are the systems that need the most attention.</>
          )}
        </p>
        <p className="filter-explanation" style={{ marginTop: '10px' }}>
          If the water utility you are looking for is not listed here, look them up on the <strong>Search Systems</strong> page.
        </p>
      </div>
    </div>
  );
}

export default RankingTable;
