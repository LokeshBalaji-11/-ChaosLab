import fs from 'fs';
import path from 'path';
import { buildEvidenceBundle, validateAgentResponse } from '../server/agents';

const topology = JSON.parse(fs.readFileSync(path.join(path.resolve(), 'server', 'topology.json'), 'utf8'));

describe('Phase 4: Evidence-Grounded Agent Validation Logic', () => {
  const mockState = {
    services: {
      gateway: { status: 'healthy' },
      database: { status: 'failed', fault: 'stop' }
    },
    traffic: { successRate: 85, p95: 1400 }
  };

  test('buildEvidenceBundle collects metrics and states correctly', () => {
    const bundle = buildEvidenceBundle(mockState);
    expect(bundle.metrics.length).toBe(2);
    expect(bundle.healthStates.length).toBe(2);
    expect(bundle.events.length).toBe(1);
    expect(bundle.events[0].id).toBe('EVID-EV1');
  });

  test('validateAgentResponse flags missing evidence ID', () => {
    const bundle = buildEvidenceBundle(mockState);
    const badResponse = { citations: ['EVID-BAD99'], services: ['database'] };
    const res = validateAgentResponse(badResponse, bundle, topology);
    expect(res.flagged).toBe(true);
    expect(res.reason).toContain('Cites missing evidence ID');
  });

  test('validateAgentResponse flags made-up service not in graph', () => {
    const bundle = buildEvidenceBundle(mockState);
    const badResponse = { citations: ['EVID-M1'], services: ['fakingservice'] };
    const res = validateAgentResponse(badResponse, bundle, topology);
    expect(res.flagged).toBe(true);
    expect(res.reason).toContain('Names service not in graph');
  });

  test('validateAgentResponse passes valid response', () => {
    const bundle = buildEvidenceBundle(mockState);
    const goodResponse = { citations: ['EVID-M1'], services: ['database'] };
    const res = validateAgentResponse(goodResponse, bundle, topology);
    expect(res.flagged).toBe(false);
  });
});
