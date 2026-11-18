import { saveRunRecord, loadRunHistory, deleteRunRecord, clearRunHistory, exportRunMarkdown } from '../src/client/RunHistoryPanel';

// Mock localStorage for Node/Jest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('Run History & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and loads run records', () => {
    saveRunRecord({
      targetService: 'database',
      failureType: 'unavailable',
      affectedServices: [{ serviceId: 'database', status: 'failed', order: 1 }],
      sourceLabel: 'cached',
      recoveryVerdict: 'Recovered'
    });

    const history = loadRunHistory();
    expect(history.length).toBe(1);
    expect(history[0].targetService).toBe('database');
    expect(history[0].recoveryVerdict).toBe('Recovered');
  });

  test('caps history at 50 runs', () => {
    for (let i = 0; i < 60; i++) {
      saveRunRecord({
        targetService: `service_${i}`,
        failureType: 'unavailable',
        affectedServices: [],
        sourceLabel: 'cached'
      });
    }

    const history = loadRunHistory();
    expect(history.length).toBe(50);
    expect(history[0].targetService).toBe('service_59'); // newest first
  });

  test('handles corrupt localStorage data safely', () => {
    localStorage.setItem('chaos_lab_run_history_v1', 'INVALID_JSON_CORRUPT');
    const history = loadRunHistory();
    expect(history).toEqual([]);
  });

  test('deletes a run record', () => {
    saveRunRecord({
      targetService: 'auth',
      failureType: 'unavailable',
      affectedServices: [],
      sourceLabel: 'cached'
    });
    const history1 = loadRunHistory();
    expect(history1.length).toBe(1);
    const id = history1[0].id;

    const history2 = deleteRunRecord(id);
    expect(history2.length).toBe(0);
  });

  test('clears all run history', () => {
    saveRunRecord({
      targetService: 'auth',
      failureType: 'unavailable',
      affectedServices: [],
      sourceLabel: 'cached'
    });
    clearRunHistory();
    expect(loadRunHistory()).toEqual([]);
  });

  test('exports run record as markdown', () => {
    const record = {
      id: 'test_123',
      timestamp: '2026-11-18T10:00:00.000Z',
      targetService: 'payment',
      failureType: 'latency',
      affectedServices: [{ serviceId: 'payment', status: 'degraded', order: 1 }],
      sourceLabel: 'live',
      matchScore: '8 / 8',
      recoveryVerdict: 'Recovered',
      analysisData: { note: 'test analysis' }
    };

    const md = exportRunMarkdown(record);
    expect(md).toContain('ChaosLab Run Report (test_123)');
    expect(md).toContain('payment');
    expect(md).toContain('8 / 8');
    expect(md).toContain('Recovered');
  });
});
