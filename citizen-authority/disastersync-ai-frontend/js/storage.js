// 1. Supabase Initialization
const SUPABASE_URL = "https://pihjynkvwwrgvbxkyosj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGp5bmt2d3dyZ3ZieGt5b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDU0MTIsImV4cCI6MjEwMzk4MTQxMn0.hYtT1t8kb7gsKqWqIb1VMm6WlTwwHwtPOoqDyv7HFtM";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Incident Storage & Live Supabase Sync
const Storage = {
  // Get all user requests
  getRequests() {
    return JSON.parse(localStorage.getItem('safereach_requests') || '[]');
  },

  // Save request locally and push to Supabase
  async saveIncident(incidentData) {
    // Save to local request history for Citizen View
    const requests = this.getRequests();
    requests.unshift(incidentData);
    localStorage.setItem('safereach_requests', JSON.stringify(requests));

    // If online, insert directly to Supabase
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .insert([
            {
              request_type: incidentData.type,
              people_affected: parseInt(incidentData.peopleAffected || 1),
              description: incidentData.description || 'Emergency assistance requested',
              severity: (incidentData.severity || 'high').toLowerCase(),
              latitude: incidentData.lat || 20.2961,
              longitude: incidentData.lng || 85.8245,
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ]);

        if (error) throw error;
        return { success: true, offline: false };
      } catch (err) {
        console.warn('Supabase post failed, queuing offline:', err);
        this.queueOffline(incidentData);
        return { success: true, offline: true };
      }
    } else {
      // Offline fallback
      this.queueOffline(incidentData);
      return { success: true, offline: true };
    }
  },

  // Offline Queue handling
  queueOffline(incidentData) {
    const queue = JSON.parse(localStorage.getItem('safereach_offline_queue') || '[]');
    queue.push(incidentData);
    localStorage.setItem('safereach_offline_queue', JSON.stringify(queue));
  },

  // Sync offline queue when back online
  async syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('safereach_offline_queue') || '[]');
    if (queue.length === 0) return;

    for (const item of queue) {
      await supabase.from('incidents').insert([
        {
          request_type: item.type,
          people_affected: parseInt(item.peopleAffected || 1),
          description: item.description,
          severity: (item.severity || 'high').toLowerCase(),
          latitude: item.lat || 20.2961,
          longitude: item.lng || 85.8245,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);
    }

    localStorage.removeItem('safereach_offline_queue');
    if (window.showToast) {
      window.showToast('📶 All offline incidents successfully synced with Command Center!');
    }
  }
};

// Automatic listener for online reconnection
window.addEventListener('online', () => {
  Storage.syncOfflineQueue();
});


// Backward compatibility wrappers for legacy helper calls
function getData() {
  return {
    requests: Storage.getRequests(),
    incidents: [],
    shelters: []
  };
}

function addRequest(request) {
  return Storage.saveIncident(request);
}