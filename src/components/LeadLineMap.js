import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import waterSystemsData from '../data/waterSystemsData';
import './LeadLineMap.css';

// Status configuration with colors and descriptions
const STATUS_CONFIG = {
  'No lead lines': {
    color: '#3b82f6',      // Blue
    description: 'Inventory completed, no lead lines identified'
  },
  'Not compliant': {
    color: '#dc2626',      // Red
    description: '<20% average replacement, 2021–2024'
  },
  'Compliant': {
    color: '#16a34a',      // Green
    description: '≥20% average replacement, 2021–2024'
  },
  'Inventory not received or incomplete': {
    color: '#9333ea',      // Purple
    description: 'No complete inventory filed'
  },
  '100% replaced': {
    color: '#059669',      // Emerald (darker green)
    description: 'All lead lines replaced'
  },
  'No service lines; wholesale only': {
    color: '#6b7280',      // Gray
    description: 'Wholesale water provider, no service lines'
  },
  'Unknown': {
    color: '#9ca3af',      // Light gray
    description: 'Status unknown'
  }
};

function LeadLineMap() {
  // Filter states for each status category
  const [filters, setFilters] = useState({
    'Inventory not received or incomplete': true,
    'No lead lines': true,
    'Compliant': true,
    '100% replaced': true,
    'Not compliant': true,
    'No service lines; wholesale only': true
  });

  // Filter systems with coordinates
  const systemsWithCoords = waterSystemsData.filter(
    system => system.latitude && system.longitude
  );

  // Count systems by status
  const statusCounts = {};
  systemsWithCoords.forEach(system => {
    const status = system.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Filter systems based on selected statuses
  const filteredSystems = systemsWithCoords.filter(system => {
    const status = system.status || 'Unknown';
    return filters[status] !== false;
  });

  // Get marker color based on status
  const getMarkerColor = (system) => {
    const status = system.status || 'Unknown';
    return STATUS_CONFIG[status]?.color || STATUS_CONFIG['Unknown'].color;
  };

  // Calculate marker radius based on total lines to replace
  const getMarkerRadius = (system) => {
    // For non-filers or systems with no data, use a fixed size
    if (system.status === 'Inventory not received or incomplete' || 
        system.status === 'No service lines; wholesale only') {
      return 6;
    }
    // For systems with no lead lines, use small fixed size
    if (system.totalToReplace === 0) return 5;
    // Scale radius: sqrt for better visual proportion
    const baseRadius = Math.sqrt(system.totalToReplace) / 5;
    return Math.max(baseRadius, 4); // Minimum 4px radius
  };

  // Toggle filter for a status
  const toggleFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Order of statuses for display (most concerning first)
  const statusOrder = [
    'Inventory not received or incomplete',
    'Not compliant',
    'Compliant',
    '100% replaced',
    'No lead lines',
    'No service lines; wholesale only'
  ];

  return (
    <div className="map-container">
      <h2>Geographic Distribution of Lead Service Line Replacement Compliance in Michigan</h2>
      <p className="map-subtitle">
        Showing {filteredSystems.length.toLocaleString()} of {systemsWithCoords.length.toLocaleString()} water systems with location data
      </p>

      {/* Filter Controls */}
      <div className="map-controls">
        {statusOrder.map(status => (
          <label key={status}>
            <input
              type="checkbox"
              checked={filters[status]}
              onChange={() => toggleFilter(status)}
            />
            <span 
              className="status-label"
              style={{ color: STATUS_CONFIG[status].color }}
            >
              ● {status} ({statusCounts[status] || 0})
            </span>
          </label>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={[44.3148, -85.6024]} // Center of Michigan
        zoom={7}
        style={{ height: '600px', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Base map tiles from OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Water system markers */}
        {filteredSystems.map((system) => (
          <CircleMarker
            key={system.pwsid}
            center={[system.latitude, system.longitude]}
            radius={getMarkerRadius(system)}
            fillColor={getMarkerColor(system)}
            fillOpacity={0.6}
            color="#ffffff"
            weight={2}
          >
            <Popup>
              <div className="map-popup">
                <h3>{system.name}</h3>
                <div className="popup-stats">
                  <p><strong>PWSID:</strong> {system.pwsid}</p>
                  <p><strong>Population:</strong> {system.population.toLocaleString()}</p>
                  
                  {system.status !== 'Inventory not received or incomplete' && 
                   system.status !== 'No service lines; wholesale only' && (
                    <>
                      <p><strong>Lead Lines:</strong> {system.leadLines.toLocaleString()}</p>
                      <p><strong>Total to Replace:</strong> {system.totalToReplace.toLocaleString()}</p>
                      <p><strong>Replaced:</strong> {system.totalReplaced.toLocaleString()}</p>
                      {system.totalToReplace > 0 && (
                        <p><strong>Progress:</strong> {system.percentReplaced.toFixed(1)}%</p>
                      )}
                    </>
                  )}
                  
                  {system.status === 'Inventory not received or incomplete' && (
                    <p className="status-warning inventory-warning">
                      <strong>⚠️ No complete inventory filed</strong>
                    </p>
                  )}
                  
                  {system.status === 'No service lines; wholesale only' && (
                    <p className="status-info">
                      <strong>ℹ️ Wholesale provider - no service lines</strong>
                    </p>
                  )}
                  
                  <p>
                    <strong>Status:</strong>{' '}
                    <span style={{ 
                      color: getMarkerColor(system),
                      fontWeight: 'bold'
                    }}>
                      {system.status}
                    </span>
                  </p>
                  
                  {system.exceedance && system.exceedance !== '-' && system.exceedance !== '' && (
                    <p><strong>LCR Exceedance:</strong> {system.exceedance}</p>
                  )}
                  
                  {system.epaLink && (
                    <p className="epa-link">
                      <a 
                        href={system.epaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="epa-link-button"
                      >
                        View EPA Facility Report →
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <h4>Legend</h4>
        <table className="legend-table">
          <thead>
            <tr>
              <th></th>
              <th>Status</th>
              <th>Count</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {statusOrder.map(status => (
              <tr key={status}>
                <td>
                  <span 
                    className="legend-circle"
                    style={{ backgroundColor: STATUS_CONFIG[status].color }}
                  ></span>
                </td>
                <td className="legend-status">{status}</td>
                <td className="legend-count">{statusCounts[status] || 0}</td>
                <td className="legend-description">{STATUS_CONFIG[status].description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="legend-note">
          <em>Circle size = Total lines to be identified or replaced</em>
        </p>
      </div>

      {/* Info Box */}
      <div className="map-info">
        <p>
          <strong>Note:</strong> This map shows {systemsWithCoords.length.toLocaleString()} water systems 
          ({(systemsWithCoords.length / waterSystemsData.length * 100).toFixed(1)}% of all Michigan systems) 
          with verified location data from EPA community water system boundaries. Click on any circle to see detailed information and access the EPA facility report.
        </p>
      </div>
    </div>
  );
}

export default LeadLineMap;
