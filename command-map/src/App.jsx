import React, { useState, useEffect } from 'react';
import MapDashboard from './MapDashboard';
import Sidebar from './Sidebar';
import { supabase } from './supabaseClient';

// Helper to decode PostGIS Hex EWKB POINT strings (0101000020E6100000...)
const parsePostGISHexPoint = (hex) => {
  if (typeof hex !== 'string' || !hex.startsWith('0101000020E6100000')) {
    return null;
  }
  try {
    const lngHex = hex.substring(18, 34);
    const latHex = hex.substring(34, 50);

    const hexToDouble = (hexStr) => {
      const match = hexStr.match(/../g);
      if (!match) return null;
      const bytes = new Uint8Array(match.map((b) => parseInt(b, 16)));
      return new DataView(bytes.buffer).getFloat64(0, true);
    };

    return {
      lng: hexToDouble(lngHex),
      lat: hexToDouble(latHex),
    };
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Convert incident location into Leaflet-friendly lat/lng
  const formatIncident = (item) => {
    let lat = null;
    let lng = null;

    let loc = item.location;

    // 1. Handle PostGIS Hex EWKB String from Supabase geometry type
    if (typeof loc === 'string' && loc.startsWith('0101000020E6100000')) {
      const coords = parsePostGISHexPoint(loc);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }
    // 2. Handle stringified JSON
    else if (typeof loc === 'string') {
      try {
        loc = JSON.parse(loc);
      } catch (e) {
        const match = loc.match(/POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }
    }

    // 3. Handle GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
    if (lat == null && lng == null) {
      if (loc?.coordinates && Array.isArray(loc.coordinates)) {
        lng = loc.coordinates[0];
        lat = loc.coordinates[1];
      }
      // 4. Handle object format: { lat, lng }
      else if (loc?.lat != null && loc?.lng != null) {
        lat = loc.lat;
        lng = loc.lng;
      }
      // 5. Direct column fallbacks
      else {
        lat = item.lat ?? item.latitude;
        lng = item.lng ?? item.longitude;
      }
    }

    return {
      ...item,
      lat: Number(lat),
      lng: Number(lng),
    };
  };

  // 1. Fetch from Supabase
  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error.message);
      return;
    }

    if (data && data.length > 0) {
      setIncidents(data.map(formatIncident));
    }
  };

  useEffect(() => {
    // Fetch data right away on load
    fetchIncidents();

    // Realtime listener
    const channel = supabase
      .channel('realtime_incidents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('Realtime change detected:', payload);
          fetchIncidents();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Realtime!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update status from sidebar
  const handleUpdateStatus = async (incidentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incidentId);

      if (error) throw error;

      // Update incident list state immediately
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
      );

      // Update sidebar state
      setSelectedIncident((prev) => (prev?.id === incidentId ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error('Failed to update status:', err.message);
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <MapDashboard
        incidents={incidents}
        onSelectIncident={setSelectedIncident}
        selectedIncident={selectedIncident}
      />
      <Sidebar
        selectedIncident={selectedIncident}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}