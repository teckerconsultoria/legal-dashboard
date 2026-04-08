---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/sprint-change-proposal-2026-04-08.md
  - docs/arquitetura-modular-painel-processual.md
  - docs/deep-research-report.md
  - docs/deep-research-report__1_.md
  - docs/Modelo comercial e acompanhamento via dashboard em um modelo Inquest-like.md
workflowType: architecture
project_name: Legal Dashboard (Inquest-like)
user_name: Lemos
date: '2026-04-08'
---

# Architecture Decision Document
# Legal Dashboard — Inquest-like Operations Platform

_Documento construído colaborativamente. Seções adicionadas conforme decisões arquiteturais são tomadas._

---

## Project Context Analysis

### Requirements Overview

**Requisitos Funcionais:**

| # | Requisito | Complexidade |
|---|---|---|
| RF-01 | Shop + checkout Stripe (anônimo e autenticado) | ✅ Implementado |
| RF-02 | Fulfillment engine: roteiro de steps Escavador por SKU | Alta |
| RF-03 | Ops dashboard: monitoramento de fila + intervenção em steps falhos | Alta |
| RF-04 | Client tracking `/meus-reports` com link tokenizado + login opcional | Média |
| RF-05 | Coleta de `required_inputs` (OAB/CNJ) no shop antes do checkout | Média |
| RF-06 | Email transacional: `order_paid` + `order_delivered` | Baixa |
| RF-07 | Re-execução de step individual (recuperação de falha) | Média |
| RF-08 | Controle de roles: operator (monitoramento) vs. client (leitura própria) | Alta |

**Requisitos Não-Funcionais:**

- **Latência Escavador:** rate limit 500 req/min; Reports Pro fazem 50–100+ calls — controle de concorrência obrigatório (lotes de 5)
- **LGPD:** dados pessoais de terceiros (CPF, nomes de envolvidos) em `order_reports` separada de `orders`; retenção independente
- **Custo API:** header `Creditos-Utilizados` capturado por step em `order_reports.metadata.credits_used_by_step`
- **Auditoria:** `audit_logs` existente estendido para transições de fulfillment
- **Isolamento de dados:** RLS Supabase — cliente lê apenas seus pedidos via `user_id`

**Escala e Complexidade:**

- Domínio primário: Full-stack (Next.js 16 App Router + Supabase + API externa assíncrona)
- Complexidade: **Alta** — processamento multi-step com dependências entre calls e estados intermediários persistidos
- Componentes arquiteturais: 10

**SLAs por SKU:**

| SKU | Estratégia | SLA |
|---|---|---|
| Report Simples | Síncrono (webhook inline) | < 60s |
| Report Processo Único | Síncrono (webhook inline, 5 calls paralelas) | < 60s |
| Report Smart | Assíncrono (fulfillment_queue + cron) | < 5 min |
| Report Pro | Assíncrono (fulfillment_queue + cron, múltiplos ciclos) | < 15 min |

---

### Architecture Decision Records

**ADR-001 — Background Job: Híbrido (webhook sync + fulfillment_queue async)**

Contexto: SKUs Smart/Pro requerem 20–100+ calls. Next.js tem timeout ~30s.

Decisão: **Híbrido por SKU**

```
Stripe webhook (payment_intent.succeeded):
  1. order: paid → processing
  2. Carrega sku_catalog.fulfillment_schema
  3. SE sync (Simples, Processo Único):
       → processOrder() inline (await)
       → order: processing → delivered
  4. SE async (Smart, Pro):
       → INSERT INTO fulfillment_queue (order_id) ON CONFLICT DO NOTHING
       → retorna 200

Cron VPS a cada 1 min:
  → SELECT FROM fulfillment_queue WHERE status='pending' LIMIT 5
  → POST /api/internal/process-order (service key)
  → Idempotente: verifica fulfillment_steps antes de re-executar step já done
```

Schema `fulfillment_queue`:
```sql
CREATE TABLE fulfillment_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid REFERENCES orders(id) UNIQUE,
  status       text DEFAULT 'pending'
               CHECK (status IN ('pending','processing','done','dead')),
  attempt      int DEFAULT 0,
  last_error   text,
  scheduled_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);
```

Rationale: UNIQUE em `order_id` garante idempotência. `dead` (após 3 tentativas) aparece no ops dashboard como alerta. Cron é o único executor de pedidos async — webhook nunca toca nos steps de async.

---

**ADR-002 — Retry Strategy: por step com backoff simples (3 tentativas)**

