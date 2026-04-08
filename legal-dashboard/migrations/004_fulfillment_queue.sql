-- Migration 004: Fulfillment Queue
-- Fila de processamento assíncrono para SKUs Smart/Pro
-- Created: 2026-04-08

CREATE TABLE IF NOT EXISTS fulfillment_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'done', 'dead')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error    JSONB,
  scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fulfillment_queue_order_id_unique UNIQUE (order_id)
);

-- RLS
ALTER TABLE fulfillment_queue ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler/escrever (cron + webhook usam service key)
CREATE POLICY "fulfillment_queue_service_role" ON fulfillment_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillment_queue_status ON fulfillment_queue(status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_queue_next_retry ON fulfillment_queue(next_retry_at)
  WHERE status IN ('pending', 'processing');

COMMENT ON TABLE fulfillment_queue IS
  'Fila de processamento assíncrono. UNIQUE(order_id) garante idempotência no enqueue.
   Cron ignora rows com next_retry_at > NOW(). Após 3 tentativas: status = dead.';
