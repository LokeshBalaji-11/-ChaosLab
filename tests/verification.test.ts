import { evaluateVerdict, comparePredictedObserved } from '../server/verification';

describe('Phase 3: Predicted vs Observed & Verified Recovery Logic', () => {
  test('evaluateVerdict returns Recovered when all healthy and traffic metrics are good', () => {
    const states = {
      gateway: { status: 'healthy' },
      auth: { status: 'healthy' },
      database: { status: 'healthy' }
    };
    const traffic = { successRate: 98, p95: 200 };
    expect(evaluateVerdict(states, traffic)).toBe('Recovered');
  });

  test('evaluateVerdict returns Not Recovered when success rate is low', () => {
    const states = {
      gateway: { status: 'failed' }
    };
    const traffic = { successRate: 80, p95: 1500 };
    expect(evaluateVerdict(states, traffic)).toBe('Not Recovered');
  });

  test('comparePredictedObserved computes match score correctly', () => {
    const predicted = { gateway: 'failed', auth: 'failed', database: 'healthy' };
    const observed = { gateway: 'failed', auth: 'degraded', database: 'healthy' };
    const result = comparePredictedObserved(predicted, observed);
    expect(result.matchScore).toBe('2 / 8');
    expect(result.comparison.auth.match).toBe(false);
    expect(result.comparison.gateway.match).toBe(true);
  });
});
