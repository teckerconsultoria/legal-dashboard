-- Migration 005: Fulfillment Steps
-- Tabela separada para tracking de steps individuais por pedido.
-- DECISÃO (Party Mode review): JSONB array não é atômico — race condition entre webhook e cron.
-- Tabela separada com UNIQUE(order_id, step_id) resolve o problema.
-- Created: 2026-04-08

CREATE TABLE IF NOT EXISTS fulfillment_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step_id      TEXT NOT NULL,
  layer        INTEGER NOT NULL CHECK (layer IN (1, 2)),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'done', 'failed')),
  -- result já armazena dados mascarados (LGPD at write-time via lgpd.ts)
  result       JSONB,
  -- error: { error: string, code: ErrorCode }
  error        JSONB,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fulfillment_steps_order_step_unique UNIQUE (order_id, step_id)
);

-- RLS
ALTER TABLE fulfillment_steps ENABLE ROW LEVEL SECURITY;

-- Operador (service_role) acessa tudo
CREATE POLICY "fulfillment_steps_service_role" ON fulfillment_steps
  FOR ALL USING (auth.role() = 'service_role');

-- Cliente lê steps via access_token de order_reports (cobre auth e anônimos)
-- Acesso direto por user_id para clientes autenticados
CREATE POLICY "fulfillment_steps_client_read" ON fulfillment_steps
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE (user_id = auth.uid() AND auth.uid() IS NOT NULL)
         OR (user_id IS NULL AND customer_email IS NOT NULL)
    )
  );
-- Nota: acesso anônimo ao progresso é feito via /api/reports/[token] (service_role)
-- que serve order_reports + fulfillment_steps — sem auth do cliente

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillment_steps_order_id ON fulfillment_steps(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_steps_status ON fulfillment_steps(order_id, status);

COMMENT ON TABLE fulfillment_steps IS
  'Steps individuais de fulfillment por pedido. UNIQUE(order_id, step_id) garante idempotência.
   Idempotência via UPDATE ... WHERE status = pending — worker que chega depois faz skip seguro.
   result armazena dados LGPD-mascarados (mascaramento acontece ao salvar, não ao ler).';
