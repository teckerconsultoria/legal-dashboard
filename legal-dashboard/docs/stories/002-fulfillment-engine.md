---
id: 002
key: 1-2-fulfillment-engine
title: "Fulfillment Engine: processOrderSync, executeStep, processBatch, enqueueOrder"
status: review
date: 2026-04-08
---

# Story 1-2: Fulfillment Engine Core

## Story

Como sistema de processamento de pedidos,
quero um fulfillment engine que execute os roteiros de SKU via Escavador API,
para que pedidos comprados no shop sejam processados automaticamente após o pagamento.

## Acceptance Criteria

- [x] AC-01: `enqueueOrder(orderId)` faz INSERT em `fulfillment_queue` com ON CONFLICT DO NOTHING (idempotente)
- [x] AC-02: `processOrderSync(orderId)` executa Layer 1 com Promise.all e Layer 2 com processBatch(batchSize=5), usado pelo webhook para SKUs sync
- [x] AC-03: `processOrderAsync(orderId)` usa mesma lógica de execução, chamado pelo cron para SKUs async
- [x] AC-04: `executeStep` clama o step via `UPDATE WHERE status='pending'` — skip seguro se já claimed; grava done/failed com LGPD masking at write-time
- [x] AC-05: `processBatch` retorna `PromiseSettledResult[]`, não silencia falhas
- [x] AC-06: FulfillmentSchemaZod validado no início de processOrder* — marca queue como dead com SCHEMA_INVALID se inválido
- [x] AC-07: Webhook `/api/webhooks/stripe` chama `processOrderSync` ou `enqueueOrder` após transição para paid
- [x] AC-08: Rota `POST /api/internal/cron-tick` protegida por `x-cron-secret`, busca até 5 pedidos pending e chama `processOrderAsync` para cada
- [x] AC-09: `scripts/cron-worker.ts` one-shot com `AbortSignal.timeout(55s)`
- [x] AC-10: Testes unitários para `processBatch` (6 casos), `enqueueOrder` (3 casos: conflict, error, success)

## Tasks/Subtasks

- [x] Task 1: `src/lib/fulfillment-engine.ts`
  - [x] 1.1 `enqueueOrder(orderId)` — INSERT ON CONFLICT DO NOTHING
  - [x] 1.2 `processBatch<T>` — retorna PromiseSettledResult[]
  - [x] 1.3 `executeStep(orderId, step, inputs, cnj, completedStepResults, supabase)` — claim, execute, save, mask
  - [x] 1.4 `resolveForeach(foreach, foreach_limit, completedStepResults)` — extrai CNJs do resultado de step pai
  - [x] 1.5 `dispatchStepFn(step, inputs, cnj, client)` — switch de StepFn para método EscavadorClient
  - [x] 1.6 `processOrder(orderId, supabase)` — orquestrador: valida schema, Layer1, Layer2, atualiza completion_status, email
  - [x] 1.7 `processOrderSync(orderId)` e `processOrderAsync(orderId)` — wrappers públicos
- [x] Task 2: Atualizar webhook `/api/webhooks/stripe/route.ts`
  - [x] 2.1 Importar `processOrderSync`, `enqueueOrder`, `sendOrderPaid`
  - [x] 2.2 Após `transitionOrderStatus('paid')`: verificar `sku.fulfillment_schema.sync` e chamar sync ou enqueue
- [x] Task 3: `src/app/api/internal/cron-tick/route.ts`
  - [x] 3.1 Validar `x-cron-secret`
  - [x] 3.2 SELECT 5 pending da `fulfillment_queue` (WHERE next_retry_at <= NOW())
  - [x] 3.3 Para cada: claim como 'processing', chamar processOrderAsync, marcar done/dead com backoff 2^attempt min
  - [x] 3.4 Detectar stuck orders (processing > 20min) e alertar via sendOperatorAlert
- [x] Task 4: `scripts/cron-worker.ts` — one-shot com AbortSignal.timeout(55s)
- [x] Task 5: Testes unitários — 9 testes (processBatch 6, enqueueOrder 3)

## Dev Notes

- `executeStep` usa `UPDATE WHERE status='pending'` para claim atômico — se retornar 0 rows, skip
- LGPD masking: `maskEnvolvidos(result)` antes de salvar em `fulfillment_steps.result`
- `dispatchStepFn`: switch sobre `StepFn` — sem eval, sem string interpolation
- `foreach` resolve: busca `fulfillment_steps` com step_id do step pai, extrai `result.items[*].numero`
- `condition`: `ConditionSchema` — evaluator simples: `ops[cond.op](stepResult[cond.field], cond.value)`
- `order_reports`: criar row (upsert) no início de processOrder; atualizar sections + completion_status ao final
- Email: `sendOrderPaid` disparado no webhook ao fazer paid; `sendOrderDelivered` ao completion_status = complete
- Webhook retorna 500 se processOrderSync falhar → Stripe retenta → idempotência garante skip de steps done
- Ref: docs/architecture.md ADR-001..006, DT-001..005, Step 5; docs/stories/001-fulfillment-foundation.md

## Dev Agent Record

### Completion Notes

Implementado em 2026-04-08. Fulfillment engine completo com orquestração Layer1/Layer2, idempotência via UPDATE WHERE status='pending', LGPD masking at write-time, ConditionSchema evaluator sem eval, dispatchStepFn switch fixo. Webhook integrado com dispatch sync/async. Cron-tick com stuck detection e backoff 2^attempt. 9 testes passando.

### Code Review Findings (2026-04-08)

| ID | Sev | Finding | Ação |
|----|-----|---------|------|
| H-01 | High | `completedStepResults` não pré-carregado do DB em retry → Layer 2 foreach recebe lista vazia | PATCH |
| H-02 | High | UPDATE `paid→processing` não verificado → order `delivered` pode ser reprocessada | PATCH |
| H-03 | High | `SCHEMA_INVALID` retenta 3x no cron em vez de morrer imediatamente | PATCH |
| H-04 | Med | `dispatchStepFn` sem `default` throw explícito em runtime | PATCH |
| D-01 | Low | `audit_logs` não gravado pelo engine (só webhook) | DEFER |
| X-01 | — | `maskResult` `cpf_cnpj` bug — já corrigido no código | DISMISS |
| X-02 | — | `initFulfillmentSteps` row órfão para foreach — não ocorre no fluxo atual | DISMISS |
| X-03 | — | `executeStep` sem unit tests — fora do AC-10 | DISMISS |

## File List

- src/lib/fulfillment-engine.ts (novo)
- src/lib/mailer.ts (adicionado sendOperatorAlert)
- src/app/api/webhooks/stripe/route.ts (integração fulfillment)
- src/app/api/internal/cron-tick/route.ts (novo)
- scripts/cron-worker.ts (novo)
- tests/fulfillment-engine.test.ts (novo)

## Change Log

- 2026-04-08: Story implementada — fulfillment engine core + webhook + cron-tick + cron-worker
- 2026-04-08: Code review patches — P-01 retry resilience (pre-load Layer1 do DB), P-02 guard terminal orders + status check, P-03 SCHEMA_INVALID → dead imediato, P-04 dispatchStepFn default throw
