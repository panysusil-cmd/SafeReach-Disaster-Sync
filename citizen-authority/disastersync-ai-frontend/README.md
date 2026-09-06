# SafeReach — AI-Powered Disaster Management & Emergency Response Platform

SafeReach is an integrated, real-time emergency response platform designed to bridge communication gaps during critical disaster events. It connects affected citizens directly with central command dispatchers and field response logistics teams with built-in offline resilience.

---

## 🚀 Portals & Core Modules

* **Citizen Safety Portal (`citizen.html`):**[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
  * One-tap Instant SOS Broadcast with GPS auto-detection.
  * Structured Incident Reporting Form (Enum-aligned for SOS, Rescue, Medical, Food/Water/Medicine, General Assistance).
  * Offline-First Caching: Reports cache locally during network blackouts and auto-sync immediately upon reconnection.
  * Interactive Situation Map & Evacuation Shelter Locator with live occupancy bars and WASH statuses.

* **Authority Command Center (`authority.html`):**[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)
  * Real-time GIS Situation Map powered by Leaflet and OpenStreetMap tiles.[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)
  * AI Priority Queue engine calculating dynamic severity scores ($0-100$).
  * One-click Response Unit Dispatching connected directly to field teams.
  * Central Relief Resource tracking and Shelter Capacity monitoring.

* **Responder & Logistics Dashboard (`http://localhost:5174`):**
  * Live Active Missions Panel listening to Supabase Realtime dispatch updates.
  * Status Lifecycle Handlers: `Dispatched` $\rightarrow$ `In Progress` $\rightarrow$ `Completed / Resolved`.
  * Shelter & WASH Overview with capacity percentages.
  * Supply Hubs & Relief Inventory metrics (Water, Food Packets, Medical Kits, Fuel Reserves).

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** HTML5, CSS3 (Custom Responsive Variables), Modern Vanilla JavaScript (ES6+), React.js (Responder App).
* **Database & Realtime Engine:** Supabase (PostgreSQL with Realtime WebSockets).
* **GIS & Mapping:** Leaflet.js, OpenStreetMap API.[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)
* **Client-Side Storage:** Browser `localStorage` / Offline Queue Handler.[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span)

---

## ⚙️ How to Run Locally

For accurate browser Geolocation permissions and cross-origin resource handling, run the portal on a local server:[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)

### 1. Citizen & Authority Portals (Root Directory)
* **Using VS Code Live Server:** Right-click `index.html` and select **"Open with Live Server"**.[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span)
* **Using Python:**[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)
  ```bash
  python -m http.server 5500
  ```[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span)
  Then open: `http://localhost:5500`[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span)

### 2. Responder & Logistics Portal (`responder-app`)
```bash
cd responder-app
npm install
npm run dev