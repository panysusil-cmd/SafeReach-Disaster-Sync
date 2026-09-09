const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('SafeReach / Safe Shelters Backend is running!');
});

// 1. Mock Database for Shelters (with GIS Coordinates)
let shelters = [
  {
    id: 1,
    name: "Community Relief Center A",
    zone: "North Zone",
    capacity: 300,
    occupied: 120,
    coordinates: [20.2961, 85.8245],
    facilities: ["Food", "Water", "Medical", "Power Backup"],
    status: "AVAILABLE"
  },
  {
    id: 2,
    name: "Government High School Shelter",
    zone: "Central Zone",
    capacity: 500,
    occupied: 480,
    coordinates: [20.3012, 85.8315],
    facilities: ["Food", "Water", "Beds"],
    status: "HIGH OCCUPANCY"
  },
  {
    id: 3,
    name: "Community Hall B",
    zone: "East Zone",
    capacity: 250,
    occupied: 90,
    coordinates: [20.2885, 85.8152],
    facilities: ["Water", "Medical"],
    status: "AVAILABLE"
  },
  {
    id: 4,
    name: "Cyclone Shelter C",
    zone: "South Zone",
    capacity: 400,
    occupied: 150,
    coordinates: [20.2920, 85.8330],
    facilities: ["Food", "Water", "Medical", "Power Backup"],
    status: "AVAILABLE"
  }
];

// 2. Mock Database for Emergency Incidents (Citizen SOS & Responder Triage)
let incidents = [
  {
    id: "INC-101",
    type: "Medical Triage / SOS",
    severity: "Critical",
    callerName: "Rajesh Mohanty",
    coordinates: [20.2980, 85.8220],
    description: "Citizen trapped due to waterlogging, immediate extraction required.",
    reportedAt: "5 mins ago",
    status: "Pending Dispatch",
    assignedTo: null
  },
  {
    id: "INC-102",
    type: "Road Hazard / Power Line Down",
    severity: "High",
    callerName: "Pooja Das",
    coordinates: [20.2915, 85.8340],
    description: "High-voltage wire snapped near main market transit road.",
    reportedAt: "18 mins ago",
    status: "Assigned",
    assignedTo: "Unit Alpha 4"
  }
];

// Helper Functions for Shelter Capacity & Status
function getAvailableSeats(shelter) {
  return shelter.capacity - shelter.occupied;
}

function updateShelterStatus(shelter) {
  if (shelter.occupied >= shelter.capacity) {
    shelter.status = "FULL";
  } else if (shelter.occupied >= shelter.capacity * 0.8) {
    shelter.status = "HIGH OCCUPANCY";
  } else {
    shelter.status = "AVAILABLE";
  }
}

// ==================== SHELTER ROUTES ====================

// GET all shelters
app.get('/api/shelters', (req, res) => {
  const sheltersWithAvailability = shelters.map(shelter => ({
    ...shelter,
    availableSeats: getAvailableSeats(shelter)
  }));

  res.status(200).json({
    success: true,
    count: sheltersWithAvailability.length,
    shelters: sheltersWithAvailability
  });
});

// GET single shelter by ID
app.get('/api/shelters/:id', (req, res) => {
  const shelterId = parseInt(req.params.id);
  const shelter = shelters.find(s => s.id === shelterId);

  if (!shelter) {
    return res.status(404).json({
      success: false,
      message: `Shelter with ID ${shelterId} not found`
    });
  }

  res.status(200).json({
    success: true,
    shelter: {
      ...shelter,
      availableSeats: getAvailableSeats(shelter)
    }
  });
});

// POST - Add a new shelter
app.post('/api/shelters', (req, res) => {
  const { name, zone, capacity, occupied, facilities, coordinates } = req.body;

  if (!name || !zone || capacity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Please provide name, zone, and capacity"
    });
  }

  const newShelter = {
    id: shelters.length > 0 ? Math.max(...shelters.map(s => s.id)) + 1 : 1,
    name,
    zone,
    capacity: Number(capacity),
    occupied: Number(occupied) || 0,
    coordinates: coordinates || [20.2961, 85.8245],
    facilities: facilities || [],
    status: "AVAILABLE"
  };

  updateShelterStatus(newShelter);
  shelters.push(newShelter);

  res.status(201).json({
    success: true,
    message: "Shelter registered successfully",
    shelter: {
      ...newShelter,
      availableSeats: getAvailableSeats(newShelter)
    }
  });
});

// PUT - Update shelter details / occupancy
app.put('/api/shelters/:id', (req, res) => {
  const shelterId = parseInt(req.params.id);
  const index = shelters.findIndex(s => s.id === shelterId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Shelter with ID ${shelterId} not found`
    });
  }

  const { name, zone, capacity, occupied, facilities, coordinates } = req.body;

  if (name !== undefined) shelters[index].name = name;
  if (zone !== undefined) shelters[index].zone = zone;
  if (capacity !== undefined) shelters[index].capacity = Number(capacity);
  if (occupied !== undefined) shelters[index].occupied = Number(occupied);
  if (facilities !== undefined) shelters[index].facilities = facilities;
  if (coordinates !== undefined) shelters[index].coordinates = coordinates;

  updateShelterStatus(shelters[index]);

  res.status(200).json({
    success: true,
    message: "Shelter updated successfully",
    shelter: {
      ...shelters[index],
      availableSeats: getAvailableSeats(shelters[index])
    }
  });
});

// DELETE - Remove a shelter
app.delete('/api/shelters/:id', (req, res) => {
  const shelterId = parseInt(req.params.id);
  const initialLength = shelters.length;

  shelters = shelters.filter(s => s.id !== shelterId);

  if (shelters.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: `Shelter with ID ${shelterId} not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Shelter with ID ${shelterId} deleted successfully`
  });
});

// ==================== INCIDENT ROUTES ====================

// GET all incidents
app.get('/api/incidents', (req, res) => {
  res.status(200).json({
    success: true,
    count: incidents.length,
    incidents: incidents
  });
});

// POST - Citizen triggers new SOS incident
app.post('/api/incidents', (req, res) => {
  const { type, severity, callerName, coordinates, description } = req.body;

  const newIncident = {
    id: `INC-${Date.now().toString().slice(-3)}`,
    type: type || "General SOS",
    severity: severity || "High",
    callerName: callerName || "Citizen User",
    coordinates: coordinates || [20.2961, 85.8245],
    description: description || "Emergency SOS requested from client app.",
    reportedAt: "Just now",
    status: "Pending Dispatch",
    assignedTo: null
  };

  incidents.unshift(newIncident);

  res.status(201).json({
    success: true,
    message: "SOS Incident created successfully",
    incident: newIncident
  });
});

// PATCH - Update incident status or assign responder
app.patch('/api/incidents/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;
  const incident = incidents.find(item => item.id === id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: `Incident with ID ${id} not found`
    });
  }

  if (status) incident.status = status;
  if (assignedTo) incident.assignedTo = assignedTo;

  res.status(200).json({
    success: true,
    message: "Incident updated successfully",
    incident
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`SafeReach Unified Server running on http://localhost:${PORT}`);
});