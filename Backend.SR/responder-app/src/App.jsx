import React, { useState, useEffect } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pihjynkvwwrgvbxkyosj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaGp5bmt2d3dyZ3ZieGt5b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDU0MTIsImV4cCI6MjEwMzk4MTQxMn0.hYtT1t8kb7gsKqWqIb1VMm6WlTwwHwtPOoqDyv7HFtM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const INITIAL_INCIDENTS = [
  {
    id: 'inc-01',
    title: 'Emergency SOS',
    request_type: 'sos',
    description: 'Severe waterlogging near Residential Complex. 4 individuals trapped.',
    priority_score: 95,
    status: 'dispatched',
    lat: 20.2961,
    lng: 85.8245
  },
  {
    id: 'inc-02',
    title: 'Shelter Ration Request',
    request_type: 'food_water_medicine',
    description: 'Relief camp supplies needed: 200 water bottles, dry food rations, and first aid kits.',
    priority_score: 92,
    status: 'in_progress',
    lat: 20.2882,
    lng: 85.8421
  },
  {
    id: 'inc-03',
    title: 'Citizen Incident Report',
    request_type: 'rescue',
    description: 'Submerged residential zone. Boat rescue team deployed.',
    priority_score: 91,
    status: 'in_progress',
    lat: 20.2915,
    lng: 85.8312
  },
  {
    id: 'inc-04',
    title: 'Elderly Medical Help',
    request_type: 'medical',
    description: 'Critical insulin & oxygen replenishment required for elderly citizen.',
    priority_score: 88,
    status: 'submitted',
    lat: 20.2740,
    lng: 85.8390
  },
  {
    id: 'inc-05',
    title: 'Evacuation Completed at Canal Bank',
    request_type: 'rescue',
    description: 'Canal overflow risk averted, evacuation team on standby.',
    priority_score: 72,
    status: 'resolved',
    lat: 20.3120,
    lng: 85.8160
  }
];

export default function App() {
  const [tab, setTab] = useState('missions');
  const [missions, setMissions] = useState(INITIAL_INCIDENTS);
  const [shelters, setShelters] = useState([]);
  const [inventory, setInventory] = useState([]);

  const loadData = async () => {
    try {
      // 1. Fetch incidents from Supabase
      const { data: incData, error: incErr } = await supabase
        .from('incidents')
        .select('*');

      if (incErr) {
        console.error("Supabase Incidents Error:", incErr.message);
      } else if (incData && incData.length > 0) {
        // Reverse so the newest reported incidents appear first
        setMissions([...incData].reverse());
      }

      // 2. Fetch shelters
      const { data: sData } = await supabase.from('shelters').select('*');
      if (sData && sData.length > 0) setShelters(sData);

      // 3. Fetch inventory
      const { data: iData } = await supabase.from('inventory').select('*');
      if (iData && iData.length > 0) setInventory(iData);
    } catch (e) {
      console.warn("LoadData error:", e);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('realtime_live_incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMissions((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMissions((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        } else {
          loadData();
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    try {
      await supabase.from('incidents').update({ status: newStatus }).eq('id', id);
    } catch (e) {}
  };

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '20px' }}>🚑 SafeReach Responder & Logistics</h2>
        <nav className="nav" style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: tab === 'missions' ? '#2563eb' : '#334155', color: '#fff', fontWeight: 'bold' }} onClick={() => setTab('missions')}>My Missions ({missions.length})</button>
          <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: tab === 'shelter' ? '#2563eb' : '#334155', color: '#fff', fontWeight: 'bold' }} onClick={() => setTab('shelter')}>Shelter & WASH</button>
          <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: tab === 'supply' ? '#2563eb' : '#334155', color: '#fff', fontWeight: 'bold' }} onClick={() => setTab('supply')}>Supply Hubs</button>
        </nav>
      </header>

      <main className="content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {tab === 'missions' && (
          <div>
            <h3 style={{ marginBottom: '1.2rem', color: '#f1f5f9', fontSize: '18px' }}>Active Field Tasks ({missions.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {missions.map((m) => (
                <div key={m.id} style={{ background: '#1e293b', padding: '18px', borderRadius: '10px', border: '1px solid #334155', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '16px' }}>{m.title || m.request_type || 'Emergency Mission'}</h4>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: m.status === 'resolved' ? '#10b981' : m.status === 'in_progress' ? '#3b82f6' : '#f59e0b', color: '#000', fontWeight: 'bold' }}>
                      {m.status || 'submitted'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0' }}>Type: <strong style={{ color: '#e2e8f0' }}>{m.request_type || 'Field SOS'}</strong></p>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '8px 0' }}>{m.description || 'Emergency field task assigned to response team.'}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0' }}><strong>Priority Score:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{m.priority_score ?? '90'}/100</span></p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 14px 0' }}>GPS: {m.lat ? `${Number(m.lat).toFixed(4)}, ${Number(m.lng).toFixed(4)}` : '20.2961° N, 85.8245° E'}</p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateStatus(m.id, 'in_progress')} style={{ flex: 1, padding: '8px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>Start Mission</button>
                    <button onClick={() => updateStatus(m.id, 'resolved')} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'shelter' && (
          <div>
            <h3 style={{ marginBottom: '1.2rem', color: '#f1f5f9' }}>Evacuation Shelters & WASH Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}>
                <h4>⛺ Kalinga Stadium Relief Camp</h4>
                <p style={{ color: '#94a3b8' }}>Occupancy: 380 / 500 (76%)</p>
                <p>WASH Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Adequate</span></p>
              </div>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}>
                <h4>⛺ Saheed Nagar High School</h4>
                <p style={{ color: '#94a3b8' }}>Occupancy: 80 / 300 (26%)</p>
                <p>WASH Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Adequate</span></p>
              </div>
            </div>
          </div>
        )}

        {tab === 'supply' && (
          <div>
            <h3 style={{ marginBottom: '1.2rem', color: '#f1f5f9' }}>Supply Hubs & Relief Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}>
                <small style={{ color: '#94a3b8' }}>💧 Drinking Water</small>
                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '6px 0', color: '#38bdf8' }}>8,450 L</div>
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>Adequate Stock</span>
              </div>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}>
                <small style={{ color: '#94a3b8' }}>🍱 Food Packets</small>
                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '6px 0', color: '#38bdf8' }}>3,200</div>
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>Adequate Stock</span>
              </div>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}>
                <small style={{ color: '#94a3b8' }}>💊 Medical Kits</small>
                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '6px 0', color: '#ef4444' }}>120</div>
                <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>Low Stock (&lt;25%)</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}