Decisão: `Promise.allSettled` em lotes de 5 por camada do grafo. Steps com erro → `fulfillment_steps[id].status = "failed"`. Relatório com steps `dead` → `completion_status = "partial"`.

```
Grafo de dependências:
  Camada 1 (paralelo):
    getLawyerSummary ──┐
                       ├── Promise.all
    getProcesses ──────┘
         │
         └── [lista de CNJs]
  
  Camada 2 (foreach, lotes de 5, allSettled):
    getMovimentacoes(cnj) × N
    getCaseCNJ(cnj) × N         → Promise.allSettled por lote de 5
    getEnvolvidos(cnj) × N
    requestUpdate(cnj) × M      → só staleness > 60 dias
```

---

**ADR-003 — Armazenamento do Report: tabela `order_reports` separada**

```sql
CREATE TABLE order_reports (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                uuid REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  sections                jsonb NOT NULL DEFAULT '{}',
  fulfillment_steps       jsonb NOT NULL DEFAULT '[]',
  metadata                jsonb NOT NULL DEFAULT '{}',
  -- metadata: { escavador_version, timestamp_fetched, credits_used_by_step: {...} }
  completion_status       text DEFAULT 'pending'
                          CHECK (completion_status IN ('pending','complete','partial','failed')),
  access_token            uuid DEFAULT gen_random_uuid(),
  access_token_expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
-- RLS: cliente lê via JOIN orders WHERE orders.user_id = auth.uid()
-- Endpoint público: GET /api/reports/[token] (sem auth, com TTL check)
```

Rationale LGPD: `DELETE FROM order_reports WHERE order_id = X` remove dados pessoais sem perder histórico comercial em `orders`.

---

**ADR-004 — Acesso do Cliente: link tokenizado gerado no `order_paid`**

Decisão: token gerado na criação de `order_reports` (webhook `paid`). Email `order_paid` já inclui link `/meus-reports?token=XYZ`. Quando cliente abre: vê status atual (processando ou entregue). Link único do início ao fim — sem segundo email com novo link.

Endpoint público:
```
GET /api/reports/[token]
  → SELECT FROM order_reports WHERE access_token = $token
      AND access_token_expires_at > now()
  → 404 se expirado
  → Retorna sections com dados LGPD mascarados (já mascarados ao salvar)
```

---

**ADR-005 — Créditos Escavador: log passivo em metadata**

`EscavadorClient` lê header `Creditos-Utilizados` por request. Salva em `order_reports.metadata.credits_used_by_step[step_id]`. Dashboard de custo: fase posterior.

---

**ADR-006 — Resolução de Gaps de Implementação**

**Gap 1 — EscavadorClient: adicionar métodos faltantes**

```typescript
// src/lib/escavador.ts
async getDocumentosPublicos(numero_cnj: string, limit = 50): Promise<DocumentosResponse>
  → GET /processos/numero_cnj/{cnj}/documentos-publicos

async getEnvolvidos(numero_cnj: string, limit = 50): Promise<EnvolvidosResponse>
  → GET /processos/numero_cnj/{cnj}/envolvidos
```

**Gap 2 — Schema de fulfillment: dinâmico no banco + enum fixo no código**

```typescript
// src/types/fulfillment.ts
type StepFn =
  | 'getLawyerSummary' | 'getProcesses' | 'getMovimentacoes'
  | 'getCaseCNJ' | 'getEnvolvidos' | 'getDocumentosPublicos'
  | 'getStatusAtualizacao' | 'requestUpdate'

const FulfillmentSchemaZod = z.object({
  version: z.string(),
  required_inputs: z.array(z.enum(['oab_estado', 'oab_numero', 'numero_cnj'])),
  steps: z.array(z.object({
    id: z.string(),
    fn: z.enum(StepFnValues),   // enum fixo — banco não inventa funções
    section: z.string(),
    params: z.record(z.unknown()).optional(),
    foreach: z.string().optional(),   // JSONPath ex: "processes.items[*].numero"
    condition: z.string().optional(), // ex: "staleness > 60"
  })),
})
```

**Gap 3 — Transaction boundaries: por step (não por pedido)**

Cada step é transação independente no Supabase. Pedido inteiro NÃO é uma transação única (lock de DB por 15min inviável). Idempotência garante re-execução segura.

**Gap 4 — Email transacional: Nodemailer + Hostinger SMTP**
- `src/lib/mailer.ts` ✅ implementado
- `sendOrderPaid()` → inclui link `/meus-reports?token=XYZ`
- `sendOrderDelivered()` → notifica conclusão (mesmo link)
- SMTP: `smtp.hostinger.com:465 SSL`, remetente `alessandro.lemos@teckerconsulting.com.br`

