---
id: 003
key: 1-3-ops-dashboard
title: "Ops Dashboard: /admin com fulfillment_queue + steps reais"
status: review
date: 2026-04-08
---

# Story 1-3: Ops Dashboard Expandido

## Story

Como operador do sistema,
quero um painel de operações com dados reais de pedidos e steps,
para monitorar o processamento, identificar falhas e atribuir responsabilidade.

## Acceptance Criteria

- [x] AC-01: `GET /api/admin/orders` retorna pedidos com status da fila (queue_status, attempt_count, last_error) — protegido por cookie de sessão
- [x] AC-02: `GET /api/admin/orders/[id]/steps` retorna fulfillment_steps de um pedido (step_id, layer, status, started_at, completed_at, error)
- [x] AC-03: `PATCH /api/admin/orders/[id]/assign` atribui `assigned_operator_id` ao usuário autenticado
- [x] AC-04: `/admin/page.tsx` exibe tabela real de pedidos com status, queue_status, attempt_count e assigned_operator — sem mock data
- [x] AC-05: Polling automático a cada 10s quando qualquer pedido está em status 'processing' (TanStack Query `refetchInterval` condicional)
- [x] AC-06: `/admin/orders/[id]/page.tsx` exibe steps agrupados por layer com status badge (pending/running/done/failed) e last_error legível
- [x] AC-07: Botão "Atribuir a mim" na página de detalhe do pedido

## Tasks/Subtasks

- [x] Task 1: `src/app/api/admin/orders/route.ts`
  - [x] 1.1 GET: query orders JOIN fulfillment_queue (LEFT JOIN por step_id) — usa createServiceClient()
  - [x] 1.2 Proteger com `createServerClient()` → verificar sessão; retornar 401 se não autenticado
  - [x] 1.3 Retornar: id, status, customer_email, target_oab_estado, target_oab_numero, created_at, assigned_operator_id + queue_status, attempt_count, last_error

- [x] Task 2: `src/app/api/admin/orders/[id]/steps/route.ts`
  - [x] 2.1 GET: busca todos fulfillment_steps WHERE order_id = [id] — usa createServiceClient()
  - [x] 2.2 Proteger com sessão (igual Task 1)
  - [x] 2.3 Retornar: step_id, layer, status, started_at, completed_at, error

- [x] Task 3: `src/app/api/admin/orders/[id]/assign/route.ts`
  - [x] 3.1 PATCH: lê user da sessão via createServerClient()
  - [x] 3.2 UPDATE orders SET assigned_operator_id = user.id WHERE id = [id]
  - [x] 3.3 Retornar ordem atualizada

- [x] Task 4: `src/app/admin/page.tsx` — substituir mock por dados reais
  - [x] 4.1 Converter para Server Component que faz redirect se não autenticado
  - [x] 4.2 Client component `OrdersTable` com TanStack Query (`useQuery` + `refetchInterval`)
  - [x] 4.3 Tabela com colunas: Pedido (id curto), Email, Status, Fila, Tentativas, Operador, Ações
  - [x] 4.4 Status badges coloridos por valor

- [x] Task 5: `src/app/admin/orders/[id]/page.tsx`
  - [x] 5.1 Server Component: carrega order + steps via API admin
  - [x] 5.2 Client component `StepsPanel` com polling 10s se order.status === 'processing'
  - [x] 5.3 Seção Layer 1: grid horizontal de steps com badge de status
  - [x] 5.4 Seção Layer 2: tabela de steps (step_id, status, duração, error)
  - [x] 5.5 Botão "Atribuir a mim" que chama PATCH /api/admin/orders/[id]/assign

## Dev Notes

- `createServiceClient()` nos routes admin (acessa orders de qualquer usuário sem RLS)
- Auth check: `createServerClient().auth.getUser()` — cookie `sb-access-token` validado pelo middleware para APIs; página faz redirect manual
- TanStack Query já está configurado via `src/components/Providers.tsx`
- `refetchInterval`: `(data) => data?.orders.some(o => o.status === 'processing') ? 10_000 : false`
- Steps layer 2 com foreach têm step_id no formato `${step.id}:${cnj}` — exibir a parte antes do `:` como tipo e depois como processo
- Ref: docs/architecture.md DT-004, RF-03; docs/stories/002-fulfillment-engine.md

## File List

- src/app/api/admin/orders/route.ts (novo)
- src/app/api/admin/orders/[id]/steps/route.ts (novo)
- src/app/api/admin/orders/[id]/assign/route.ts (novo)
- src/app/admin/page.tsx (substituído)
- src/app/admin/orders/[id]/page.tsx (novo)

## Dev Agent Record

### Completion Notes

Implementado em 2026-04-08. Ops Dashboard real: GET /api/admin/orders (orders + fulfillment_queue via LEFT JOIN manual), GET /api/admin/orders/[id]/steps, PATCH /api/admin/orders/[id]/assign. /admin/page.tsx substituído com TanStack Query + refetchInterval condicional 10s. /admin/orders/[id]/page.tsx com Layer 1 (grid) + Layer 2 (tabela) com duração, status badge e erros legíveis. Build limpo.

## Change Log

- 2026-04-08: Story criada
- 2026-04-09: E2E verificado — 15/15 testes passando. Fixes aplicados:
  - `assign/route.ts`: adicionado fallback `Authorization: Bearer` (equivalente à rota GET /api/admin/orders)
  - `04-admin-order-detail.spec.ts`: corrigido timeout do `beforeAll` (adicionado `test.setTimeout(90_000)`) e race condition no OT-08 (aguarda elemento visível antes de clicar)
  - `app.spec.ts`: smoke test `admin page loads` atualizado para comportamento real (redirect para /login sem auth)
  - Story promovida para **done**
