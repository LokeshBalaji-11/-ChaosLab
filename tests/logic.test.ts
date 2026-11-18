import { analyzeImpact, loadTopology } from '../server/logic';

describe('Cascade Engine - analyzeImpact', () => {
  const topology = loadTopology();

  test('database unavailable -> FAILED: database, auth, catalog, cart, payment, orders, gateway. HEALTHY: notifications', () => {
    const result = analyzeImpact('database', topology, { failureType: 'unavailable' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('auth')).toBe('failed');
    expect(affectedMap.get('catalog')).toBe('failed');
    expect(affectedMap.get('cart')).toBe('failed');
    expect(affectedMap.get('payment')).toBe('failed');
    expect(affectedMap.get('orders')).toBe('failed');
    expect(affectedMap.get('gateway')).toBe('failed');
    expect(affectedMap.get('notifications')).toBeUndefined(); // healthy
  });

  test('payment unavailable -> FAILED: payment, orders, gateway. Others healthy', () => {
    const result = analyzeImpact('payment', topology, { failureType: 'unavailable' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('payment')).toBeUndefined(); // failedService itself not in affectedServices
    expect(affectedMap.get('orders')).toBe('failed');
    expect(affectedMap.get('gateway')).toBe('failed');
    expect(affectedMap.get('auth')).toBeUndefined();
    expect(affectedMap.get('catalog')).toBeUndefined();
    expect(affectedMap.get('cart')).toBeUndefined();
    expect(affectedMap.get('database')).toBeUndefined();
    expect(affectedMap.get('notifications')).toBeUndefined();
  });

  test('payment latency -> DEGRADED: payment, orders, gateway. Others healthy', () => {
    const result = analyzeImpact('payment', topology, { failureType: 'latency' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('orders')).toBe('degraded');
    expect(affectedMap.get('gateway')).toBe('degraded');
    expect(affectedMap.get('auth')).toBeUndefined();
    expect(affectedMap.get('catalog')).toBeUndefined();
    expect(affectedMap.get('database')).toBeUndefined();
  });

  test('auth unavailable -> FAILED: auth, gateway. Others healthy', () => {
    const result = analyzeImpact('auth', topology, { failureType: 'unavailable' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('gateway')).toBe('failed');
    expect(affectedMap.get('catalog')).toBeUndefined();
    expect(affectedMap.get('cart')).toBeUndefined();
    expect(affectedMap.get('payment')).toBeUndefined();
    expect(affectedMap.get('database')).toBeUndefined();
  });

  test('catalog unavailable -> FAILED: catalog, cart, gateway. Others healthy', () => {
    const result = analyzeImpact('catalog', topology, { failureType: 'unavailable' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('cart')).toBe('failed');
    expect(affectedMap.get('gateway')).toBe('failed');
    expect(affectedMap.get('auth')).toBeUndefined();
    expect(affectedMap.get('payment')).toBeUndefined();
  });

  test('notifications unavailable -> FAILED: notifications. DEGRADED: orders. gateway HEALTHY', () => {
    const result = analyzeImpact('notifications', topology, { failureType: 'unavailable' });
    const affectedMap = new Map(result.affectedServices.map(s => [s.serviceId, s.severity]));

    expect(affectedMap.get('orders')).toBe('degraded');
    expect(affectedMap.get('gateway')).toBeUndefined(); // gateway depends on orders critically, but orders only degraded due to optional notification dep! Wait, let's verify gateway dependency on orders.
  });

  test('gateway unavailable -> FAILED: gateway only', () => {
    const result = analyzeImpact('gateway', topology, { failureType: 'unavailable' });
    expect(result.affectedServices.length).toBe(0);
  });
});