---

### Preocupações Transversais

1. **Orquestração clara:** webhook executa sync inline OU enfileira async. Nunca os dois para o mesmo pedido.
2. **LGPD ao salvar:** mascarar CPF/CNPJ/nomes de envolvidos em `lgpd.ts` antes de persistir em `order_reports.sections`
3. **Observabilidade:** `fulfillment_steps[step_id].status` + `completion_status` visíveis no ops dashboard sem log externo
4. **Custo Escavador:** rastreado passivamente em `metadata.credits_used_by_step`
5. **EscavadorClient incompleto:** adicionar `getDocumentosPublicos` e `getEnvolvidos` antes do fulfillment engine

---

## Starter Template & Stack

**Projeto brownfield** — stack já inicializado e em produção parcial.

| Categoria | Decisão | Versão |
|---|---|---|
| Framework | Next.js App Router | 16 |
| UI Library | React | 19 |
| Language | TypeScript strict | — |
| Styling | Tailwind CSS | v4 |
| Auth + DB | Supabase | latest |
| Payments | Stripe | latest |
| Server State | TanStack Query | v5 |
| Client State | Zustand | v4 |
| Testing | Vitest + Playwright | — |
| Email | Nodemailer + Hostinger SMTP | — |
| Validation | Zod | a instalar |

**Estrutura de projeto:**
```
src/app/          — App Router (pages + API routes)
src/lib/          — escavador, cache, rate-limit, mailer, fulfillment-engine (a criar)
src/types/        — index.ts, orders.ts, fulfillment.ts (a criar)
src/utils/        — Supabase client/server
migrations/       — SQL migrations (004–007 a criar)
scripts/          — cron-worker entry point (a criar)
docs/             — planning artifacts
```

**Itens faltantes identificados (priorizados):**

| Item | Tipo | Prioridade |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` | Env var | 🚨 Crítico |
| `zod` (+ validação semântica do FulfillmentSchema) | npm | Alta |
| `src/lib/fulfillment-engine.ts` | Módulo | Alta |
| `src/types/fulfillment.ts` | Types | Alta |
| `src/app/api/internal/cron-tick/route.ts` | Rota | Alta |
| `src/app/api/orders/[id]/fulfill/route.ts` | Rota | Alta |
| `src/app/api/reports/[token]/route.ts` | Rota | Alta |
| `src/app/meus-reports/page.tsx` | Page | Média |
| Migrations 004–007 | SQL | Alta |
| `CRON_SECRET` no `.env.local` | Env var | Alta |
| Cron entry na VPS (crontab) | Infra | Alta |

---

---

## Decisões Transversais (Step 4 — Occam's Razor)

**DT-001 — Identificação do operador: `OPERATOR_EMAIL` env var**

Contexto: Emails de alerta de falha de cron precisam de um destinatário.

Decisão: `OPERATOR_EMAIL` no `.env.local`. Sem tabela de roles. Cron lê env var e dispara alerta via Nodemailer existente.

Rationale: Um único operador no MVP — tabela seria over-engineering. Env var cobre o caso e é reversível.

---

**DT-002 — Mascaramento LGPD: na camada de API (read-time)**

Contexto: Dados pessoais (CPF, CNPJ, nomes) em `order_reports.sections` — quando mascarar?

Decisão: Mascarar ao **salvar** em `order_reports.sections` via `src/lib/lgpd.ts`. Dados mascarados em repouso.

Rationale: Mascarar uma vez (write) é mais simples e seguro do que mascarar em cada read. Endpoint público `/api/reports/[token]` serve dados já mascarados sem lógica adicional.

---

**DT-003 — Formato de erro: `{ error, code }` + enum `ErrorCode`**

Contexto: Rotas de fulfillment retornam erros de naturezas distintas (timeout, rate-limit, step falhou).

Decisão:
```typescript
// src/types/errors.ts
export enum ErrorCode {
  STEP_TIMEOUT    = 'STEP_TIMEOUT',
  RATE_LIMIT      = 'RATE_LIMIT',
  STEP_FAILED     = 'STEP_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  UNAUTHORIZED    = 'UNAUTHORIZED',
}
// Response: { error: string, code: ErrorCode }
```

Rationale: Enum fixo permite o ops dashboard filtrar e exibir ações por tipo sem parsing de strings.

---

**DT-004 — Polling do ops dashboard: TanStack `refetchInterval` condicional**

Contexto: Dashboard precisa mostrar progresso de steps em tempo real para pedidos `processing`.

Decisão:
```typescript
useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetchOrder(orderId),
  refetchInterval: (data) =>
    data?.status === 'processing' ? 10_000 : false,
})
```

Rationale: 10s é suficiente para SLAs de 5–15min. Polling para automaticamente quando pedido sai de `processing`. Sem WebSocket nem SSE no MVP.

---

**DT-005 — Monitoramento do cron: auto-detecção de pedidos travados**

Contexto: Pedidos `processing` há mais de 20 min indicam worker morreu sem atualizar status.

Decisão: Ao início de cada tick do cron:
```sql
SELECT * FROM fulfillment_queue
WHERE status = 'processing'
  AND scheduled_at < now() - interval '20 minutes'
