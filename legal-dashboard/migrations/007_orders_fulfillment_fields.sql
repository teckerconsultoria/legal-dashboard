-- Migration 007: Orders — campos de fulfillment
-- Adiciona inputs do alvo (OAB/CNJ) e operador responsável.
-- Created: 2026-04-08

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS target_oab_estado      TEXT,
  ADD COLUMN IF NOT EXISTS target_oab_numero      TEXT,
  ADD COLUMN IF NOT EXISTS target_numero_cnj      TEXT,
  ADD COLUMN IF NOT EXISTS assigned_operator_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index para lookup por operador no ops dashboard
CREATE INDEX IF NOT EXISTS idx_orders_assigned_operator ON orders(assigned_operator_id)
  WHERE assigned_operator_id IS NOT NULL;

COMMENT ON COLUMN orders.target_oab_estado IS
  'Estado da OAB do advogado alvo (required_input do fulfillment_schema)';
COMMENT ON COLUMN orders.target_oab_numero IS
  'Número da OAB do advogado alvo (required_input do fulfillment_schema)';
COMMENT ON COLUMN orders.target_numero_cnj IS
  'Número CNJ do processo alvo — para SKU Report Processo Único';
COMMENT ON COLUMN orders.assigned_operator_id IS
  'Operador responsável pelo processamento. NULL = não atribuído.';
