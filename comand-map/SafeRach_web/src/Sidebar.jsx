import React from 'react';

export default function Sidebar({ selectedIncident, onUpdateStatus }) {
  if (!selectedIncident) {
    return (
      <div style={{ width: '30vw', height: '100vh', background: '#0f172a', color: '#94a3b8', padding: '24px', boxSizing: 'border-box' }}>
        <h2>Emergency Command</h2>
        <p>Click any incident pin on the map to inspect details and dispatch teams.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status === 'dispatched') return '#f59e0b';
    if (status === 'completed') return '#22c55e';
    return '#ef4444';
  };

  return (
    <div style={{
      width: '30vw',
      height: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      padding: '24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderLeft: '1px solid #1e293b'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Command Panel</h2>
          <span style={{
            background: getStatusColor(selectedIncident.status),
            color: '#fff',
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {selectedIncident.status}
          </span>
        </div>

        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#38bdf8' }}>{selectedIncident.title}</h3>
          <p style={{ margin: '4px 0', color: '#94a3b8', fontSize: '13px' }}>
            <strong>Type:</strong> {selectedIncident.request_type}
          </p>
          <p style={{ margin: '4px 0', color: '#94a3b8', fontSize: '13px' }}>
            <strong>Priority Score:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>{selectedIncident.priority_score}/100</span>
          </p>
        </div>

        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#cbd5e1' }}>Situation Report</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
            {selectedIncident.description}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => onUpdateStatus(selectedIncident.id, 'dispatched')}
          disabled={selectedIncident.status === 'dispatched'}
          style={{
            padding: '12px',
            background: selectedIncident.status === 'dispatched' ? '#334155' : '#e11d48',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: selectedIncident.status === 'dispatched' ? 'not-allowed' : 'pointer',
          }}
        >
          🚨 Dispatch Response Unit
        </button>

        <button
          onClick={() => onUpdateStatus(selectedIncident.id, 'completed')}
          disabled={selectedIncident.status === 'completed'}
          style={{
            padding: '12px',
            background: selectedIncident.status === 'completed' ? '#334155' : '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: selectedIncident.status === 'completed' ? 'not-allowed' : 'pointer',
          }}
        >
          ✅ Complete & Resolve Incident
        </button>
      </div>
    </div>
  );
}