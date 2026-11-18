import React, { useState, useEffect } from 'react';

export function SandboxLab() {
  const [state, setState] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('database');
  const [faultType, setFaultType] = useState('stop');
  const [duration, setDuration] = useState(30);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/sandbox/state');
      if (!res.ok) return;
      const data = await res.json();
      setState(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchState();
    const t = setInterval(fetchState, 1000);
    return () => clearInterval(t);
  }, []);

  const runFault = async () => {
    await fetch('/api/sandbox/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: selectedService, faultType, duration })
    });
    fetchState();
  };

  const resetSandbox = async () => {
    await fetch('/api/sandbox/reset', { method: 'POST' });
    fetchState();
  };

  const services = state?.services ? Object.keys(state.services) : ['gateway', 'auth', 'catalog', 'cart', 'payment', 'orders', 'database', 'notifications'];

  return (
    <div style={{ marginTop: '20px', padding: '24px', background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Sandbox Lab & Real Traffic Simulation</h3>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Target Service</label>
          <select value={selectedService} onChange={e => setSelectedService(e.target.value)} style={{ padding: '10px', background: '#1f2937', color: '#fff', border: '1px solid #374155', borderRadius: '6px', outline: 'none' }}>
            {services.map(id => <option key={id} value={id}>{id.toUpperCase()}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Fault Type</label>
          <select value={faultType} onChange={e => setFaultType(e.target.value)} style={{ padding: '10px', background: '#1f2937', color: '#fff', border: '1px solid #374155', borderRadius: '6px', outline: 'none' }}>
            <option value="stop">Stop Service (503)</option>
            <option value="latency">Add 1500ms Latency</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Duration (s)</label>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: '80px', padding: '10px', background: '#1f2937', color: '#fff', border: '1px solid #374155', borderRadius: '6px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
          <button onClick={runFault} style={{ padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Inject Fault</button>
          <button onClick={resetSandbox} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Reset Sandbox</button>
        </div>
      </div>

      {state && state.services && (
        <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Live Service States</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(state.services).map(([id, info]: [string, any]) => (
                <li key={id} style={{ padding: '10px 14px', background: '#1f2937', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, textTransform: 'uppercase' }}>{id}</span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: info.status === 'failed' ? '#7f1d1d' : info.status === 'degraded' ? '#78350f' : '#065f46', color: info.status === 'failed' ? '#fca5a5' : info.status === 'degraded' ? '#fde047' : '#6ee7b7' }}>
                    {info.status.toUpperCase()} {info.fault ? `(${info.fault})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ width: '280px', background: '#1f2937', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Gateway Traffic Metrics</h4>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Success Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{state.traffic?.successRate?.toFixed(1) || 100}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>P95 Latency</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>{state.traffic?.p95 || 120} ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
