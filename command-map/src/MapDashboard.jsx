import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (priorityScore, status) => {
  let color = '#22c55e'; // Green (Low/Resolved)
  if (status === 'completed') {
    color = '#64748b'; // Greyed out if completed
  } else if (priorityScore >= 80) {
    color = '#ef4444'; // Red (Critical)
  } else if (priorityScore >= 50) {
    color = '#f59e0b'; // Amber (Medium)
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
      <circle cx="12" cy="12" r="9" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
      <circle cx="12" cy="12" r="3" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    html: svgMarker,
    className: 'custom-map-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const defaultCenter = [20.2961, 85.8245]; // Default center: Bhubaneswar

export default function MapDashboard({ incidents = [], onSelectIncident }) {
  const [filter, setFilter] = useState('ALL');

const filteredIncidents = incidents.filter((inc) => {
    const isCompleted = inc.status === 'completed' || inc.status === 'resolved';
    const isCritical = (inc.priority_score >= 80) || (inc.severity_score >= 80) || (inc.severity === 'critical') || (inc.request_type === 'SOS');

    if (filter === 'CRITICAL') return isCritical && !isCompleted;
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true; // 'ALL'
  });
  return (
    <div style={{ width: '70vw', height: '100vh', position: 'relative' }}>
      {/* Top Filter Bar */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 60,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          padding: '6px 10px',
          borderRadius: '8px',
          display: 'flex',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {['ALL', 'CRITICAL', 'ACTIVE', 'COMPLETED'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={{
              background: filter === item ? '#3b82f6' : 'transparent',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <MapContainer center={defaultCenter} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredIncidents.map((inc) => {
          // Robust coordinate parsing
          const lat = Number(inc.lat ?? inc.latitude);
          const lng = Number(inc.lng ?? inc.longitude);

          // Skip incidents with invalid coordinates or zero-coords
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
            return null;
          }

          return (
            <Marker
              key={inc.id || Math.random()}
              position={[lat, lng]}
              icon={createCustomIcon(inc.priority_score ?? 0, inc.status)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(inc),
              }}
            >
              <Popup>
                <strong>{inc.title || 'Emergency Incident'}</strong>
                <br />
                Priority: {inc.priority_score ?? 'N/A'} | Status: {inc.status}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}