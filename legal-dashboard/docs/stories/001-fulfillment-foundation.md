---
id: 001
key: 1-1-fulfillment-foundation
title: "Fundação do Fulfillment Engine: Migrations + Types"
status: done
date: 2026-04-08
---

# Story 1-1: Fundação do Fulfillment Engine

## Story

Como desenvolvedor implementando o fulfillment engine,
quero as migrations do banco e os tipos TypeScript da fundação,
para que os demais módulos (fulfillment-engine, cron, rotas) possam ser construídos sobre uma base sólida.

## Acceptance Criteria

- [x] AC-01: Migration 004 cria `fulfillment_queue` com campos `attempt_count`, `next_retry_at`, `last_error`, UNIQUE em `order_id`
- [x] AC-02: Migration 005 cria `fulfillment_steps` como tabela separada com `UNIQUE(order_id, step_id)`
- [x] AC-03: Migration 006 cria `order_reports` com `access_token`, `completion_status`, TTL
- [x] AC-04: Migration 007 adiciona campos de fulfillment em `orders` (`target_oab_estado`, `target_oab_numero`, `target_numero_cnj`, `assigned_operator_id`)
- [x] AC-05: Migration 008 adiciona `fulfillment_schema` jsonb em `sku_catalog`
- [x] AC-06: `src/types/fulfillment.ts` exporta `StepFn` enum, `FulfillmentSchemaZod`, `StepDefinition`, `FulfillmentResult`
- [x] AC-07: `src/types/errors.ts` exporta `ErrorCode` enum
- [x] AC-08: `src/types/orders.ts` atualizado com campos de fulfillment e `SKU.fulfillment_schema`
- [x] AC-09: Testes unitários para Zod schema validation (válido, inválido, required_inputs, foreach)

## Tasks/Subtasks

- [x] Task 1: Migrations SQL (004-008)
  - [x] 1.1 004_fulfillment_queue.sql
  - [x] 1.2 005_fulfillment_steps.sql
  - [x] 1.3 006_order_reports.sql
  - [x] 1.4 007_orders_fulfillment_fields.sql
  - [x] 1.5 008_sku_catalog_fulfillment_schema.sql
- [x] Task 2: src/types/errors.ts
- [x] Task 3: src/types/fulfillment.ts
- [x] Task 4: Atualizar src/types/orders.ts
- [x] Task 5: Testes unitários para FulfillmentSchemaZod

## Dev Notes

- `fulfillment_steps` é tabela separada (não JSONB array) — evita race condition entre webhook e cron
- `fulfillment_queue` UNIQUE em `order_id` garante idempotência no enqueue
- LGPD: mascaramento acontece ao SALVAR (write-time) — `fulfillment_steps.result` já armazena mascarado
- `StepFn` enum fixo no código — banco não inventa funções
- Zod schema validado no início de `processOrder*`, não dentro de `executeStep`
- Ref: docs/architecture.md ADR-001..006, DT-001..005, Step 5

## Dev Agent Record

### Implementation Notes

- Migrations seguem convenção do projeto: `CREATE TABLE IF NOT EXISTS`, RLS explícito, service_role policy
- `zod` já presente como dependência (verificar package.json); se não, instalar
- Enum `StepFn` alinhado com métodos do EscavadorClient existente + métodos a adicionar (getDocumentosPublicos, getEnvolvidos)

### Completion Notes

Implementado em 2026-04-08.

## File List

- migrations/004_fulfillment_queue.sql
- migrations/005_fulfillment_steps.sql
- migrations/006_order_reports.sql
- migrations/007_orders_fulfillment_fields.sql
- migrations/008_sku_catalog_fulfillment_schema.sql
- src/types/errors.ts
- src/types/fulfillment.ts
- src/types/orders.ts (modificado)
- tests/fulfillment-schema.test.ts

## Senior Developer Review (AI)

**Data:** 2026-04-08 | **Outcome:** Changes Requested
**Camadas:** Blind Hunter ✅ | Edge Case Hunter ✅ | Acceptance Auditor ✅
**Dismissed:** 3 (ruído/falsos positivos)

### Review Findings

#### Decision-Needed

- [x] [Review][Decision] D-01: Manter `as const` — decisão unânime Winston + Amelia. `z.enum(StepFnValues)` é idiomático com Zod v4, iterável, sem overhead de enum nativo TypeScript.
- [x] [Review][Decision] D-02: Converter `condition` para `ConditionSchema` (objeto estruturado) — sem eval, parse Zod seguro, evaluator no engine vira switch simples. Aplicado em `StepDefinitionZod` e seeds.

#### Patch

- [x] [Review][Patch] P-01 [High] `getEnvolvidos` e `getDocumentosPublicos` adicionados ao `EscavadorClient` [`src/lib/escavador.ts`]
- [x] [Review][Patch] P-02 [High] RLS `client_read` corrigido para compradores anônimos em `fulfillment_steps` e `order_reports` [`migrations/005`, `migrations/006`]
- [x] [Review][Patch] P-03 [High] JSONPath corrigido: `carteira.items[*].numero_cnj` → `processes.items[*].numero` [`migrations/008_sku_catalog_fulfillment_schema.sql`]
- [x] [Review][Patch] P-04 [Med] Comentário de guarda adicionado ao DEFAULT '{}' com instrução de validação [`migrations/008_sku_catalog_fulfillment_schema.sql`]
- [x] [Review][Patch] P-05 [Med] Aviso de verificação de rows afetadas adicionado ao seed [`migrations/008_sku_catalog_fulfillment_schema.sql`]
- [x] [Review][Patch] P-06 [Low] `required_inputs` com `.min(1)` + testes de array vazio e ConditionSchema [`src/types/fulfillment.ts`, `tests/fulfillment-schema.test.ts`]
- [x] [Review][Patch] P-07 [Low] `last_error.code` e `error.code` tipados como `ErrorCode` [`src/types/fulfillment.ts`]

#### Defer

- [x] [Review][Defer] W-01: `requestUpdate` sem idempotência na Escavador API — depende do fulfillment-engine (próxima story)
- [x] [Review][Defer] W-02: `FulfillmentResult` sem campo de erro/`ErrorCode` — depende do fulfillment-engine
- [x] [Review][Defer] W-03: `orders.status` sem CHECK constraint — pré-existente (migration 001)
- [x] [Review][Defer] W-04: `access_token` sem hash nem revogação por uso — MVP scope aceitável
- [x] [Review][Defer] W-05: Gap na sequência de migration (003 ausente) — by design, documentado
- [x] [Review][Defer] W-06: `fulfillment_queue UNIQUE` bloqueia requeue após `dead` — comportamento intencional; operador deve deletar a linha para reenfileirar
- [x] [Review][Defer] W-07: RLS default-deny do Supabase cobre ausência de policy adicional — comportamento correto da plataforma

## Change Log

- 2026-04-08: Story criada e implementada — fundação do fulfillment engine