```
→ Para cada resultado: `status = 'dead'`, `last_error = 'timeout'`, envia email via Nodemailer para `OPERATOR_EMAIL`.

Rationale: Cron que já roda a cada minuto detecta stuck orders sem processo externo adicional. Usa infraestrutura já planejada (Nodemailer + OPERATOR_EMAIL).

---

---

## Padrões e Convenções (Step 5)

### Estrutura de Módulos

```
src/lib/
  escavador.ts              — EscavadorClient + getDocumentosPublicos + getEnvolvidos
  fulfillment-engine.ts     — processOrderSync(), enqueueOrder(), executeStep(), processBatch()
  mailer.ts                 — sendOrderPaid(), sendOrderDelivered(), sendOperatorAlert()
  cache.ts                  — TTL cache (existente)
  rate-limit.ts             — rate limiter (existente)
  lgpd.ts                   — maskCPF(), maskName() — mascaramento ao SALVAR (write-time)

src/types/
  index.ts                  — tipos de processos (existente)
  orders.ts                 — OrderStatus enum (existente)
  fulfillment.ts            — StepFn enum, FulfillmentSchema Zod, StepDefinition (a criar)
  errors.ts                 — ErrorCode enum (a criar)

src/app/api/
  internal/cron-tick/
    route.ts                — POST, protegido por x-cron-secret header
  orders/[id]/
    fulfill/route.ts        — POST (operador, service role), re-execução de step individual
    route.ts                — GET (polling do dashboard, 10s)
  reports/[token]/
    route.ts                — GET público, sem auth, TTL check
  webhooks/stripe/
    route.ts                — existente; adicionar processOrderSync() + enqueueOrder()

src/app/
  meus-reports/page.tsx     — client tracking via ?token=
  admin/page.tsx            — ops dashboard: fila + steps + re-execução

scripts/
  cron-worker.ts            — one-shot script (chamado pelo crontab da VPS, não processo persistente)

migrations/
  004_fulfillment_queue.sql
  005_fulfillment_steps.sql  — tabela separada (não JSONB em orders)
  006_order_reports.sql
  007_orders_fulfillment_fields.sql
  008_sku_catalog_fulfillment_schema.sql
```

---

### Contrato do Fulfillment Engine

```typescript
// src/lib/fulfillment-engine.ts

interface FulfillmentEngine {
  // Chamado pelo webhook Stripe (SKUs sync: Simples, Processo Único)
  processOrderSync(orderId: string): Promise<void>
  // Chamado pelo cron via /api/internal/cron-tick (SKUs async: Smart, Pro)
  processOrderAsync(orderId: string): Promise<void>
  // Unidade atômica — chamada por ambos os fluxos e pela rota de re-execução
  executeStep(orderId: string, step: StepDefinition): Promise<void>
}

// Validação do schema do SKU ocorre NO INÍCIO de processOrder*, não dentro de executeStep
const schema = FulfillmentSchemaZod.parse(sku.fulfillment_schema) // lança se inválido
```

---

### `fulfillment_steps` — Tabela Separada (não JSONB array)

**Decisão crítica (validada em Party Mode):** JSONB array não é atômico para updates concorrentes. Race condition entre webhook e cron corrupto o estado de steps.

```sql
-- migrations/005_fulfillment_steps.sql
CREATE TABLE fulfillment_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  step_id      text NOT NULL,
  layer        integer NOT NULL,          -- 1 ou 2
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','done','failed')),
  result       jsonb,                     -- mascarado LGPD ao salvar
  error        jsonb,                     -- { error, code: ErrorCode }
  started_at   timestamptz,
  completed_at timestamptz,
  CONSTRAINT uq_order_step UNIQUE (order_id, step_id)
);
```

**Idempotência via `UPDATE ... WHERE status = 'pending'`:**

```typescript
// só clama o step se ainda 'pending' — outro worker que chegou primeiro é ignorado
const { data: claimed } = await supabase
  .from('fulfillment_steps')
  .update({ status: 'running', started_at: new Date().toISOString() })
  .eq('order_id', orderId)
  .eq('step_id', step.id)
  .eq('status', 'pending')
  .select('id')

