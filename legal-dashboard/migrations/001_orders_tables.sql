-- Migration: Create orders-related tables for Tier 3
-- Created: 2026-04-08

-- SKU Catalog
CREATE TABLE IF NOT EXISTS sku_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  sla_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sku_catalog ENABLE ROW LEVEL SECURITY;

-- Create policy for public read
CREATE POLICY "sku_catalog_public_read" ON sku_catalog
  FOR SELECT USING (is_active = true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  total_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  customer_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own orders
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: users can insert their own orders
CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: service role can do everything
CREATE POLICY "orders_service_role" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sku_id UUID REFERENCES sku_catalog(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: read order items if order is accessible
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id OR user_id IS NULL)
  );

-- Policy: service role can do everything
CREATE POLICY "order_items_service_role" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

-- Seed SKUs
INSERT INTO sku_catalog (name, description, price_cents, sla_hours, features, highlights) VALUES
('Report Saúde', 'Visão geral da carteira processual com análise de riscos e pendências', 15000, 24, 
 '["Listagem completa de processos", "Análise de risco por fase", "Indicadores de staleness"]', 
 '["Entrega em 24h", "Formato PDF", "Dados mascarados por LGPD"]'),
('Report Priorização', 'Análise detalhada com priorização de casos e recomendações de atuação', 30000, 48, 
 '["Todos os itens do Report Saúde", "Score de prioridade por processo", "Recomendações de ação", "Análise por tribunal"]', 
 '["Entrega em 48h", "Formato PDF", "Dados mascarados por LGPD"]'),
('Report Governança', 'Análise profunda com recomendações estratégicas e plano de ação', 60000, 168, 
 '["Todos os itens do Report Priorização", "Análise de padrão processual", "Relatório executivo", "Plano de ação personalizado", "Revisão por especialista"]', 
 '["Entrega em 7 dias", "Formato PDF + PPTX", "Dados mascarados por LGPD", "Suporte pós-entrega"]')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku_id ON order_items(sku_id);
