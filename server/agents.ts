import fs from 'fs';
import path from 'path';

const currentDir = path.resolve();
const topologyPath = path.join(currentDir, 'server', 'topology.json');

export interface EvidenceBundle {
  metrics: { id: string; metric: string; value: number }[];
  healthStates: { id: string; service: string; status: string }[];
  events: { id: string; description: string }[];
}

export function buildEvidenceBundle(state: any): EvidenceBundle {
  const metrics = [
    { id: 'EVID-M1', metric: 'successRate', value: state?.traffic?.successRate ?? 100 },
    { id: 'EVID-M2', metric: 'p95Latency', value: state?.traffic?.p95 ?? 120 }
  ];

  const healthStates: any[] = [];
  const events: any[] = [];

  if (state && state.services) {
    let i = 1;
    let j = 1;
    for (const [svc, info] of Object.entries(state.services) as [string, any][]) {
      healthStates.push({ id: `EVID-H${i++}`, service: svc, status: info.status });
      if (info.fault) {
        events.push({ id: `EVID-EV${j++}`, description: `Service ${svc} experienced fault ${info.fault}` });
      }
    }
  }

  return { metrics, healthStates, events };
}

export function validateAgentResponse(response: any, evidence: EvidenceBundle, topology: any): { valid: boolean; flagged: boolean; reason?: string } {
  if (!response || typeof response !== 'object') {
    return { valid: false, flagged: true, reason: 'Invalid response format.' };
  }

  const validServices = Object.keys(topology.services);
  const allEvidenceIds = new Set([
    ...evidence.metrics.map(m => m.id),
    ...evidence.healthStates.map(h => h.id),
    ...evidence.events.map(e => e.id)
  ]);

  if (response.citations && Array.isArray(response.citations)) {
    for (const cite of response.citations) {
      if (!allEvidenceIds.has(cite)) {
        return { valid: true, flagged: true, reason: `Critic flagged: Cites missing evidence ID ${cite}` };
      }
    }
  }

  if (response.services && Array.isArray(response.services)) {
    for (const svc of response.services) {
      if (!validServices.includes(svc)) {
        return { valid: true, flagged: true, reason: `Critic flagged: Names service not in graph: ${svc}` };
      }
    }
  }

  return { valid: true, flagged: false };
}