if (!claimed?.length) return // outro worker clamou — skip seguro
```

**Regra:** `executeStep` **nunca lança sem antes gravar o status final**. Steps não podem ficar presos em `running`.

---

### `fulfillment_queue` — Campos de Retry

```sql
-- migrations/004_fulfillment_queue.sql
CREATE TABLE fulfillment_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid REFERENCES orders(id) UNIQUE,
  status        text DEFAULT 'pending'
                CHECK (status IN ('pending','processing','done','dead')),
  attempt_count int DEFAULT 0,
  next_retry_at timestamptz DEFAULT now(),
  last_error    jsonb,
  scheduled_at  timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);
-- cron ignora rows WHERE next_retry_at > NOW()
-- após 3 tentativas: status = 'dead', alerta para OPERATOR_EMAIL
```

---

### `processBatch` — Assinatura Correta

```typescript
// retorna resultados para o caller inspecionar falhas — nunca silencia
async function processBatch<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  batchSize = 5
): Promise<PromiseSettledResult<void>[]> {
  const results: PromiseSettledResult<void>[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...await Promise.allSettled(batch.map(fn)))
  }
  return results
}
```

---

### Webhook Stripe — Fluxo Completo Pós-`paid`

```typescript
// src/app/api/webhooks/stripe/route.ts
case 'checkout.session.completed': {
  await transitionOrderStatus(orderId, 'paid', { ... })

  if (isSyncSku(sku)) {
    // Simples / Processo Único — inline, cabe em <30s (limite Stripe)
    await processOrderSync(orderId)
  } else {
    // Smart / Pro — enfileira, cron processa
    await enqueueOrder(orderId) // INSERT ... ON CONFLICT DO NOTHING
  }
  break
}
// Se processOrderSync falhar → webhook retorna 500 → Stripe retenta
// executeStep é idempotente: steps 'done' são pulados no retry
```

---

### Cron Worker — One-Shot (não processo persistente)

```typescript
// scripts/cron-worker.ts — chamado pelo crontab, morre após cada execução
async function main() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/cron-tick`, {
    method: 'POST',
    headers: { 'x-cron-secret': process.env.CRON_SECRET! },
    signal: AbortSignal.timeout(55_000), // morre antes do próximo minuto
  })
  if (!res.ok) { console.error(await res.text()); process.exit(1) }
  process.exit(0)
}
main().catch((err) => { console.error(err); process.exit(1) })
```

**Crontab na VPS:**
```bash
* * * * * /usr/bin/node /app/scripts/cron-worker.js >> /var/log/legal-cron.log 2>&1
```

Alternativa ainda mais simples (sem Node.js na VPS):
```bash
* * * * * curl -s -m 55 -H "x-cron-secret: $CRON_SECRET" \
  https://app.domain.com/api/internal/cron-tick >> /var/log/cron.log 2>&1
```

---

### Clientes Supabase por Contexto

| Contexto | Cliente | Motivo |
|---|---|---|
| Stripe webhook | `createServiceClient()` | Sem sessão; cross-user |
| `/api/internal/cron-tick` | `createServiceClient()` | Sem sessão; cross-user |
| `/api/orders/[id]/fulfill` | `createServiceClient()` | Operador acessa pedidos de qualquer user |
| `/api/reports/[token]` | `createServiceClient()` | Lookup por token sem auth |
| `/api/checkout` (anônimo) | `createServiceClient()` | Cria order sem violar RLS de user |
| `/api/checkout` (autenticado) | `createServerClient()` | RLS valida dono do pedido |
| Admin dashboard (Server Component) | `createServerClient()` | RLS valida role do operador |
| `/meus-reports` (Server Component) | `createServerClient()` | RLS via `auth.uid()` |

---

### Restrições Técnicas

- Next.js App Router: timeout ~30s → fulfillment async obrigatório para Smart/Pro
- Supabase: sem background jobs nativos → resolvido via `fulfillment_queue` + cron VPS
- Hostinger VPS: Linux 24/7 com cron — asset arquitetural central
- Rate limit Escavador: 500 req/min → lotes de 5 com `Promise.allSettled`

