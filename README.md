# SafeReach Disaster Sync 🚨

A real-time disaster management and emergency response coordination platform.

---

## 🏗️ Architecture & Modules

* **Citizen & Authority Portal (`citizen-authority/`)**
  * Built with HTML5, CSS3, JavaScript, Supabase Realtime.
  * Allows citizens to submit SOS requests, upload incident media, and view disaster safety advisories.
  * Live Server default: `http://127.0.0.1:5500`

* **Command Center Map Dashboard (`comand-map/`)**
  * Built with React + Vite, Mapbox / Leaflet, Tailwind CSS.
  * Real-time spatial tracking of incident reports, active hazards, and resource dispatching.
  * Local server: `http://localhost:5173`

* **Emergency Responder App (`responder-app/`)** *(Upcoming)*
  * Built with React + Vite.
  * Mobile-first tactical dispatch interface for rescue teams.
  * Local server: `http://localhost:5174`

* **Backend & Database**
  * PostgreSQL managed via Supabase.
  * Real-time listeners and role-based incident status lifecycle (`pending` ➔ `dispatched` ➔ `resolved`).

---

## 🚀 Running the Project Locally

### 1. Citizen & Authority Portal
Open `citizen-authority/disastersync-ai-frontend/citizen.html` with **Live Server** in VS Code.

### 2. Command Map Dashboard
```bash
cd comand-map/SafeRach_web
npm install
npm run dev
