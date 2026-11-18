export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  successThreshold?: number;
}

export class CircuitBreaker {
  state: CircuitState = 'CLOSED';
  failures = 0;
  successes = 0;
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  nextAttempt = 0;
  
  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold || 3;
    this.recoveryTimeout = options?.recoveryTimeout || 5000;
    this.successThreshold = options?.successThreshold || 2;
  }

  canExecute(): boolean {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF-OPEN';
        this.successes = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    if (this.state === 'HALF-OPEN') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  recordFailure() {
    this.failures++;
    if (this.state === 'HALF-OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    } else if (this.state === 'CLOSED' && this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }
}

export class Bulkhead {
  maxConcurrent = 10;
  currentConcurrent = 0;
  rejectedCount = 0;
  constructor(max = 10) { this.maxConcurrent = max; }
  async acquire() { if (this.currentConcurrent >= this.maxConcurrent) { this.rejectedCount++; return false; } this.currentConcurrent++; return true; }
  release() { if (this.currentConcurrent > 0) this.currentConcurrent--; }
}