---

## Validação de Completude (Step 6)

### Cobertura de Requisitos Funcionais

| RF | Requisito | Coberto por |
|---|---|---|
| RF-01 | Shop + checkout Stripe (anônimo e autenticado) | ✅ Implementado (Tier 3) |
| RF-02 | Fulfillment engine: roteiro de steps Escavador por SKU | ✅ ADR-001..006 + Padrões Step 5 |
| RF-03 | Ops dashboard: monitoramento de fila + intervenção em steps falhos | ✅ `/admin`, polling TanStack 10s, rota `/api/orders/[id]/fulfill` |
| RF-04 | Client tracking `/meus-reports` com link tokenizado + login opcional | ✅ ADR-004, `order_reports.access_token` |
| RF-05 | Coleta de `required_inputs` (OAB/CNJ) no shop antes do checkout | ✅ Decisão 2 — `fulfillment_schema.required_inputs` |
| RF-06 | Email transacional: `order_paid` + `order_delivered` | ✅ `src/lib/mailer.ts` implementado |
| RF-07 | Re-execução de step individual (recuperação de falha) | ✅ `POST /api/orders/[id]/fulfill` com `{ step_id }` |
| RF-08 | Controle de roles: operator vs. client | ✅ DT-001 (OPERATOR_EMAIL), RLS + createServiceClient() |

### Cobertura de Requisitos Não-Funcionais

| RNF | Status | Decisão |
|---|---|---|
| Rate limit Escavador (lotes de 5, 500 req/min) | ✅ | `processBatch(batchSize=5)` + `Promise.allSettled` |
| LGPD: dados pessoais isolados | ✅ | `order_reports` separada de `orders`; mascaramento write-time |
| Custo API: `credits_used_by_step` | ✅ | ADR-005; `order_reports.metadata.credits_used_by_step` |
| Auditoria: `audit_logs` em transições | ✅ | Existente; estendido para transições de fulfillment |
| Isolamento: cliente lê apenas seus pedidos | ✅ | RLS via `auth.uid()`; tabela de clientes Supabase documentada |

### Itens de Implementação Pendentes (Handoff para Dev)

| Item | Prioridade | Decisão que o guia |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` | 🚨 Crítico | Sem isso, nenhuma rota server-side funciona |
| `CRON_SECRET` no `.env.local` | 🚨 Crítico | Proteção do endpoint `/api/internal/cron-tick` |
| `OPERATOR_EMAIL` no `.env.local` | Alta | DT-001 |
| `npm install zod` | Alta | FulfillmentSchemaZod |
| Migration 004: `fulfillment_queue` | Alta | ADR-001 + DT-005 (attempt_count, next_retry_at) |
| Migration 005: `fulfillment_steps` | Alta | Step 5 — tabela separada, UNIQUE(order_id, step_id) |
| Migration 006: `order_reports` | Alta | ADR-003 |
| Migration 007: `orders` (campos fulfillment) | Alta | sprint-change-proposal Seção 2 |
| Migration 008: `sku_catalog` (fulfillment_schema) | Alta | ADR-006 Gap 2 |
| `src/types/fulfillment.ts` | Alta | StepFn enum, FulfillmentSchemaZod, StepDefinition |
| `src/types/errors.ts` | Alta | DT-003, ErrorCode enum |
| `src/lib/escavador.ts` — adicionar `getDocumentosPublicos` + `getEnvolvidos` | Alta | ADR-006 Gap 1 |
| `src/lib/fulfillment-engine.ts` | Alta | Contrato Step 5; processOrderSync, executeStep, processBatch |
| `src/app/api/internal/cron-tick/route.ts` | Alta | ADR-001, DT-005 |
| `src/app/api/orders/[id]/fulfill/route.ts` | Alta | RF-07 |
| `src/app/api/reports/[token]/route.ts` | Alta | ADR-004 |
| `src/app/meus-reports/page.tsx` | Média | RF-04 |
| `src/app/admin/page.tsx` expandida | Média | RF-03 |
| `scripts/cron-worker.ts` | Alta | Step 5 — one-shot + AbortSignal.timeout(55s) |
| Crontab na VPS | Alta | Step 5 — `* * * * * curl -s -m 55 ...` |
| Seed: `sku_catalog.fulfillment_schema` por SKU | Alta | Roteiros Sprint Change Proposal Seção 5 |
