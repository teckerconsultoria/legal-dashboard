import { vi } from 'vitest';

export const mockSKU = {
  id: 'sku-123',
  name: 'Report Saúde',
  description: 'Visão geral da carteira processual',
  price_cents: 15000,
  sla_hours: 24,
  is_active: true,
  features: ['Listagem completa'],
  highlights: ['Entrega em 24h'],
  created_at: '2026-04-08T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

export const mockOrder = {
  id: 'order-123',
  user_id: 'user-123',
  status: 'created',
  total_cents: 15000,
  stripe_session_id: null,
  stripe_payment_intent_id: null,
  customer_email: 'test@example.com',
  created_at: '2026-04-08T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

export const mockOrderWithItems = {
  ...mockOrder,
  order_items: [
    {
      id: 'item-123',
      order_id: 'order-123',
      sku_id: 'sku-123',
      quantity: 1,
      unit_price_cents: 15000,
      subtotal_cents: 15000,
      sku: mockSKU,
    },
  ],
};

export const createMockSupabase = () => {
  const skuCatalogMock = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: mockSKU, error: null })),
        order: vi.fn(() => ({ data: [mockSKU], error: null })),
      })),
      order: vi.fn(() => ({ data: [mockSKU], error: null })),
    })),
  };

  const ordersMock = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: mockOrder, error: null })),
      })),
      or: vi.fn(() => ({
        order: vi.fn(() => ({ data: [mockOrder], error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: mockOrder, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
    })),
  };

  const orderItemsMock = {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'item-123' }, error: null })),
      })),
    })),
  };

  const auditLogsMock = {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'log-123' }, error: null })),
      })),
    })),
  };

  return {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'sku_catalog':
          return skuCatalogMock;
        case 'orders':
          return ordersMock;
        case 'order_items':
          return orderItemsMock;
        case 'audit_logs':
          return auditLogsMock;
        default:
          return skuCatalogMock;
      }
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123', email: 'test@example.com' } }, error: null })),
    },
  };
};

export const createMockStripe = () => {
  return {
    checkout: {
      sessions: {
        create: vi.fn(() =>
          Promise.resolve({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/test-session',
            payment_intent: 'pi_test_123',
          })
        ),
      },
    },
    webhooks: {
      constructEvent: vi.fn((body: string, signature: string, secret: string) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { order_id: 'order-123' },
            payment_intent: 'pi_test_123',
          },
        },
      })),
    },
  };
};
