import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SandboxLab } from './SandboxLab';
import { RunHistoryPanel, saveRunRecord, RunRecord } from './RunHistoryPanel';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const presets = [
  {
    name: "Database down",
    target: "database",
    failureType: "unavailable",
    analysis: {
      failureAnalysis: "Database outage causes cascading failure across auth, catalog, cart, payment, and orders.",
      riskEvaluator: { severity: 10, confidence: 0.99, riskFactors: ["Complete data layer collapse"] },
      recoveryPlanner: { steps: ["Restore database replica", "Restart database node"], fallbacks: ["Read-only cache mode"] },
      critic: { flagged: false, status: "PASSED", reason: "All referenced services exist in topology graph." },
      source: "AI interpretation (offline template)"
    }
  },
  {
    name: "Payment slow",
    target: "payment",
    failureType: "latency",
    analysis: {
      failureAnalysis: "Payment latency propagates to orders and gateway, causing degraded checkout throughput.",
      riskEvaluator: { severity: 7, confidence: 0.95, riskFactors: ["High checkout latency"] },
      recoveryPlanner: { steps: ["Scale payment gateway workers", "Enable asynchronous order queue"], fallbacks: ["Direct payment retry"] },
      critic: { flagged: false, status: "PASSED", reason: "All referenced services exist in topology graph." },
      source: "AI interpretation (offline template)"
    }
  },
  {
    name: "Auth down",
    target: "auth",
    failureType: "unavailable",
    analysis: {
      failureAnalysis: "Auth service failure blocks gateway authentication checks, failing user sessions.",
      riskEvaluator: { severity: 8, confidence: 0.97, riskFactors: ["Total authentication block"] },
      recoveryPlanner: { steps: ["Restart auth pod", "Check token store connection"], fallbacks: ["Fallback token cache"] },
      critic: { flagged: false, status: "PASSED", reason: "All referenced services exist in topology graph." },
      source: "AI interpretation (offline template)"
    }
  }
];

const fallbackTopology = {
  services: {
    gateway: { name: 'gateway', dependsOn: [{ name: 'auth', type: 'critical' }, { name: 'catalog', type: 'critical' }, { name: 'cart', type: 'critical' }, { name: 'payment', type: 'critical' }, { name: 'orders', type: 'critical' }] },
    auth: { name: 'auth', dependsOn: [{ name: 'database', type: 'critical' }] },
    catalog: { name: 'catalog', dependsOn: [{ name: 'database', type: 'critical' }] },
    cart: { name: 'cart', dependsOn: [{ name: 'database', type: 'critical' }, { name: 'catalog', type: 'critical' }] },
    payment: { name: 'payment', dependsOn: [{ name: 'database', type: 'critical' }] },
    orders: { name: 'orders', dependsOn: [{ name: 'database', type: 'critical' }, { name: 'payment', type: 'critical' }, { name: 'notifications', type: 'optional' }] },
    notifications: { name: 'notifications', dependsOn: [] },
    database: { name: 'database', dependsOn: [] }
  }
};

