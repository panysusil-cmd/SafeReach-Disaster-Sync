// =====================================================
// SAFEREACH - MAP CONTROLLER
// LEAFLET MAPS + LIVE SITUATION MARKERS + DISPATCH
// =====================================================

const mapInstances = {};
const markerLayers = {};

function createMap(elementId, center = [20.2961, 85.8245], zoom = 12) {
  if (!window.L || !document.getElementById(elementId)) return null;

  // If already initialized, return instance
  if (mapInstances[elementId]) {
    mapInstances[elementId].invalidateSize();
    return mapInstances[elementId];
  }

  const map = L.map(elementId).setView(center, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap • SafeReach"
  }).addTo(map);

  // Dedicated layer group for dynamically added incident/shelter pins
  markerLayers[elementId] = L.layerGroup().addTo(map);
  mapInstances[elementId] = map;

  if (elementId === 'citizenMap') {
    window.citizenMapInstance = map;
  }

  return map;
}

// Add Situation Markers (Incidents + Evacuation Shelters)
function addSituationMarkers(map, data, includeShelters = true) {
  if (!map) return;

  const elementId = Object.keys(mapInstances).find(key => mapInstances[key] === map);
  if (elementId && markerLayers[elementId]) {
    markerLayers[elementId].clearLayers();
  }

  const targetGroup = (elementId && markerLayers[elementId]) ? markerLayers[elementId] : map;

  // 1. Incidents Layer
  if (data && Array.isArray(data.incidents)) {
    data.incidents.forEach((i) => {
      // Coordinate extract fallback (Supabase column variations)
      const lat = Number(i.latitude ?? i.lat ?? (i.location?.lat));
      const lng = Number(i.longitude ?? i.lng ?? (i.location?.lng));

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const score = Number(i.priority_score ?? i.score ?? 70);
      const color = score >= 80 ? "#ef4444" : score >= 55 ? "#f59e0b" : "#10b981";
      const type = (i.request_type || i.type || "Emergency").replace(/_/g, " ").toUpperCase();
      const status = (i.status || "pending").toUpperCase();
      const people = i.people_affected || i.people || 1;

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 170px;">
          <b style="color: ${color}; font-size: 13px;">${type}</b>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Status: <b>${status}</b></div>
          <p style="margin: 4px 0; font-size: 12px;">${i.description || "Assistance needed"}</p>
          <div style="font-size: 11px; margin-top: 4px;">👥 People affected: <b>${people}</b></div>
          ${
            elementId === "authorityMap" && status !== "RESOLVED"
              ? `<button style="margin-top:8px; width:100%; background:#2457d6; color:#fff; border:0; padding:6px 8px; border-radius:6px; font-weight:700; cursor:pointer;" onclick="dispatchFromMap('${i.id}')">🚨 Dispatch Unit</button>`
              : ""
          }
        </div>
      `;

      L.circleMarker([lat, lng], {
        radius: 9,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2
      })
        .addTo(targetGroup)
        .bindPopup(popupContent);
    });
  }

  // 2. Safe Shelters Layer
  if (includeShelters && data && Array.isArray(data.shelters)) {
    data.shelters.forEach((s) => {
      const lat = Number(s.latitude ?? s.lat ?? (s.location?.lat));
      const lng = Number(s.longitude ?? s.lng ?? (s.location?.lng));

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const occ = s.current_occupancy ?? s.occupied ?? 180;
      const cap = s.capacity ?? s.max_capacity ?? 500;
      const pct = Math.round((occ / cap) * 100);

      const shelterPopup = `
        <div style="font-family: sans-serif;">
          <b style="font-size: 13px; color:#148a55;">🏠 ${s.name}</b>
          <div style="font-size: 11px; margin-top: 4px;">Occupancy: <b>${occ} / ${cap} (${pct}%)</b></div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">WASH: ${s.wash_status || s.wash || "Adequate"}</div>
        </div>
      `;

      L.marker([lat, lng])
        .addTo(targetGroup)
        .bindPopup(shelterPopup);
    });
  }
}

// Add / Update User GPS Location Pin
function addUserMarker(map, loc) {
  if (!map || !loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return;
  map.setView([loc.lat, loc.lng], 14);

  const userIcon = L.divIcon({
    className: "custom-user-pin",
    html: `<div style="background:#2457d6; width:14px; height:14px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  L.marker([loc.lat, loc.lng], { icon: userIcon })
    .addTo(map)
    .bindPopup("<b>📍 Your Detected Location</b>")
    .openPopup();
}

// Global hook for Map popup dispatch action
window.dispatchFromMap = function(incidentId) {
  if (typeof window.handleDispatchIncident === 'function') {
    window.handleDispatchIncident(incidentId);
  } else {
    alert(`Dispatched emergency response unit to incident #${incidentId}`);
  }
};