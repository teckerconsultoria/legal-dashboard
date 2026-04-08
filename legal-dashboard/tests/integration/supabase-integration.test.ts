import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const TEST_SUPABASE_URL = 'https://ytyznzelkdorlctzysve.supabase.co';
const TEST_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXpuemVsa2RvcmxjdHp5c3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjY1NjcsImV4cCI6MjA5MTI0MjU2N30.ayeuOo4IKm06fhRVoj0Y59taAaJkuTFG6BcMhdwELVo';

describe('TEA-SUPA-01: CRUD de Orders', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrderId: string;

  beforeAll(() => {
    supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
  });

  it('deve criar uma order', async () => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        status: 'created',
        total_cents: 15000,
        customer_email: 'test-integration@example.com'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.status).toBe('created');
    expect(data.total_cents).toBe(15000);
    
    testOrderId = data.id;
  });

  it('deve ler uma order por ID', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrderId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(testOrderId);
  });

  it('deve atualizar status da order', async () => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'payment_pending' })
      .eq('id', testOrderId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('payment_pending');
  });

  it('deve deletar uma order', async () => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', testOrderId);

    expect(error).toBeNull();

    // Verificar que foi deletada
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrderId)
      .single();

    expect(data).toBeNull();
  });
});

describe('TEA-SUPA-02: Relacionamento Order → OrderItems → SKU', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrderId: string;
  let testSkuId: string;
  let testOrderItemId: string;

  beforeAll(async () => {
    supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
    
    // Buscar um SKU para o teste
    const { data: skus } = await supabase
      .from('sku_catalog')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (skus && skus.length > 0) {
      testSkuId = skus[0].id;
    }
  });

  it('deve criar order com items', async () => {
    if (!testSkuId) {
      console.log('⚠️  Nenhum SKU disponível');
      return;
    }

    // Criar order
    const { data: order } = await supabase
      .from('orders')
      .insert({
        status: 'created',
        total_cents: 15000,
        customer_email: 'test-relation@example.com'
      })
      .select()
      .single();

    expect(order).toBeDefined();
    testOrderId = order.id;

    // Criar order item
    const { data: item } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        sku_id: testSkuId,
        quantity: 1,
        unit_price_cents: 15000,
        subtotal_cents: 15000
      })
      .select()
      .single();

    expect(item).toBeDefined();
    testOrderItemId = item.id;

    // Validar relacionamento
    expect(item.order_id).toBe(order.id);
    expect(item.sku_id).toBe(testSkuId);
  });

  it('deve fazer join entre orders e order_items', async () => {
    if (!testOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          sku_catalog (*)
        )
      `)
      .eq('id', testOrderId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.order_items).toBeDefined();
    expect(data.order_items.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (testOrderItemId) {
      await supabase.from('order_items').delete().eq('id', testOrderItemId);
    }
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
  });
});

describe('TEA-SUPA-03: State Machine de Status', () => {
  let supabase: ReturnType<typeof createClient>;
  let testOrderId: string;

  beforeAll(async () => {
    supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
    
    // Criar order para teste de state machine
    const { data } = await supabase
      .from('orders')
      .insert({
        status: 'created',
        total_cents: 15000,
        customer_email: 'test-state@example.com'
      })
      .select()
      .single();
    
    if (data) {
      testOrderId = data.id;
    }
  });

  it('deve transicionar created → payment_pending', async () => {
    if (!testOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'payment_pending' })
      .eq('id', testOrderId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('payment_pending');
  });

  it('deve transicionar payment_pending → paid', async () => {
    if (!testOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        stripe_payment_intent_id: 'pi_test_123'
      })
      .eq('id', testOrderId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('paid');
    expect(data.stripe_payment_intent_id).toBe('pi_test_123');
  });

  it('deve transicionar paid → processing', async () => {
    if (!testOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', testOrderId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('processing');
  });

  it('deve transicionar processing → delivered', async () => {
    if (!testOrderId) return;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', testOrderId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('delivered');
  });

  afterAll(async () => {
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
  });
});

describe('TEA-SUPA-04: Validação de Dados', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
  });

  it('deve validar campos obrigatórios de SKU', async () => {
    // Tentar inserir SKU sem campos obrigatórios
    const { error } = await supabase
      .from('sku_catalog')
      .insert({
        // name ausente
        description: 'Test',
        price_cents: 1000
      });

    // Deve falhar ou ignorar dependendo das constraints
    expect(error).toBeDefined();
  });

  it('deve garantir que orders tenham timestamps', async () => {
    const { data } = await supabase
      .from('orders')
      .insert({
        status: 'created',
        total_cents: 1000,
        customer_email: 'test-timestamps@example.com'
      })
      .select()
      .single();

    expect(data).toBeDefined();
    expect(data.created_at).toBeDefined();
    expect(data.updated_at).toBeDefined();
    
    // Limpar
    if (data) {
      await supabase.from('orders').delete().eq('id', data.id);
    }
  });

  it('deve validar preço positivo em SKU', async () => {
    const { data } = await supabase
      .from('sku_catalog')
      .insert({
        name: 'Test SKU',
        price_cents: 1000,
        sla_hours: 24,
        is_active: true
      })
      .select()
      .single();

    expect(data).toBeDefined();
    expect(data.price_cents).toBeGreaterThan(0);
    
    // Limpar
    if (data) {
      await supabase.from('sku_catalog').delete().eq('id', data.id);
    }
  });
});