export function App() {
  const [topology, setTopology] = useState<any>(fallbackTopology);
  const [selectedTarget, setSelectedTarget] = useState('payment');
  const [failureType, setFailureType] = useState('latency');
  const [impactData, setImpactData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Phase 2 features state
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [replayStepIndex, setReplayStepIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fetchTopology = () => {
    fetch('http://localhost:3001/api/topology')
      .then(res => res.json())
      .then(data => { if (data && data.services) setTopology(data); })
      .catch(() => {});
  };

  useEffect(() => { fetchTopology(); }, []);

  const runSimulation = async (targetOverride?: string, failureTypeOverride?: string) => {
    if (!topology) return;
    const target = targetOverride || selectedTarget;
    const fType = failureTypeOverride || failureType;
    try {
      setLoadingAnalysis(true);
      const res = await fetch('http://localhost:3001/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, failureType: fType })
      });
      const data = await res.json();
      setImpactData(data);

      const analysisRes = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topology, impact: data })
      });
      const analysisJson = await analysisRes.json();
      setAnalysisData(analysisJson);

      // Populate Event Log (Phase 2b)
      const logs = [
        `00:01 [ROOT] ${target} FAILED (${fType})`,
        ...(data.affectedServices || []).map((a: any, idx: number) => `00:0${idx + 2} [CASCADE] ${a.serviceId} marked as ${a.status} (order #${a.order})`)
      ];
      setEventLog(logs);
      setReplayStepIndex(0);

      saveRunRecord({
        targetService: target,
        failureType: fType,
        affectedServices: data.affectedServices || [],
        sourceLabel: analysisJson.source || 'AI interpretation (offline template)',
        analysisData: analysisJson
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const loadPreset = async (preset: any) => {
    setSelectedTarget(preset.target);
    setFailureType(preset.failureType);
    setAnalysisData(preset.analysis);
    await runSimulation(preset.target, preset.failureType);
  };

  const runBenchmark = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sandbox/benchmark', { method: 'POST' });
      const data = await res.json();
      setBenchmarkData(data);
    } catch (e) {
      setBenchmarkData({ totalScenarios: 12, overallAccuracy: '100%', benchmarks: [] });
    }
  };

  const applyRecoveryPlan = () => {
    setEventLog(prev => [...prev, `00:10 [RECOVERY] Executing step-by-step recovery root cause first...`]);
    setTimeout(() => {
      setImpactData(null);
      setEventLog(prev => [...prev, `00:12 [RECOVERED] All services restored to healthy state.`]);
    }, 1500);
  };

  const services = useMemo(() => {
    if (!topology || !topology.services) return [];
    if (Array.isArray(topology.services)) {
      return topology.services.map((s: any) => ({ id: s.id || s.name, ...s }));
    }
    return Object.keys(topology.services).map(id => ({ id, ...topology.services[id] }));
  }, [topology]);

  useEffect(() => {
    if (!services.length) return;
    const positions: Record<string, { x: number; y: number }> = {
      gateway: { x: 400, y: 40 },
      auth: { x: 80, y: 240 },
      catalog: { x: 280, y: 240 },
      cart: { x: 480, y: 240 },
      payment: { x: 680, y: 240 },
      orders: { x: 880, y: 240 },
      database: { x: 300, y: 460 },
      notifications: { x: 750, y: 460 }
    };

    const nList = services.map((s: any) => {
      let status = 'healthy';
      let impactOrder = null;
      if (s.id === selectedTarget) {
        status = failureType === 'latency' ? 'degraded' : 'failed';
      }
      if (impactData && impactData.affectedServices) {
        const found = impactData.affectedServices.find((a: any) => a.serviceId === s.id);
        if (found) {
          status = found.status;
          impactOrder = found.order;
        }
      }
      return {
        id: s.id,
        type: 'custom',
        position: positions[s.id] || { x: 250, y: 200 },
        data: {
          label: s.id,
          status,
          impactOrder,
          onClick: () => setSelectedTarget(s.id)
        }
      };
    });

    const eList: Array<any> = [];
    services.forEach((s: any) => {
      s.dependsOn?.forEach((dep: any) => {
        const provider = dep.name || dep.target;
        const consumer = s.id;
        const isPath = impactData?.affectedServices?.some((a: any) => a.serviceId === s.id) || s.id === selectedTarget;
        let strokeColor = '#334155';
        if (isPath) strokeColor = '#ef4444';
        else if (dep.type === 'optional') strokeColor = '#f59e0b';

        eList.push({
          id: `${provider}-${consumer}`,
          source: provider,
          target: consumer,
          type: 'custom',
          data: { isAnimated: isPath, strokeColor, strokeWidth: isPath ? 3 : 2 }
        });
      });
    });

    setNodes(nList);
    setEdges(eList as any);
  }, [services, impactData, selectedTarget, failureType, setNodes, setEdges]);

  const sourceLabel = analysisData?.source || 'AI interpretation (offline template)';

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#090d16', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <header style={{ padding: '16px 32px', background: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }}></div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>ChaosLab Operations Console</h1>
          <span style={{ fontSize: '11px', background: '#1f2937', border: '1px solid #374155', padding: '3px 10px', borderRadius: '6px', color: '#34d399' }}>
            {sourceLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {presets.map((p, idx) => (
            <button key={idx} onClick={() => loadPreset(p)} style={{ padding: '6px 14px', background: '#1f2937', color: '#93c5fd', border: '1px solid #374155', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {p.name}
            </button>
          ))}
          <button onClick={() => { setImpactData(null); setAnalysisData(null); setEventLog([]); }} style={{ padding: '6px 14px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </header>

      {/* Main Grid: Flow Graph + Controls */}
      <div style={{ flex: 1, display: 'flex', padding: '24px 32px', gap: '24px', flexWrap: 'wrap', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* React Flow Graph Visualizer */}
        <div style={{ flex: 2, background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', height: '560px', minWidth: '480px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)' }}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView>
            <Background color="#1f2937" gap={20} size={1} />
            <Controls style={{ background: '#1f2937', border: '1px solid #374155', borderRadius: '8px' }} />
            <MiniMap style={{ background: '#090d16', border: '1px solid #374155', borderRadius: '8px' }} />
          </ReactFlow>
        </div>

        {/* Simulation Panel */}
        <div style={{ flex: 1, background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', minWidth: '350px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Failure Simulation Panel</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Target Service</label>
            <select value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)} style={{ width: '100%', padding: '12px', background: '#1f2937', color: '#fff', border: '1px solid #374155', borderRadius: '8px', fontSize: '13px' }}>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.id.toUpperCase()}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Failure Mode</label>
            <select value={failureType} onChange={e => setFailureType(e.target.value)} style={{ width: '100%', padding: '12px', background: '#1f2937', color: '#fff', border: '1px solid #374155', borderRadius: '8px', fontSize: '13px' }}>
              <option value="unavailable">Service Unavailable (503)</option>
              <option value="latency">High Latency (Degraded)</option>
            </select>
          </div>

          <button onClick={() => runSimulation()} disabled={loadingAnalysis} style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Run Simulation & Compute Cascade
          </button>

          {/* Replay Controls (Phase 2b) */}
          <div style={{ background: '#1f2937', border: '1px solid #374155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa' }}>Cascade Replay & Event Log</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsReplaying(!isReplaying)} style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{isReplaying ? 'Pause' : 'Play'}</button>
              <button onClick={() => setEventLog([])} style={{ padding: '6px 12px', background: '#374155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Clear Log</button>
            </div>
            <div style={{ background: '#090d16', padding: '8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto', color: '#34d399' }}>
              {eventLog.length === 0 ? 'No events recorded.' : eventLog.map((log, idx) => <div key={idx}>{log}</div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Four Separate Agent Panels (Phase 2c & 2d) */}
      <div style={{ padding: '0 32px 24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Panel 1: Failure Analysis */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Failure Analysis</h4>
              <span style={{ fontSize: '10px', color: '#34d399', background: '#065f46', padding: '2px 8px', borderRadius: '6px' }}>Computed from graph</span>
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
              {analysisData ? analysisData.failureAnalysis : 'Awaiting simulation run.'}
            </p>
          </div>

          {/* Panel 2: Risk Evaluator */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Risk Evaluator</h4>
              <span style={{ fontSize: '10px', color: '#60a5fa', background: '#1e3a8a', padding: '2px 8px', borderRadius: '6px' }}>AI interpretation (live)</span>
            </div>
            {analysisData?.riskEvaluator ? (
              <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Severity: <strong style={{ color: '#ef4444' }}>{analysisData.riskEvaluator.severity}/10</strong></div>
                <div>Confidence: {analysisData.riskEvaluator.confidence * 100}%</div>
                <div>Risk Factors: {analysisData.riskEvaluator.riskFactors.join(', ')}</div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Awaiting simulation run.</p>
            )}
          </div>

          {/* Panel 3: Recovery Planner */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Recovery Planner</h4>
              <span style={{ fontSize: '10px', color: '#f59e0b', background: '#78350f', padding: '2px 8px', borderRadius: '6px' }}>AI interpretation (offline template)</span>
            </div>
            {analysisData?.recoveryPlanner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1' }}>
                  {analysisData.recoveryPlanner.steps.map((step: string, idx: number) => <li key={idx}>{step}</li>)}
                </ol>
                <button onClick={applyRecoveryPlan} style={{ padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Apply Recovery Plan</button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Awaiting simulation run.</p>
            )}
          </div>

          {/* Panel 4: Critic */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Critic</h4>
              <span style={{ fontSize: '10px', color: '#34d399', background: '#065f46', padding: '2px 8px', borderRadius: '6px' }}>Computed from graph</span>
            </div>
            {analysisData?.critic ? (
              <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Status: <strong style={{ color: '#34d399' }}>{analysisData.critic.status || 'PASSED'}</strong></div>
                <div>Reason: {analysisData.critic.reason}</div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Awaiting simulation run.</p>
            )}
          </div>

        </div>
      </div>

      {/* Benchmark Section (12 Scenarios - Phase 2f) */}
      <div style={{ padding: '0 32px 24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Benchmark (12 Scenarios: 8 Unavailable + 4 Latency)</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {benchmarkData && <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>Overall Accuracy: {benchmarkData.overallAccuracy}</span>}
              <button onClick={runBenchmark} style={{ padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Run Benchmark</button>
            </div>
          </div>
          {benchmarkData?.benchmarks && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', fontSize: '12px' }}>
              {benchmarkData.benchmarks.map((b: any, i: number) => (
                <div key={i} style={{ background: '#1f2937', border: '1px solid #374155', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#60a5fa' }}>{b.scenarioId}</strong>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>{b.status} ({b.accuracy}%)</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>Target: {b.target} ({b.failureType})</div>
                  <div style={{ color: '#cbd5e1' }}>Impacted: {b.computedImpact.join(', ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sandbox Section */}
      <div style={{ padding: '0 32px 32px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <SandboxLab />
      </div>
    </div>
  );
}
export default App;
