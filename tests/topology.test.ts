import { analyzeImpact, Topology } from '../server/logic';

const testTopology: Topology = {
  services: {
    gateway: {
      name: 'gateway',
      dependsOn: [
        { name: 'auth', type: 'critical' },
        { name: 'catalog', type: 'critical' },
        { name: 'cart', type: 'critical' },
        { name: 'orders', type: 'critical' }
      ]
    },
    auth: {
      name: 'auth',
      dependsOn: [{ name: 'database', type: 'critical' }]
    },
    catalog: {
      name: 'catalog',
      dependsOn: [{ name: 'database', type: 'critical' }]
    },
    cart: {
      name: 'cart',
      dependsOn: [
        { name: 'database', type: 'critical' },
        { name: 'catalog', type: 'critical' }
      ]
    },
    payment: {
      name: 'payment',
      dependsOn: [{ name: 'database', type: 'critical' }]
    },
    orders: {
      name: 'orders',
      dependsOn: [
        { name: 'database', type: 'critical' },
        { name: 'payment', type: 'critical' },
        { name: 'notifications', type: 'optional' }
      ]
    },
    notifications: {
      name: 'notifications',
      dependsOn: []
    },
    database: {
      name: 'database',
      dependsOn: []
    }
  }
};

describe('E-commerce Topology Severity Impact Analysis', () => {
  test('Scenario 1: database down (critical failure)', () => {
    const result = analyzeImpact('database', testTopology);
    expect(result.failedService).toBe('database');
    
    const affected = result.affectedServices;
    const failedServices = affected.filter((s: any) => s.severity === 'failed').map((s: any) => s.name);
    expect(failedServices).toContain('auth');
    expect(failedServices).toContain('catalog');
    expect(failedServices).toContain('cart');
    expect(failedServices).toContain('payment');
    expect(failedServices).toContain('orders');
    expect(failedServices).toContain('gateway');
  });

  test('Scenario 2: auth down (critical for gateway)', () => {
    const result = analyzeImpact('auth', testTopology);
    expect(result.failedService).toBe('auth');
    
    const gatewayImpact = result.affectedServices.find((s: any) => s.name === 'gateway');
    expect(gatewayImpact?.severity).toBe('failed');
  });

  test('Scenario 3: payment slow/down (critical for orders)', () => {
    const result = analyzeImpact('payment', testTopology);
    expect(result.failedService).toBe('payment');
    
    const ordersImpact = result.affectedServices.find((s: any) => s.name === 'orders');
    expect(ordersImpact?.severity).toBe('failed');
    
    const gatewayImpact = result.affectedServices.find((s: any) => s.name === 'gateway');
    expect(gatewayImpact?.severity).toBe('failed');
  });

  test('Scenario 4: notifications down (optional for orders)', () => {
    const result = analyzeImpact('notifications', testTopology);
    expect(result.failedService).toBe('notifications');
    
    const ordersImpact = result.affectedServices.find((s: any) => s.name === 'orders');
    expect(ordersImpact?.severity).toBe('degraded');
    
    const gatewayImpact = result.affectedServices.find((s: any) => s.name === 'gateway');
    expect(gatewayImpact).toBeUndefined();
  });

  test('Scenario 5: payment latency (degraded propagation)', () => {
    const result = analyzeImpact('payment', testTopology, { failureType: 'latency' });
    expect(result.failedService).toBe('payment');
    
    const ordersImpact = result.affectedServices.find((s: any) => s.name === 'orders');
    expect(ordersImpact?.severity).toBe('degraded');
    
    const gatewayImpact = result.affectedServices.find((s: any) => s.name === 'gateway');
    expect(gatewayImpact?.severity).toBe('degraded');
  });

  test('Scenario 6: payment unavailable (assert payment, orders, gateway failed, notifications healthy)', () => {
    const result = analyzeImpact('payment', testTopology, { failureType: 'unavailable' });
    expect(result.failedService).toBe('payment');

    const paymentSev = result.affectedServices.find((s: any) => s.name === 'payment');
    // failedService is payment itself
    const ordersSev = result.affectedServices.find((s: any) => s.name === 'orders');
    const gatewaySev = result.affectedServices.find((s: any) => s.name === 'gateway');
    const notificationsSev = result.affectedServices.find((s: any) => s.name === 'notifications');

    expect(ordersSev?.severity).toBe('failed');
    expect(gatewaySev?.severity).toBe('failed');
    expect(notificationsSev).toBeUndefined(); // healthy
  });
});
