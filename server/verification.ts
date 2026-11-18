import fs from 'fs';
import path from 'path';

export function evaluateVerdict(servicesState: Record<string, any>, traffic: { successRate: number; p95: number }): string {
  const allHealthy = Object.values(servicesState).every((s: any) => s.status === 'healthy');
  const successOk = traffic.successRate >= 95;
  const latencyOk = traffic.p95 < 1000;

  if (allHealthy && successOk && latencyOk) return 'Recovered';
  if (successOk || Object.values(servicesState).some((s: any) => s.status === 'degraded')) return 'Partially Recovered';
  return 'Not Recovered';
}

export function comparePredictedObserved(predicted: Record<string, string>, observed: Record<string, string>) {
  let matches = 0;
  const comparison: Record<string, { predicted: string; observed: string; match: boolean }> = {};
  
  for (const svc of Object.keys(predicted)) {
    const p = predicted[svc];
    const o = observed[svc] || 'healthy';
    const match = p === o;
    if (match) matches++;
    comparison[svc] = { predicted: p, observed: o, match };
  }

  return { matchScore: `${matches} / 8`, matches, comparison };
}
