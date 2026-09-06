// =====================================================
// SAFEREACH - AUTHORITY COMMAND DASHBOARD CONTROLLER
// SUPABASE REALTIME + LIVE DISPATCH + GIS SYNC
// =====================================================

// 1. Supabase Initialization
const SUPABASE_URL = "https://pihjynkvwwrgvbxkyosj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGp5bmt2d3dyZ3ZieGt5b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDU0MTIsImV4cCI6MjEwMzk4MTQxMn0.hYtT1t8kb7gsKqWqIb1VMm6WlTwwHwtPOoqDyv7HFtM"
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let liveIncidents = [];
let liveShelters = [];

// 2. Toast Helper
const toastEl = document.getElementById("toast");
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 3500);
}
window.toast = toast;

// 3. AI Priority Score Calculator
function aiScore(i) {
  const sevMap = { low: 25, medium: 55, high: 80, critical: 95 };
  const sev = (i.severity || "medium").toLowerCase();
  const base = sevMap[sev] || 50;
  const people = Number(i.people_affected || i.people || 1);
  return Math.min(100, Math.max(i.priority_score || i.score || 0, base + Math.min(people * 2, 10)));
}

// 4. Fetch Live Data from Supabase
async function fetchSupabaseData() {
  if (!supabaseClient) return;

  // Fetch Incidents
  const { data: incData } = await supabaseClient
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (incData) liveIncidents = incData;

  // Fetch Shelters
  const { data: shData } = await supabaseClient
    .from("shelters")
    .select("*");

  if (shData) liveShelters = shData;

  renderDashboard();
  renderIncidents();
  renderAdminShelters();
  updateLiveMap();
}

// 5. Section Navigation
function showSection(id) {
  document.querySelectorAll(".section").forEach((s) => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".sidebar .nav-item").forEach((b) => b.classList.toggle("active", b.dataset.section === id));

  if (id === "monitor") {
    setTimeout(() => {
      const m = createMap("authorityMap");
      if (m) {
        m.invalidateSize();
        updateLiveMap();
      }
    }, 150);
  }
  if (id === "incidents") renderIncidents();
  if (id === "teams") renderTeams();
  if (id === "shelterAdmin") renderAdminShelters();
}

document.querySelectorAll("[data-section]").forEach((b) =>
  b.addEventListener("click", () => showSection(b.dataset.section))
);

// 6. Real-Time Map Updater
function updateLiveMap() {
  const mapEl = document.getElementById("authorityMap");
  if (!mapEl) return;
  const map = createMap("authorityMap");
  if (map && typeof addSituationMarkers === "function") {
    addSituationMarkers(map, { incidents: liveIncidents, shelters: liveShelters });
  }
}

// 7. Render Operational Overview
function renderDashboard() {
  const active = liveIncidents.filter((i) => (i.status || "").toLowerCase() !== "resolved");
  const critical = active.filter((i) => aiScore(i) >= 80);

  const activeEl = document.getElementById("activeCount");
  const critEl = document.getElementById("criticalCount");
  const queueEl = document.getElementById("priorityQueue");

  if (activeEl) activeEl.textContent = active.length;
  if (critEl) critEl.textContent = critical.length;

  if (queueEl) {
    if (active.length === 0) {
      queueEl.innerHTML = `<p style="color:var(--muted); padding:12px 0;">No active incidents in queue.</p>`;
      return;
    }

    queueEl.innerHTML = active
      .sort((a, b) => aiScore(b) - aiScore(a))
      .slice(0, 6)
      .map((i) => {
        const score = aiScore(i);
        const type = (i.request_type || i.type || "SOS").replace(/_/g, " ").toUpperCase();
        return `
          <div class="priority-item">
            <div class="priority-score">${score}</div>
            <div>
              <b>${type}</b><br>
              <small>INC-${i.id} • ${i.people_affected || i.people || 1} affected • ${(i.status || "pending").toUpperCase()}</small>
            </div>
            <button class="dispatch-btn" onclick="dispatchIncident('${i.id}')">
              ${i.status === "dispatched" ? "Dispatched" : "🚨 Dispatch"}
            </button>
          </div>`;
      })
      .join("");
  }
}

// 8. Dispatch Response Unit (Creates Mission in Supabase)
async function dispatchIncident(id) {
  toast("⏳ Dispatching response unit...");

  if (supabaseClient) {
    // 1. Update incident status in Supabase
    await supabaseClient
      .from("incidents")
      .update({ status: "dispatched" })
      .eq("id", id);

    // 2. Insert into missions table for 6th Member's Responder App
    await supabaseClient
      .from("missions")
      .insert([
        {
          incident_id: id,
          status: "dispatched",
          created_at: new Date().toISOString()
        }
      ]);
  }

  toast(`🚑 Response unit dispatched to Incident #${id}!`);
  await fetchSupabaseData();
}
window.dispatchIncident = dispatchIncident;
window.handleDispatchIncident = dispatchIncident;

