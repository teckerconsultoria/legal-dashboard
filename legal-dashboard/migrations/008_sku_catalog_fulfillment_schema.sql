-- Migration 008: SKU Catalog — fulfillment_schema
-- Cada SKU define o roteiro de steps Escavador (validado por FulfillmentSchemaZod no código).
-- Created: 2026-04-08

ALTER TABLE sku_catalog
  ADD COLUMN IF NOT EXISTS fulfillment_schema JSONB NOT NULL DEFAULT '{}';

-- ATENÇÃO: DEFAULT '{}' passa NOT NULL mas falha FulfillmentSchemaZod.parse().
-- Todo SKU DEVE ter fulfillment_schema válido via seed abaixo antes de ser usado.
-- O fulfillment engine valida o schema no início de processOrder* e marca o pedido
-- como dead com ErrorCode.SCHEMA_INVALID se o schema for inválido.
COMMENT ON COLUMN sku_catalog.fulfillment_schema IS
  'Roteiro de execução do SKU. Validado por FulfillmentSchemaZod (src/types/fulfillment.ts).
   required_inputs: ["oab_estado","oab_numero"] | ["numero_cnj"]
   steps[].fn: StepFn enum fixo no código (banco não inventa funções).
   ATENÇÃO: DEFAULT {} é inválido — todo SKU precisa de seed com schema completo.';

-- Seed: fulfillment_schema para os 3 SKUs existentes
-- Mapeia para os nomes de SKU do seed de migration 001 (Report Saúde, Report Priorização, Report Governança)
-- Se os nomes mudaram, os UPDATEs abaixo afetarão 0 linhas silenciosamente —
-- verificar com: SELECT name, fulfillment_schema FROM sku_catalog;
-- e corrigir os filtros WHERE ou reemitir os UPDATEs com os nomes corretos.

-- Report Simples (antigo "Report Saúde") — síncrono
UPDATE sku_catalog
SET fulfillment_schema = '{
  "version": "1.0",
  "sync": true,
  "required_inputs": ["oab_estado", "oab_numero"],
  "steps": [
    {
      "id": "lawyer_summary",
      "fn": "getLawyerSummary",
      "section": "resumo_advogado",
      "layer": 1
    },
    {
      "id": "processes",
      "fn": "getProcesses",
      "section": "carteira",
      "layer": 1,
      "params": { "limit": 100 }
    }
  ],
  "output_schema": {
    "sections": ["resumo_advogado", "carteira"]
  }
}'::jsonb
WHERE name = 'Report Saúde';

-- Report Smart (antigo "Report Priorização") — assíncrono
UPDATE sku_catalog
SET fulfillment_schema = '{
  "version": "1.0",
  "sync": false,
  "required_inputs": ["oab_estado", "oab_numero"],
  "steps": [
    {
      "id": "lawyer_summary",
      "fn": "getLawyerSummary",
      "section": "resumo_advogado",
      "layer": 1
    },
    {
      "id": "processes",
      "fn": "getProcesses",
      "section": "carteira",
      "layer": 1,
      "params": { "limit": 100 }
    },
    {
      "id": "movimentacoes",
      "fn": "getMovimentacoes",
      "section": "movimentacoes",
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 20,
      "params": { "limit": 100 }
    }
  ],
  "output_schema": {
    "sections": ["resumo_advogado", "carteira", "movimentacoes"]
  }
}'::jsonb
WHERE name = 'Report Priorização';

-- Report Pro (antigo "Report Governança") — assíncrono
UPDATE sku_catalog
SET fulfillment_schema = '{
  "version": "1.0",
  "sync": false,
  "required_inputs": ["oab_estado", "oab_numero"],
  "steps": [
    {
      "id": "lawyer_summary",
      "fn": "getLawyerSummary",
      "section": "resumo_advogado",
      "layer": 1
    },
    {
      "id": "processes",
      "fn": "getProcesses",
      "section": "carteira",
      "layer": 1,
      "params": { "limit": 100 }
    },
    {
      "id": "movimentacoes",
      "fn": "getMovimentacoes",
      "section": "movimentacoes",
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 30,
      "params": { "limit": 500 }
    },
    {
      "id": "case_cnj",
      "fn": "getCaseCNJ",
      "section": "processos_detalhados",
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 30,
      "condition": { "field": "staleness_days", "op": ">", "value": 30 }
    },
    {
      "id": "envolvidos",
      "fn": "getEnvolvidos",
      "section": "envolvidos",
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 30,
      "params": { "limit": 100 }
    },
    {
      "id": "documentos",
      "fn": "getDocumentosPublicos",
      "section": "documentos",
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 30,
      "params": { "limit": 50 }
    },
    {
      "id": "request_update",
      "fn": "requestUpdate",
      "section": null,
      "layer": 2,
      "foreach": "processes.items[*].numero",
      "foreach_limit": 30,
      "condition": { "field": "staleness_days", "op": ">", "value": 60 }
    }
  ],
  "output_schema": {
    "sections": ["resumo_advogado", "carteira", "movimentacoes", "processos_detalhados", "envolvidos", "documentos"]
  }
}'::jsonb
WHERE name = 'Report Governança';
