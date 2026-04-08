# Sprint Planning - Tier 3: Orders & Reports

**Data:** 2026-04-08  
**Versão:** 1.0  
**Projeto:** Legal Dashboard / Painel de Inteligência Processual

---

## 1. Objetivo do Sprint

Implementar a fundação do Tier 3 (Orders & Reports) para habilitar o modelo comercial Inquest-like:

1. **Orders & State Machine** (E-T3A)
2. **Catálogo de SKUs** (E-T3B - parcial)
3. **Foundation de pagamento** (E-T3C - foundational)

**Meta do Sprint:** Estar pronto para processar primeiro pedido real com checkout via Stripe.

---

## 2. Sprint Goal

> *"Ao final deste sprint, o sistema deve ser capaz de criar orders, listá-las no dashboard do cliente e processar pagamento via Stripe Checkout."*

**Definition of Done:**
- [ ] Orders podem ser criadas via API
- [ ] Cliente pode ver suas orders no dashboard
- [ ] Stripe Checkout redireciona corretamente
- [ ] Webhook atualiza status da order
- [ ] Testes passando

---

## 3. Scope do Sprint 1

### 3.1 In Scope (Must Have)

| Epic | Story | Descrição | Points |
|------|-------|-----------|--------|
| E-T3A | T3A-01 | Criar tabela `orders` no Supabase | 3 |
| E-T3A | T3A-02 | Criar tabela `order_items` | 3 |
| E-T3A | T3A-03 | Implementar Order API (CRUD) | 5 |
| E-T3A | T3A-04 | Implementar State Machine de estados | 5 |
| E-T3A | T3A-05 | Hook de transição de estado com audit | 3 |
| E-T3B | T3B-01 | Criar tabela `sku_catalog` | 3 |
| E-T3B | T3B-02 | Seedar SKUs padrão | 2 |
| E-T3B | T3B-03 | API para listar SKUs | 3 |
| E-T3C | T3C-01 | Configurar Stripe SDK | 2 |
| E-T3C | T3C-02 | Criar Checkout Session API | 5 |

**Total Points:** 34

### 3.2 Out of Scope

- Landing page de produtos (T3B-04)
- Página de sucesso/cancelamento (T3C-04)
- Email transacional (E-T3E)
- Data Adapters (E-T3F)
- Dashboard Cliente completo (E-T3D)

---

## 4. Team Capacity

| Membro | Disponibilidade | Points/sprint |
|--------|-----------------|---------------|
| Dev (you) | 5 dias | ~30-35 points |

**Velocity histórico:** 30-35 points/sprint  
**Capacidade Sprint 1:** 34 points (aligned)

---

## 5. Sprint Backlog

### 5.1 Story T3A-01: Tabela Orders

```
Como desenvolvedor
Eu preciso criar a tabela orders no Supabase
Para armazenar pedidos de Reports

Critérios de Aceitação:
- [ ] Tabela orders com campos: id, user_id, status, total_cents, stripe_session_id, created_at, updated_at
- [ ] Tabela order_items com campos: id, order_id, sku_id, quantity, unit_price_cents, subtotal_cents
- [ ] RLS ativado (apenas dono vê suas orders)
- [ ] Types TypeScript definidos em /src/types/orders.ts

Técnica:
- Usar Supabase SQL ou migrations
- foreign key: orders.user_id -> auth.users.id
- foreign key: order_items.order_id -> orders.id
- foreign key: order_items.sku_id -> sku_catalog.id
```

### 5.2 Story T3A-03: Order API

```
Como cliente autenticado
Eu preciso de endpoints para gerenciar minhas orders
Para acompanhar meus pedidos de Reports

Critérios de Aceitação:
- [ ] GET /api/orders - lista orders do usuário logado
- [ ] GET /api/orders/[id] - detalhe de uma order
- [ ] POST /api/orders - cria nova order (sem autenticação para checkout anônimo)
- [ ] Autenticação: GET exige auth, POST não exige
- [ ] Retornar apenas orders do usuário ( Ownership validation)

API Contract:
GET /api/orders
Response: { orders: [{ id, status, total_cents, created_at, items: [...] }] }

POST /api/orders
Body: { sku_ids: string[], customer_email: string }
Response: { order_id, checkout_url }
```

### 5.3 Story T3A-04: State Machine