// 9. Render Incident Management Table
function renderIncidents() {
  const tableEl = document.getElementById("incidentTable");
  if (!tableEl) return;

  const filter = document.getElementById("filterPriority")?.value || "all";
  let list = liveIncidents.filter((i) => {
    if (filter === "all") return true;
    return (i.severity || "").toLowerCase() === filter.toLowerCase();
  });

  list.sort((a, b) => aiScore(b) - aiScore(a));

  tableEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Incident Details</th>
          <th>Affected</th>
          <th>AI Priority</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${
          list.length === 0
            ? `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:20px;">No incidents matching filter.</td></tr>`
            : list
                .map((i) => {
                  const score = aiScore(i);
                  const badgeClass = score >= 80 ? "danger" : score >= 55 ? "warning" : "info";
                  const type = (i.request_type || i.type || "Emergency").replace(/_/g, " ").toUpperCase();
                  const isDispatched = i.status === "dispatched" || i.status === "in_progress";
                  const isResolved = i.status === "resolved";

                  return `
                    <tr>
                      <td><b>#${i.id}</b></td>
                      <td><b>${type}</b><br><small>${i.description || "Assistance required"}</small></td>
                      <td>${i.people_affected || i.people || 1}</td>
                      <td><span class="badge ${badgeClass}">${score}/100</span></td>
                      <td><b style="font-size:12px;">${(i.status || "pending").toUpperCase()}</b></td>
                      <td>
                        ${
                          isResolved
                            ? `<span style="color:#10b981; font-weight:700;">✓ Resolved</span>`
                            : `<button class="dispatch-btn" onclick="dispatchIncident('${i.id}')" ${isDispatched ? 'disabled style="opacity:0.6;"' : ""}>
                                ${isDispatched ? "In Progress" : "🚨 Dispatch"}
                              </button>`
                        }
                      </td>
                    </tr>
                  `;
                })
                .join("")
        }
      </tbody>
    </table>
  `;
}

// 10. Seed Demo Incident
const seedBtn = document.getElementById("seedDemo");
if (seedBtn) {
  seedBtn.addEventListener("click", async () => {
    const types = ["rescue", "medical", "food_water_medicine", "sos"];
    const pickedType = types[Math.floor(Math.random() * types.length)];
    const people = Math.floor(Math.random() * 10) + 1;

    if (supabaseClient) {
      await supabaseClient.from("incidents").insert([
        {
          request_type: pickedType,
          people_affected: people,
          severity: people > 6 ? "critical" : "high",
          description: "Live demo drill incident reported in central zone.",
          latitude: 20.2961 + (Math.random() - 0.5) * 0.05,
          longitude: 85.8245 + (Math.random() - 0.5) * 0.05,
          status: "pending",
          created_at: new Date().toISOString()
        }
      ]);
    }

    toast("Demo incident added directly to Supabase!");
    await fetchSupabaseData();
  });
}

// 11. Render Teams & Shelter Admin Panels
const teams = [
  ["R-01", "Alpha Rescue", "18 members", "Available"],
  ["R-02", "Rapid Response", "12 members", "Available"],
  ["R-03", "Medical Unit", "9 members", "Busy"],
  ["R-04", "Water Rescue", "15 members", "Available"],
  ["R-05", "Fire & Rescue", "11 members", "Busy"],
  ["R-06", "Relief Logistics", "8 members", "Available"]
];

function renderTeams() {
  const teamGrid = document.getElementById("teamGrid");
  if (!teamGrid) return;
  teamGrid.innerHTML = teams
    .map(
      (t) => `
      <article class="card team-card">
        <span class="team-status ${t[3] === "Available" ? "online" : "busy"}">● ${t[3]}</span>
        <div style="font-size:35px">🚑</div>
        <h3>${t[0]} • ${t[1]}</h3>
        <p>${t[2]}</p>
        <p>📍 Central Command Zone</p>
        <button class="small-btn" onclick="toast('${t[0]} status synchronized')">View Team Details</button>
      </article>`
    )
    .join("");
}

function renderAdminShelters() {
  const shelterGrid = document.getElementById("adminShelters");
  if (!shelterGrid) return;

  const fallbackShelters = [
    { name: "Central Community Center", capacity: 500, occupied: 120, area: "Central Zone" },
    { name: "North High School Shelter", capacity: 300, occupied: 45, area: "North Zone" }
  ];

  const source = liveShelters.length > 0 ? liveShelters : fallbackShelters;

  shelterGrid.innerHTML = source
    .map((s) => {
      const cap = s.capacity ?? s.max_capacity ?? 500;
      const occ = s.current_occupancy ?? s.occupied ?? 100;
      const p = Math.round((occ / cap) * 100);
      return `
        <article class="card shelter-card">
          <h3>🏠 ${s.name}</h3>
          <p>${s.area || "Relief Zone"}</p>
          <div class="capacity">${occ} / ${cap} people (${p}%)</div>
          <div class="capacity-bar"><i style="width:${p}%; background:${p > 85 ? "#ef4444" : "#10b981"}"></i></div>
          <p style="margin-top:8px;">${cap - occ} spaces remaining</p>
        </article>`;
    })
    .join("");
}

// 12. Realtime Subscription & Startup
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("filterPriority")?.addEventListener("change", renderIncidents);

  await fetchSupabaseData();

  // Supabase Realtime Listener
  if (supabaseClient) {
    supabaseClient
      .channel("authority_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        fetchSupabaseData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, () => {
        fetchSupabaseData();
      })
      .subscribe();
  }
});