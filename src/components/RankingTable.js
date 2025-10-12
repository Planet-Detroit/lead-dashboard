import React, { useState, useMemo } from 'react';
import './RankingTable.css';
import waterSystemsData from '../data/waterSystemsData';

function RankingTable({ data = waterSystemsData }) {
  const [sortField, setSortField] = useState('leadLines');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('most-lead');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      if (field === 'percentReplaced') {
        setSortDirection('desc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  const sortedData = useMemo(() => {
    let filtered = [...data].filter(d => d.leadLines > 0);
    
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [data, sortField, sortDirection]);

  const getProgressClass = (percent) => {
    if (percent >= 50) return 'good';
    if (percent >= 25) return 'fair';
    if (percent >= 10) return 'poor';
    return 'critical';
  };

  const getRank = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
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
      </div>

      <div className="table-legend">
        <div className="legend-title">Progress Status:</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="status-indicator good"></div>
            <span>Good (≥50%)</span>
          </div>
          <div className="legend-item">
            <div className="status-indicator fair"></div>
            <span>Fair (25-49%)</span>
          </div>
          <div className="legend-item">
            <div className="status-indicator poor"></div>
            <span>Poor (10-24%)</span>
          </div>
          <div className="legend-item">
            <div className="status-indicator critical"></div>
            <span>Critical (&lt;10%)</span>
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
                Lead Lines
                {sortField === 'leadLines' && (
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
                onClick={() => handleSort('percentReplaced')}
              >
                Progress
                {sortField === 'percentReplaced' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th className="number-col">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((system, index) => (
              <tr key={index} className={index < 3 ? 'top-three' : ''}>
                <td className="rank-col">
                  <span className="rank-badge">{getRank(index)}</span>
                </td>
                <td className="system-name">
                  {system.name}
                  {system.exceedance && system.exceedance !== '-' && (
                    <span className="exceedance-tag" title={`Exceeded in ${system.exceedance}`}>
                      ⚠️
                    </span>
                  )}
                </td>
                <td className="number-col">{system.population.toLocaleString()}</td>
                <td className="number-col lead-count">{system.leadLines.toLocaleString()}</td>
                <td className="number-col">{system.totalReplaced.toLocaleString()}</td>
                <td className="number-col">
                  <div className="progress-cell">
                    <span className={`progress-badge ${getProgressClass(system.percentReplaced)}`}>
                      {system.percentReplaced.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="number-col">
                  <div className="status-indicator-wrapper">
                    <div className={`status-indicator ${getProgressClass(system.percentReplaced)}`}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RankingTable;