```
Como sistema
Eu preciso gerenciar estados de orders
Para garantir fluxo correto de pedido

Estados:
- CREATED (criado, aguardando pagamento)
- PAYMENT_PENDING (pagamento pendente)
- PAID (pago confirmado)
- PROCESSING (em análise/processamento)
- DELIVERED (entregue)
- FAILED (falhou)
- CANCELLED (cancelado)

Transições válidas:
CREATED → PAYMENT_PENDING
PAYMENT_PENDING → PAID
PAYMENT_PENDING → CANCELLED
PAID → PROCESSING
PROCESSING → DELIVERED
PROCESSING → FAILED
(any) → CANCELLED (admin only)

Critérios de Aceitação:
- [ ] Função transitionStatus(orderId, newStatus) valida transição
- [ ] InvalidStateTransitionError se transição inválida
- [ ] Log de transição em audit_logs
```

### 5.4 Story T3B-01 + T3B-02 + T3B-03: SKU Catalog

```
Como administrador
Eu preciso gerenciar catálogo de SKUs
Para definir produtos e preços

Tabela sku_catalog:
- id (uuid)
- name (varchar) - ex: "Report Saúde"
- description (text)
- price_cents (int)
- sla_hours (int)
- is_active (boolean)
- features (jsonb) - array de features
- highlights (jsonb) - array de Destaques
- created_at, updated_at

Seed inicial:
1. Report Saúde - R$ 150 (15000 cents) - 24h
2. Report Priorização - R$ 300 (30000 cents) - 48h
3. Report Governança - R$ 600 (60000 cents) - 168h (7 dias)

API:
GET /api/skus - lista SKUs ativos
```

### 5.5 Story T3C-01 + T3C-02: Stripe Checkout

```
Como cliente
Eu preciso poder pagar minha order via Stripe
Para concluir a compra do Report

Fluxo:
1. POST /api/orders cria order com status CREATED
2. POST /api/checkout/create-session recebe order_id
3. Retorna stripe_checkout_url
4. Cliente redirecionado para Stripe
5. Pagamento bem-sucedido → webhook atualiza para PAID

API:
POST /api/checkout/create-session
Body: { order_id: string, success_url: string, cancel_url: string }
Response: { session_id: string, checkout_url: string }

Configuração:
- Modo: checkout (não subscription)
- Payment methods: pix, card
- Metadata: order_id, customer_email
```

---

## 6. Task Breakdown

### Sprint 1 - Dia a Dia

| Dia | Tasks |
|-----|-------|
| **Dia 1** | T3A-01 (tabelas orders + order_items), T3B-01 (sku_catalog) |
| **Dia 2** | T3A-02 (types), T3B-02 (seed SKUs), T3B-03 (API list SKUs) |
| **Dia 3** | T3A-03 (Order API - CRUD), T3A-04 (State Machine) |
| **Dia 4** | T3A-05 (audit hooks), T3C-01 (Stripe SDK setup) |
| **Dia 5** | T3C-02 (Checkout Session API), Testes, Buffer |

---

## 7. Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Stripe API Key | 🔴 Need | Alta |
| Supabase DB access | ✅ Ready | Baixa |
| Auth middleware existente | ✅ Ready | Baixa |

**Ação antes de começar:** Obter Stripe test keys

---

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe API complexa | Alto | Usar Stripe.js + simple session creation |
| Estado de payment webhook pode falhar | Médio | Implementar retry manual no dashboard |
| Rate limiting em APIs externas | Médio | Implementar retry com backoff |

---

## 9. Definition of Done

- [ ] Código implementado em /src/app/api/orders
- [ ] Código implementado em /src/app/api/checkout
- [ ] Tipo Order e OrderItem em /src/types
- [ ] Tabelas criadas no Supabase
- [ ] SKUs seedados
- [ ] Testes unitários para State Machine
- [ ] Build passing
- [ ] Funcionamento verificado com Stripe test mode

---

## 10. Definition of Ready

Todas as stories estão no estado "ready" com:
- [ ] Critérios de aceitação claros
- [ ] Task breakdown
- [ ] Dependencies identificadas

---

## 11. Próximos Passos

1. ✅ Revisar Sprint Planning
2. ⏳ Obter Stripe test keys
3. 🏃 Iniciar Sprint 1
4. ⏳ Configurar Stripe webhook (futuro sprint)

---

**Sprint Planning aprovado em: 2026-04-08**

*Próxima sprint: Sprint 2 (Pagamento + Webhooks)*
