-- Migration 006: Order Reports
-- Tabela separada de orders para LGPD: DELETE aqui remove dados pessoais
-- sem perder histórico comercial em orders.
-- Created: 2026-04-08

CREATE TABLE IF NOT EXISTS order_reports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- sections: dados estruturados por SKU (mascarados LGPD ao salvar)
  sections                JSONB NOT NULL DEFAULT '{}',
  -- metadata: { escavador_version, timestamp_fetched, credits_used_by_step: {...} }
  metadata                JSONB NOT NULL DEFAULT '{}',
  completion_status       TEXT NOT NULL DEFAULT 'pending'
                          CHECK (completion_status IN ('pending', 'complete', 'partial', 'failed')),
  -- Token público para acesso sem auth (link tokenizado no email)
  access_token            UUID NOT NULL DEFAULT gen_random_uuid(),
  access_token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_reports_order_id_unique UNIQUE (order_id)
);

-- RLS
ALTER TABLE order_reports ENABLE ROW LEVEL SECURITY;

-- Service role acessa tudo (fulfillment engine, cron)
CREATE POLICY "order_reports_service_role" ON order_reports
  FOR ALL USING (auth.role() = 'service_role');

-- Cliente autenticado lê reports dos seus próprios pedidos
CREATE POLICY "order_reports_client_read" ON order_reports
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE (user_id = auth.uid() AND auth.uid() IS NOT NULL)
    )
  );
-- Acesso anônimo: endpoint público /api/reports/[token] usa service_role
-- e valida access_token + access_token_expires_at em código — sem policy RLS adicional

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_reports_order_id ON order_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reports_access_token ON order_reports(access_token);
CREATE INDEX IF NOT EXISTS idx_order_reports_completion_status ON order_reports(completion_status);

COMMENT ON TABLE order_reports IS
  'Dados de relatório separados de orders (LGPD).
   DELETE FROM order_reports WHERE order_id = X remove dados pessoais sem afetar orders.
   access_token: token público para /api/reports/[token] com TTL de 30 dias.
   sections: estruturado por SKU, dados mascarados at write-time.';
