import React, { useState, useEffect } from 'react';

export interface RunRecord {
  id: string;
  timestamp: string;
  targetService: string;
  failureType: string;
  affectedServices: Array<{ serviceId: string; status: string; order: number }>;
  sourceLabel: string;
  matchScore?: string;
  recoveryVerdict?: string;
  analysisData?: any;
}

const STORAGE_KEY = 'chaos_lab_run_history_v1';
const MAX_RUNS = 50;

export function loadRunHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RUNS);
    }
    return [];
  } catch (e) {
    console.warn('Failed to load run history, resetting storage', e);
    return [];
  }
}

export function saveRunRecord(record: Omit<RunRecord, 'id' | 'timestamp'>): RunRecord[] {
  const current = loadRunHistory();
  const newRecord: RunRecord = {
    ...record,
    id: 'run_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    timestamp: new Date().toISOString()
  };
  const updated = [newRecord, ...current].slice(0, MAX_RUNS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save run history', e);
  }
  return updated;
}

export function deleteRunRecord(id: string): RunRecord[] {
  const current = loadRunHistory();
  const updated = current.filter(r => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete run record', e);
  }
  return updated;
}

export function clearRunHistory(): RunRecord[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear run history', e);
  }
  return [];
}

export function exportRunMarkdown(run: RunRecord): string {
  const affected = run.affectedServices?.map(a => `- **${a.serviceId}**: ${a.status} (Order #${a.order})`).join('\n') || 'None';
  return `# ChaosLab Run Report (${run.id})
- **Timestamp:** ${run.timestamp}
- **Target Service:** ${run.targetService.toUpperCase()}
- **Failure Type:** ${run.failureType}
- **Source Label:** ${run.sourceLabel}
- **Match Score:** ${run.matchScore || 'N/A'}
- **Recovery Verdict:** ${run.recoveryVerdict || 'N/A'}

## Affected Services
${affected}

## Analysis
\`\`\`json
${JSON.stringify(run.analysisData || {}, null, 2)}
\`\`\`
`;
}

interface RunHistoryPanelProps {
  onReplay: (run: RunRecord) => void;
  historyUpdatedTrigger: number;
}

export function RunHistoryPanel({ onReplay, historyUpdatedTrigger }: RunHistoryPanelProps) {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setRuns(loadRunHistory());
  }, [historyUpdatedTrigger]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRuns(deleteRunRecord(id));
  };

  const handleClearAll = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    setRuns(clearRunHistory());
    setShowClearConfirm(false);
  };

  const handleExport = (e: React.MouseEvent, run: RunRecord) => {
    e.stopPropagation();
    const md = exportRunMarkdown(run);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaoslab_run_${run.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Simulation & Run History ({runs.length})</h4>
        {runs.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showClearConfirm && <span style={{ fontSize: '11px', color: '#f87171' }}>Confirm clear?</span>}
            <button onClick={handleClearAll} style={{ padding: '6px 12px', background: showClearConfirm ? '#7f1d1d' : '#374155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {showClearConfirm ? 'Yes, Clear All' : 'Clear All'}
            </button>
          </div>
        )}
      </div>

      {runs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px', background: '#1f2937', borderRadius: '8px', border: '1px dashed #374155' }}>
          No runs yet. Execute a simulation, run for real, or run recovery to record history.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
          {runs.map(run => (
            <div
              key={run.id}
              onClick={() => onReplay(run)}
              style={{
                background: '#1f2937',
                border: '1px solid #374155',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#60a5fa' }}>{run.targetService.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', background: '#374155', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>{run.failureType}</span>
                  {run.recoveryVerdict && (
                    <span style={{ fontSize: '11px', background: run.recoveryVerdict === 'Recovered' ? '#065f46' : '#78350f', padding: '2px 6px', borderRadius: '4px', color: '#34d399' }}>
                      {run.recoveryVerdict}
                    </span>
                  )}
                  {run.matchScore && (
                    <span style={{ fontSize: '11px', color: '#34d399' }}>Match: {run.matchScore}</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {new Date(run.timestamp).toLocaleString()} • Affected: {run.affectedServices?.length || 0} services
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={e => handleExport(e, run)} title="Export Markdown" style={{ padding: '6px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  Export .MD
                </button>
                <button onClick={e => handleDelete(e, run.id)} title="Delete Run" style={{ padding: '6px 8px', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
