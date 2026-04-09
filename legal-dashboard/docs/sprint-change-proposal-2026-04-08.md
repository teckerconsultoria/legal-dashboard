# Sprint Change Proposal — Dashboard como Painel de Operações Inquest-like

**Projeto:** Legal Dashboard
**Data:** 2026-04-08
**Versão:** 2 (aprovada)
**Status:** ✅ Concluído — Fulfillment engine implementado, paginação, e2e tests passando

---

## Seção 1 — Resumo da Mudança

**Trigger:** Dashboard passou a ser painel de operações para fulfillment de pedidos feitos no shop pelos clientes.

A concepção original era **self-service**: advogado entrava com sua OAB e visualizava a saúde da própria carteira.

A nova concepção é **operacional**: o dashboard é usado pelo **operador/admin** para processar e entregar Reports que clientes compraram no shop. Cada SKU define um **roteiro** de chamadas à API Escavador, e o resultado é estruturado em seções conforme o schema do SKU.

| Ator | Antes | Depois |
|---|---|---|
| Advogado/cliente | Entra com OAB, vê própria carteira | Compra Report no shop, acompanha entrega |
| Operador/admin | Não existia | Usa dashboard para processar pedidos (fila de ops) |
| OAB lookup | Auto-serviço do próprio advogado | Disparado pelo operador a serviço de um pedido |
| SKU | Produto comercial (nome + preço) | Produto comercial + roteiro de fulfillment |

---

## Seção 2 — Análise de Impacto

### Novo componente central: SKU como roteiro de execução

Cada SKU define:
1. **Quais endpoints Escavador chamar** (e com quais parâmetros)
2. **A ordem e dependências** entre as chamadas
3. **O schema de saída** — como montar o `report_data` final, quais seções existem

```
SKU "Report Simples"  →  roteiro A: [getLawyerSummary, getProcesses(limit=50)]
SKU "Report Smart"    →  roteiro B: [getLawyerSummary, getProcesses(limit=100), getMovimentacoes por processo]
SKU "Report Pro"      →  roteiro C: [roteiro B + getCaseCNJ por processo + getStatusAtualizacao]
```

### Rotas e pages

| Rota atual | Status | O que muda |
|---|---|---|
| `/` — formulário OAB | ⚠️ Repropósito | Move para dentro do /admin como ferramenta interna |
| `/api/processes` | ⚠️ Repropósito | Lookup disparado por order_id, não por OAB do usuário logado |
| `/shop` | ✅ Mantida | Core do produto |
| `/checkout/*` | ✅ Mantida | Fluxo de compra mantido; adiciona coleta de inputs do alvo |
| `/admin` | 🆕 Expandida | Vira o ops dashboard — fila de pedidos + fulfillment |
| `/meus-reports` | 🆕 Nova | Client-facing — cliente acompanha status do Report |
| `/api/orders/[id]/fulfill` | 🆕 Nova | Motor de fulfillment por roteiro |

### Modelo de dados

**`sku_catalog`** — adicionar roteiro:
```sql
ALTER TABLE sku_catalog
  ADD COLUMN fulfillment_schema jsonb NOT NULL DEFAULT '{}';
```

Exemplo de `fulfillment_schema`:
```json
{
  "version": "1.0",
  "required_inputs": ["oab_estado", "oab_numero"],
  "steps": [
    { "id": "lawyer_summary", "fn": "getLawyerSummary", "section": "resumo_advogado" },
    { "id": "processes",      "fn": "getProcesses",     "section": "carteira", "params": { "limit": 100 } },
    { "id": "movimentacoes",  "fn": "getMovimentacoes", "section": "movimentacoes", "foreach": "processes.items[*].numero" }
  ],
  "output_schema": { "sections": ["resumo_advogado", "carteira", "movimentacoes"] }
}
```

**`orders`** — adicionar campos de fulfillment:
```sql
ALTER TABLE orders
  ADD COLUMN target_oab_estado    text,
  ADD COLUMN target_oab_numero    text,
  ADD COLUMN target_numero_cnj    text,
  ADD COLUMN report_data          jsonb DEFAULT '{}',
  ADD COLUMN fulfillment_steps    jsonb DEFAULT '[]',
  ADD COLUMN assigned_operator_id uuid REFERENCES auth.users(id);
```

`report_data` estruturado por schema do SKU:
```json
{
  "sections": {
    "resumo_advogado": { ... },
    "carteira": { "processos": [...] },
    "movimentacoes": { ... }
  },
  "metadata": {
    "sku_id": "...",
    "roteiro_version": "1.0",
    "executed_at": "...",
    "steps_completed": ["lawyer_summary", "processes"],
    "steps_failed": []
  }
}
```

### Auth e papéis

- **Role operator/admin** — acessa ops dashboard, processa pedidos, dispara fulfillment (via service role no Supabase)
- **Role client** — acessa somente seus próprios Reports via RLS existente
- RLS atual em `orders` protege clientes entre si — operador usa service role para acesso cross-user

---

## Seção 3 — Fulfillment Engine

