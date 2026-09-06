// =====================================================
// SAFEREACH - LOCATION SERVICES
// BROWSER GPS + DEFAULT COORDINATES FALLBACK
// =====================================================

// Default Bhubaneswar coordinates for emergency center & fallback
const DEFAULT_LOCATION = {
  lat: 20.2961,
  lng: 85.8245,
  accuracy: 15
};

let userLocation = null;
window.userLocation = null;
window.currentLocation = null;

function detectLocation(success, failure) {
  if (!navigator.geolocation) {
    userLocation = { ...DEFAULT_LOCATION };
    window.userLocation = userLocation;
    window.currentLocation = userLocation;
    failure?.("Geolocation not supported. Using Bhubaneswar reference coordinates.");
    success?.(userLocation);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: Number(pos.coords.latitude),
        lng: Number(pos.coords.longitude),
        accuracy: Math.round(pos.coords.accuracy || 10)
      };
      
      // Globally expose for Sweta's GIS map & Swadhin's forms
      window.userLocation = userLocation;
      window.currentLocation = userLocation;

      success?.(userLocation);
    },
    (err) => {
      // Graceful fallback to default command zone coordinates
      userLocation = { ...DEFAULT_LOCATION };
      window.userLocation = userLocation;
      window.currentLocation = userLocation;

      console.warn("GPS access denied or unavailable. Fallback to default location:", err.message);
      failure?.("GPS permission denied. Set to Bhubaneswar zone.");
      success?.(userLocation);
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000
    }
  );
}

function locationText(loc) {
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
    return "Location unavailable";
  }
  const acc = loc.accuracy ? ` (±${loc.accuracy}m)` : "";
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}${acc}`;
}

// Auto-run detection on script load to pre-populate coordinates
detectLocation();