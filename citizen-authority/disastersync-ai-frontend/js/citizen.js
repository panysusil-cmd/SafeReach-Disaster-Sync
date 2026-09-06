// =====================================================
// SAFEREACH - CITIZEN.JS
// COMPLETE CONTROLLER (SOS + FORM + SUPABASE + OFFLINE)
// =====================================================

// 1. SUPABASE CONNECTION (Shared Team Database)
const SUPABASE_URL = "https://pihjynkvwwrgvbxkyosj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGp5bmt2d3dyZ3ZieGt5b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDU0MTIsImV4cCI6MjEwMzk4MTQxMn0.hYtT1t8kb7gsKqWqIb1VMm6WlTwwHwtPOoqDyv7HFtM"
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// 2. TOAST NOTIFICATIONS
const toastEl = document.getElementById("toast");

function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3500);
}

// 3. OFFLINE STORAGE QUEUE & AUTO-SYNC
const OFFLINE_KEY = "safereach_offline_incidents";

function queueOffline(payload) {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  queue.push(payload);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

async function syncOfflineQueue() {
  if (!navigator.onLine || !supabaseClient) return;

  const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  if (queue.length === 0) return;

  for (const item of queue) {
    await supabaseClient.from("incidents").insert([item]);
  }

  localStorage.removeItem(OFFLINE_KEY);
  toast("🔄 Back online! All offline incidents synced with Command Center.");
  await renderRequests();
  await updateStats();
}

window.addEventListener("online", syncOfflineQueue);

// 4. CORE INCIDENT POSTING (SUPABASE + OFFLINE BACKUP)
async function sendToDatabase(incidentData) {
  const payload = {
    request_type: incidentData.request_type || convertRequestType(incidentData.type),
    people_affected: Number(incidentData.people || 1),
    description: incidentData.description || "Emergency assistance requested",
    severity: (incidentData.severity || "high").toLowerCase(),
    latitude: Number(incidentData.lat) || 20.2961,
    longitude: Number(incidentData.lng) || 85.8245,
    status: "pending",
    created_at: new Date().toISOString()
  };

  if (!navigator.onLine || !supabaseClient) {
    queueOffline(payload);
    toast("📶 Network offline: Saved locally. Will auto-sync when reconnected!");
    return { offline: true };
  }

  try {
    const { data, error } = await supabaseClient
      .from("incidents")
      .insert([payload])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn("Direct post failed, queuing offline:", err);
    queueOffline(payload);
    toast("⚠️ Network delay: Queued offline. Syncing automatically.");
    return { offline: true };
  }
}

// 5. FETCH INCIDENTS (DATABASE + LOCAL CACHE)
async function loadIncidents() {
  let list = [];

  if (supabaseClient && navigator.onLine) {
    try {
      const { data, error } = await supabaseClient
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) list = data;
    } catch (e) {
      console.warn("Error loading from Supabase:", e);
    }
  }

  const offlineItems = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  return [...offlineItems, ...list];
}

// 6. ENUM CONVERSION
function convertRequestType(type) {
  if (!type) return "general_assistance";
  const t = type.toLowerCase().trim();
  if (t.includes("sos")) return "sos";
  if (t.includes("rescue")) return "rescue";
  if (t.includes("med")) return "medical";
  if (t.includes("food") || t.includes("water")) return "food_water_medicine";
  return "general_assistance";
}

// 7. TAB NAVIGATION
function showSection(id) {
  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === id);
  });

  document.querySelectorAll(".sidebar .nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === id);
  });

  if (id === "map") {
    setTimeout(() => {
      if (typeof createMap !== "function") return;
      const map = createMap("citizenMap");
      if (map) {
        map.invalidateSize();
        if (typeof getData === "function" && typeof addSituationMarkers === "function") {
          addSituationMarkers(map, getData());
        }
        if (typeof userLocation !== "undefined" && userLocation && typeof addUserMarker === "function") {
          addUserMarker(map, userLocation);
        }
      }
    }, 100);
  }

  if (id === "shelters") renderShelters();
  if (id === "requests") renderRequests();
}

