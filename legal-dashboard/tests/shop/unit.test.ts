import { describe, it, expect } from 'vitest';

describe('Order Status Transitions', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    created: ['payment_pending', 'cancelled'],
    payment_pending: ['paid', 'cancelled'],
    paid: ['processing'],
    processing: ['delivered', 'failed'],
    delivered: [],
    failed: [],
    cancelled: [],
  };

  const canTransition = (from: string, to: string): boolean => {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  };

  it('deve permitir created -> payment_pending', () => {
    expect(canTransition('created', 'payment_pending')).toBe(true);
  });

  it('deve permitir payment_pending -> paid', () => {
    expect(canTransition('payment_pending', 'paid')).toBe(true);
  });

  it('deve permitir payment_pending -> cancelled', () => {
    expect(canTransition('payment_pending', 'cancelled')).toBe(true);
  });

  it('deve permitir paid -> processing', () => {
    expect(canTransition('paid', 'processing')).toBe(true);
  });

  it('deve permitir processing -> delivered', () => {
    expect(canTransition('processing', 'delivered')).toBe(true);
  });

  it('deve permitir processing -> failed', () => {
    expect(canTransition('processing', 'failed')).toBe(true);
  });

  it('não deve permitir created -> paid (skip payment)', () => {
    expect(canTransition('created', 'paid')).toBe(false);
  });

  it('não deve permitir delivered -> processing', () => {
    expect(canTransition('delivered', 'processing')).toBe(false);
  });

  it('não deve permitir created -> delivered', () => {
    expect(canTransition('created', 'delivered')).toBe(false);
  });

  it('não deve permitir failed -> paid', () => {
    expect(canTransition('failed', 'paid')).toBe(false);
  });
});
