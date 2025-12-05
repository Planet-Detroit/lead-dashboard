import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import waterSystemsData from '../data/waterSystemsData';
import './EmbedMap.css';

// Status configuration with colors and descriptions
const STATUS_CONFIG = {
  'No lead lines': {
    color: '#3b82f6',
    description: 'Inventory completed, no lead lines identified'
  },
  'Not compliant': {
    color: '#dc2626',
    description: '<20% average replacement, 2021–2024'
  },
  'Compliant': {
    color: '#16a34a',
    description: '≥20% average replacement, 2021–2024'
  },
  'Inventory not received or incomplete': {
    color: '#9333ea',
    description: 'No complete inventory filed'
  },
  '100% replaced': {
    color: '#059669',
    description: 'All lead lines replaced'
  },
  'Unknown': {
    color: '#9ca3af',
    description: 'Status unknown'
  }
};

function EmbedMap() {
  const [filters, setFilters] = useState({
    'Inventory not received or incomplete': true,
    'No lead lines': true,
    'Compliant': true,
    '100% replaced': true,
    'Not compliant': true
  });

  // Filter systems with coordinates (excluding wholesale-only systems)
  const systemsWithCoords = waterSystemsData.filter(
    system => system.latitude && system.longitude && 
              system.status !== 'No service lines; wholesale only'
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

  const getMarkerColor = (system) => {
    const status = system.status || 'Unknown';
    return STATUS_CONFIG[status]?.color || STATUS_CONFIG['Unknown'].color;
  };

  const getMarkerRadius = (system) => {
    if (system.status === 'Inventory not received or incomplete') {
      return 6;
    }
    if (system.totalToReplace === 0) return 5;
    const baseRadius = Math.sqrt(system.totalToReplace) / 5;
    return Math.max(baseRadius, 4);
  };

  const toggleFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const statusOrder = [
    'Inventory not received or incomplete',
    'Not compliant',
    'Compliant',
    '100% replaced',
    'No lead lines'
  ];

  return (
    <div className="embed-container">
      {/* Compact Filter Controls */}
      <div className="embed-controls">
        {statusOrder.map(status => (
          <label key={status} className="embed-filter">
            <input
              type="checkbox"
              checked={filters[status]}
              onChange={() => toggleFilter(status)}
            />
            <span style={{ color: STATUS_CONFIG[status].color }}>
              ● {status} ({statusCounts[status] || 0})
            </span>
          </label>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={[44.3148, -85.6024]}
        zoom={7}
        style={{ height: 'calc(100vh - 140px)', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
              <div className="embed-popup">
                <h3>{system.name}</h3>
                <p><strong>PWSID:</strong> {system.pwsid}</p>
                <p><strong>Population:</strong> {system.population.toLocaleString()}</p>
                {system.status !== 'Inventory not received or incomplete' && (
                  <>
                    <p><strong>Lead Lines:</strong> {system.leadLines.toLocaleString()}</p>
                    <p><strong>Total to Replace:</strong> {system.totalToReplace.toLocaleString()}</p>
                    <p><strong>Replaced:</strong> {system.totalReplaced.toLocaleString()}</p>
                    {system.totalToReplace > 0 && (
                      <p><strong>Progress:</strong> {system.percentReplaced.toFixed(1)}%</p>
                    )}
                  </>
                )}
                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: getMarkerColor(system), fontWeight: 'bold' }}>
                    {system.status}
                  </span>
                </p>
                {system.epaLink && (
                  <p>
                    <a href={system.epaLink} target="_blank" rel="noopener noreferrer">
                      View EPA Report →
                    </a>
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Compact Legend */}
      <div className="embed-legend">
        {statusOrder.map(status => (
          <div key={status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: STATUS_CONFIG[status].color }}></span>
            <span className="legend-label">{status}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-note">Circle size = lines to replace</span>
        </div>
        <a href="https://planetdetroit.github.io/michigan-lead-dashboard/" target="_blank" rel="noopener noreferrer" className="embed-credit">
          Full Dashboard →
        </a>
      </div>
    </div>
  );
}

export default EmbedMap;