```
┌─────────────────────────────────────────────────────┐
│                  Fulfillment Engine                  │
│                                                      │
│  SKU Roteiro                                         │
│  ┌──────────┐    Step Executor    ┌───────────────┐  │
│  │fulfillment│ → [step1, step2] → │EscavadorClient│  │
│  │_schema   │                    └───────────────┘  │
│  └──────────┘         ↓                             │
│                 Report Assembler                     │
│                 (monta seções por schema)            │
│                       ↓                             │
│              orders.report_data (jsonb estruturado)  │
└─────────────────────────────────────────────────────┘
```

**Rota:** `POST /api/orders/[id]/fulfill`
```
Body: { step_id?: string }  // omitido = executa todos steps pendentes

Lógica:
1. Carrega order + sku_catalog.fulfillment_schema
2. Determina steps a executar
3. Para cada step:
   a. Chama EscavadorClient com fn e params do step
   b. Salva output em report_data.sections[step.section]
   c. Atualiza fulfillment_steps[step.id].status = "done" | "failed"
4. Todos done → orders.status = "delivered"
5. Algum falhou → mantém "processing", registra falha
6. Escreve audit_log em cada transição
```

---

## Seção 4 — Mudanças Concretas

1. **Migration DB** — `sku_catalog.fulfillment_schema` + campos em `orders`
2. **Seed SKUs** — popular `fulfillment_schema` para cada SKU existente
3. **`/api/orders/[id]/fulfill`** — motor de fulfillment por roteiro
4. **`/admin` expandida** — fila de pedidos, steps por pedido, re-execução de step individual
5. **`/meus-reports`** — client tracking com status e download
6. **`/shop` + checkout** — coleta de `required_inputs` do SKU antes do pagamento

---

## Seção 5 — Decisões Finalizadas

### Decisão 1 — Sync vs. Async: híbrido por SKU

| SKU | Estratégia | Justificativa |
|---|---|---|
| Report Simples | Síncrono | 2 calls (~5s), cabe em rota Next.js |
| Report Processo Único | Síncrono | 5 calls paralelas (~10s) |
| Report Smart | Assíncrono | 21+ calls (foreach movimentações, top 20 processos) |
| Report Pro | Assíncrono | 50–100+ calls, pode durar minutos |

Mecanismo async: rota retorna `202 Accepted`, job em background executa steps e atualiza `fulfillment_steps` + `report_data`. Ops dashboard faz polling em `GET /api/orders/[id]`.

### Roteiros SKU × Endpoints Escavador (documentados)

**Endpoints disponíveis (confirmados na doc v2):**
- `GET /advogado/resumo` — resumo + quantidade_processos
- `GET /advogado/processos` — lista paginada (links.next, limit, filtros)
- `GET /processos/numero_cnj/{cnj}` — capa do processo
- `GET /processos/numero_cnj/{cnj}/movimentacoes` — limit 50/100/500
- `GET /processos/numero_cnj/{cnj}/documentos-publicos` — limit 50/100
- `GET /processos/numero_cnj/{cnj}/envolvidos` — limit 50/100
- `GET /processos/numero_cnj/{cnj}/status-atualizacao` — staleness + job status
- `POST /processos/numero_cnj/{cnj}/solicitar-atualizacao` — async update

> `EscavadorClient` precisa adicionar: `getDocumentosPublicos` e `getEnvolvidos`

**Roteiro Report Simples:**
```
steps: [getLawyerSummary, getProcesses(limit=100)]
computed: metrics, histogram, distributionByTribunal, hotCold
```

**Roteiro Report Smart:**
```
steps: [getLawyerSummary, getProcesses(limit=100),
        getMovimentacoes(cnj, 100) foreach top-20 processos]
```

**Roteiro Report Pro:**
```
steps: [getLawyerSummary, getProcesses(limit=100),
        getMovimentacoes(cnj, 500) foreach top-30,
        getCaseCNJ(cnj) foreach staleness>30d,
        getEnvolvidos(cnj) foreach mesmos,
        getDocumentosPublicos(cnj) foreach mesmos,
        requestUpdate(cnj) foreach staleness>60d]
```

**Roteiro Report Processo Único:**
```
required_inputs: [numero_cnj]
steps: [getCaseCNJ, getMovimentacoes(500), getEnvolvidos(100),
        getDocumentosPublicos, getStatusAtualizacao] — paralelos
```

### Decisão 2 — Inputs coletados no shop ✅
Formulário após seleção do SKU, antes do Stripe Checkout, usando `required_inputs` do `fulfillment_schema`.

### Decisão 3 — Roteiros em banco com validação TypeScript ✅
`fulfillment_schema` em `sku_catalog` (Supabase). Enum de `StepFn` fixo no código. Schema validado por Zod ao carregar.

### Decisão 4 — Email: Hostinger SMTP ✅
- Domínio: `teckerconsulting.com.br`
- Remetente: `alessandro.lemos@teckerconsulting.com.br`
- Stack: Nodemailer + `smtp.hostinger.com:465`
- Implementado em: `src/lib/mailer.ts`
- Env vars: `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- Falta: adicionar `SMTP_PASS` ao `.env.local`

---

## Handoff

**Scope: MAJOR**
**Próximo passo:** `[CA] Create Architecture` — documentar fulfillment engine, schema dos roteiros, data flow completo e decisões das pendências acima.