document.querySelectorAll("[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

// 8. GEOLOCATION UI
function refreshLocationUI() {
  if (typeof detectLocation !== "function") return;

  detectLocation(
    (loc) => {
      const citizenLoc = document.getElementById("citizenLocation");
      const statLoc = document.getElementById("statLocation");
      const sosLoc = document.getElementById("sosLocation");
      const repLoc = document.getElementById("reportLocation");

      if (citizenLoc) citizenLoc.textContent = "📍 GPS active";
      if (statLoc) statLoc.textContent = "Active";
      if (sosLoc && typeof locationText === "function") sosLoc.textContent = locationText(loc);
      if (repLoc && typeof locationText === "function") repLoc.textContent = locationText(loc);
    },
    () => {
      const citizenLoc = document.getElementById("citizenLocation");
      const statLoc = document.getElementById("statLocation");
      if (citizenLoc) citizenLoc.textContent = "📍 GPS unavailable";
      if (statLoc) statLoc.textContent = "Unavailable";
    }
  );
}

// 9. EMERGENCY SOS (HERO + SOS TAB)
async function triggerEmergencySOS() {
  const sendBtn = document.getElementById("sendSos");
  if (sendBtn) sendBtn.disabled = true;

  const loc = (typeof userLocation !== "undefined" && userLocation) ? userLocation : { lat: 20.2961, lng: 85.8245 };

  const sosData = {
    type: "SOS",
    request_type: "sos",
    people: 1,
    severity: "critical",
    lat: loc.lat,
    lng: loc.lng,
    description: "🚨 IMMEDIATE EMERGENCY SOS BROADCAST TRIGGERED BY CITIZEN"
  };

  const res = await sendToDatabase(sosData);
  if (sendBtn) sendBtn.disabled = false;

  if (res && !res.offline) {
    toast("🚨 SOS Broadcasted! Central Command & Field Responders notified.");
  }

  showSection("requests");
  await renderRequests();
  await updateStats();
}

// 10. INCIDENT REPORTING FORM SUBMISSION
function setupForm() {
  const incidentForm = document.getElementById("incidentForm");
  if (!incidentForm) return;

  incidentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = incidentForm.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    const type = document.getElementById("incidentType").value;
    const people = Number(document.getElementById("peopleAffected").value) || 1;
    const severity = document.getElementById("severity").value;
    const desc = document.getElementById("description").value;
    const loc = (typeof userLocation !== "undefined" && userLocation) ? userLocation : { lat: 20.2961, lng: 85.8245 };

    const incidentData = {
      type: type,
      request_type: convertRequestType(type),
      people: people,
      severity: severity,
      lat: loc.lat,
      lng: loc.lng,
      description: desc
    };

    const res = await sendToDatabase(incidentData);
    if (submitBtn) submitBtn.disabled = false;

    if (res && !res.offline) {
      toast("✅ Incident report submitted to Command Center!");
    }

    incidentForm.reset();
    const peopleInput = document.getElementById("peopleAffected");
    if (peopleInput) peopleInput.value = 1;

    showSection("requests");
    await renderRequests();
    await updateStats();
  });
}

// 11. RENDER SHELTERS
function renderShelters() {
  const box = document.getElementById("shelterList");
  if (!box) return;

  const demoShelters = [
    { name: "Kalinga Stadium Relief Camp", area: "Central Zone", capacity: 500, occupied: 380, wash: "Normal" },
    { name: "Unit-8 Community Centre", area: "West Zone", capacity: 200, occupied: 195, wash: "Restricted Water" },
    { name: "Saheed Nagar High School", area: "East Zone", capacity: 300, occupied: 80, wash: "Normal" }
  ];

  box.innerHTML = demoShelters.map((s) => {
    const pct = Math.round((s.occupied / s.capacity) * 100);
    const available = s.capacity - s.occupied;
    const badgeClass = pct > 85 ? "danger" : pct > 60 ? "warning" : "info";

    return `
      <article class="card shelter-card">
        <span class="badge ${badgeClass}">${pct > 85 ? "NEAR CAPACITY" : "AVAILABLE"}</span>
        <h3>🏠 ${s.name}</h3>
        <p>📍 ${s.area}</p>
        <div class="capacity">${s.occupied} / ${s.capacity} occupied • ${available} spaces</div>
        <div class="capacity-bar"><i style="width:${pct}%; background:${pct > 85 ? '#d92d3b' : '#148a55'}"></i></div>
        <p style="margin-top:8px;"><b>WASH:</b> <span class="badge ${s.wash === 'Normal' ? 'info' : 'danger'}">${s.wash}</span></p>
      </article>
    `;
  }).join("");
}

// 12. RENDER MY REQUESTS LIST
async function renderRequests() {
  const box = document.getElementById("requestList");
  if (!box) return;

  const data = await loadIncidents();

  if (!data || data.length === 0) {
    box.innerHTML = `
      <div class="card">
        <h3>No requests yet</h3>
        <p style="color:var(--muted); margin-top:5px;">Your SOS broadcasts and incident reports will appear here.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = data.map((inc) => {
    const lat = Number(inc.latitude || inc.lat || 0).toFixed(4);
    const lng = Number(inc.longitude || inc.lng || 0).toFixed(4);
    const status = inc.status || "pending";

    return `
      <article class="card request-card" style="margin-bottom: 12px;">
        <div>
          <b>INC-${inc.id || "OFFLINE"}</b>
          <h3>${(inc.request_type || inc.type || "SOS").replace(/_/g, " ").toUpperCase()}</h3>
          <small>📍 ${lat !== "0.0000" ? `${lat}, ${lng}` : "Location cached"}</small>
          <p style="margin: 6px 0; color: var(--muted);">${inc.description || ""}</p>
          <small>People affected: ${inc.people_affected || inc.people || 1}</small>
        </div>
        <span class="status ${status}">${status.toUpperCase()}</span>
      </article>
    `;
  }).join("");
}

// 13. UPDATE STATS COUNTER
async function updateStats() {
  const statRequests = document.getElementById("statRequests");
  if (!statRequests) return;
  const data = await loadIncidents();
  statRequests.textContent = data.length;
}

// 14. INITIALIZE ON DOM LOAD
document.addEventListener("DOMContentLoaded", async () => {
  setupForm();
  refreshLocationUI();

  // Attach SOS action buttons
  const sendSosBtn = document.getElementById("sendSos");
  if (sendSosBtn) sendSosBtn.addEventListener("click", triggerEmergencySOS);

  const heroSosBtn = document.getElementById("heroSos");
  if (heroSosBtn) heroSosBtn.addEventListener("click", () => showSection("sos"));

  const refreshLocBtn = document.getElementById("refreshLocation");
  if (refreshLocBtn) refreshLocBtn.addEventListener("click", refreshLocationUI);

  await syncOfflineQueue();
  await renderRequests();
  await updateStats();
});