import React, { useState, useMemo } from 'react';
import './WaterSystemDirectory.css';
import waterSystemsData from '../data/waterSystemsData';

// Status configuration with colors
const STATUS_CONFIG = {
  'No lead lines': {
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },
  'Not compliant': {
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  'Compliant': {
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  'Inventory not received or incomplete': {
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff'
  },
  '100% replaced': {
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  'No service lines; wholesale only': {
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb'
  },
  'Unknown': {
    color: '#9ca3af',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb'
  }
};

function WaterSystemDirectory({ data = waterSystemsData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExceedances, setFilterExceedances] = useState(false);
  const [filterNoLocation, setFilterNoLocation] = useState(false);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set(data.map(s => s.status));
    return Array.from(statuses).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(system => 
      system.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(system => system.status === filterStatus);
    }
    
    // Filter by exceedances
    if (filterExceedances) {
      filtered = filtered.filter(system => 
        system.exceedance && system.exceedance !== '' && system.exceedance !== '-'
      );
    }
    
    // Filter by no location
    if (filterNoLocation) {
      filtered = filtered.filter(system => 
        !system.latitude || !system.longitude
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      // Handle null/undefined
      if (aVal == null) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
      if (bVal == null) bVal = sortDirection === 'asc' ? Infinity : -Infinity;
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [data, searchTerm, sortField, sortDirection, filterStatus, filterExceedances, filterNoLocation]);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Check if system should show lead line details
  const shouldShowLeadDetails = (system) => {
    return system.status !== 'No lead lines' && 
           system.status !== '100% replaced' &&
           system.status !== 'No service lines; wholesale only';
  };

  // Get status styling
  const getStatusStyle = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Unknown'];
    return config;
  };

  // Get header gradient based on status
  const getHeaderStyle = (status) => {
    switch (status) {
      case 'Inventory not received or incomplete':
        return 'card-header status-incomplete';
      case 'Not compliant':
        return 'card-header status-noncompliant';
      case 'Compliant':
        return 'card-header status-compliant';
      case '100% replaced':
        return 'card-header status-complete';
      case 'No lead lines':
        return 'card-header status-nolead';
      case 'No service lines; wholesale only':
        return 'card-header status-wholesale';
      default:
        return 'card-header';
    }
  };

  return (
    <div className="directory-container">
      <div className="directory-header">
        <h1>Michigan Water System Directory</h1>
        <p>Search and explore lead service line data for water systems across Michigan</p>
      </div>
      
      <div className="search-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by water system name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-select"
            >
              <option value="all">All Statuses</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterExceedances}
              onChange={(e) => setFilterExceedances(e.target.checked)}
            />
            <span>Show only systems with lead action level exceedances</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterNoLocation}
              onChange={(e) => setFilterNoLocation(e.target.checked)}
            />
            <span>Show only systems without map location</span>
          </label>
        </div>
        
        <div className="results-count">
          Showing {filteredAndSortedData.length.toLocaleString()} of {data.length.toLocaleString()} systems
        </div>
      </div>

      {/* Legend */}
      <div className="directory-legend">
        <h4>Status Legend</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #7e22ce, #9333ea)' }}></span>
            <div className="legend-text">
              <strong>Inventory not received or incomplete</strong>
              <span>No complete inventory filed with EGLE</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }}></span>
            <div className="legend-text">
              <strong>Not compliant</strong>
              <span>&lt;20% average replacement, 2021–2024</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}></span>
            <div className="legend-text">
              <strong>Compliant</strong>
              <span>≥20% average replacement, 2021–2024</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #047857, #059669)' }}></span>
            <div className="legend-text">
              <strong>100% replaced</strong>
              <span>All identified lead lines replaced</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}></span>
            <div className="legend-text">
              <strong>No lead lines</strong>
              <span>Inventory completed, no lead lines identified</span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'linear-gradient(135deg, #4b5563, #6b7280)' }}></span>
            <div className="legend-text">
              <strong>No service lines; wholesale only</strong>
              <span>Wholesale water provider with no service lines</span>
            </div>
          </div>
          <div className="legend-item">
            <span style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>⚠️</span>
            <div className="legend-text">
              <strong>Lead Action Level Exceedance</strong>
              <span>Exceeded Michigan lead action level (most recent year shown)</span>
            </div>
          </div>
        </div>
        
        <div className="progress-explainer">
          <h4>Understanding "Progress"</h4>
          <div className="formula-box">
            <code>% Replaced = (Lines Replaced ÷ (Total to Identify and/or Replace+Lines Replaced)) × 100</code>
          </div>
          <p>
            <strong>Note:</strong> We calculate Progress based on % Replaced as described above. Systems with many "Unknown" lines may show low progress even if they've replaced all <em>known</em> lead lines. 
            The unknown lines still need to be identified and potentially replaced, which is why they're included in the denominator.
          </p>
        </div>
      </div>

      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <button 
          className={`sort-btn ${sortField === 'name' ? 'active' : ''}`}
          onClick={() => handleSort('name')}
        >
          Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`sort-btn ${sortField === 'population' ? 'active' : ''}`}
          onClick={() => handleSort('population')}
        >
          Population {sortField === 'population' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`sort-btn ${sortField === 'status' ? 'active' : ''}`}
          onClick={() => handleSort('status')}
        >
          Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`sort-btn ${sortField === 'percentReplaced' ? 'active' : ''}`}
          onClick={() => handleSort('percentReplaced')}
        >
          Progress {sortField === 'percentReplaced' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="systems-grid">
        {filteredAndSortedData.length === 0 ? (
          <div className="no-results">
            <p>No water systems found</p>
            <p className="hint">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredAndSortedData.map((system) => {
            const statusStyle = getStatusStyle(system.status);
            const showDetails = shouldShowLeadDetails(system);
            const hasExceedance = system.exceedance && system.exceedance !== '' && system.exceedance !== '-';
            const hasNoLocation = !system.latitude || !system.longitude;
            
            return (
              <div key={system.pwsid} className="system-card">
                <div className={getHeaderStyle(system.status)}>
                  <h3>{system.name}</h3>
                  <div className="header-badges">
                    {hasExceedance && (
                      <span className="exceedance-badge">
                        ⚠️ LCR Exceedance {String(system.exceedance).replace('.0', '')}
                      </span>
                    )}
                    {hasNoLocation && (
                      <span className="no-location-badge">
                        📍 No map location
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="card-body">
                  {/* Population */}
                  <div className="stat-row">
                    <span className="stat-label">Population Served</span>
                    <span className="stat-value">{system.population.toLocaleString()}</span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="status-section">
                    <span 
                      className="status-badge"
                      style={{
                        color: statusStyle.color,
                        backgroundColor: statusStyle.bgColor,
                        borderColor: statusStyle.borderColor
                      }}
                    >
                      {system.status}
                    </span>
                    <p className="status-explanation">{system.statusExplanation}</p>
                  </div>
                  
                  {/* Lead line details - only show if applicable */}
                  {showDetails && (
                    <div className="lead-details">
                      {system.totalToReplace > 0 && (
                        <div className="stat-row highlight">
                          <span className="stat-label">Progress</span>
                          <span className="stat-value large">{system.percentReplaced.toFixed(1)}%</span>
                        </div>
                      )}
                      
                      <div className="line-counts">
                        {system.leadLines > 0 && (
                          <div className="line-count-item lead">
                            <span className="line-count-value">{system.leadLines.toLocaleString()}</span>
                            <span className="line-count-label">Lead Lines</span>
                          </div>
                        )}
                        {system.gpcl > 0 && (
                          <div className="line-count-item gpcl">
                            <span className="line-count-value">{system.gpcl.toLocaleString()}</span>
                            <span className="line-count-label">GPCL</span>
                          </div>
                        )}
                        {system.unknown > 0 && (
                          <div className="line-count-item unknown">
                            <span className="line-count-value">{system.unknown.toLocaleString()}</span>
                            <span className="line-count-label">Unknown</span>
                          </div>
                        )}
                      </div>
                      
                      {system.totalReplaced > 0 && (
                        <div className="stat-row">
                          <span className="stat-label">Total Replaced (2021-2024)</span>
                          <span className="stat-value">{system.totalReplaced.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Footer with PWSID and EPA link */}
                  <div className="card-footer">
                    <span className="pwsid">PWSID: {system.pwsid}</span>
                    {system.epaLink && (
                      <a 
                        href={system.epaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="epa-link-button"
                      >
                        EPA Report →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WaterSystemDirectory;
