# Backlog Final - Legal Dashboard / Painel de Inteligência Processual

**Data:** 2026-04-08  
**Versão:** 6.0 (Tier 3 - Orders & Reports)  
**Status:** 🏃 Sprint Planning em Andamento

---

## 1. Visão Geral do Projeto

| Métrica | Valor |
|---------|-------|
| **Sprints executadas** | 5 |
| **Stories completas** | 33/33 |
| **Testes passing** | 14 ✅ |
| **Build** | ✅ passing |
| **Lint errors** | 5 (não-bloqueantes) |
| **Arquitetura** | Tier 2 (100%) → Tier 3 (0%) |

---

## 2. Sprints Concluídas

### Sprint 1: Infraestrutura ✅
| Story | Feature | Status |
|-------|----------|--------|
| S-01 | Project Setup (Next.js + Supabase) | ✅ done |
| S-02 | Authentication | ✅ done |
| S-03 | OAB Selector | ✅ done |

### Sprint 2: Core MVP ✅
| Story | Feature | Status |
|-------|----------|--------|
| S-04 | Endpoints (processos + detail + mov) | ✅ done |
| S-05 | Health KPIs | ✅ done |
| S-06 | Case Table | ✅ done |
| S-07 | Case Detail | ✅ done |
| S-08 | Error handling | ✅ done |
| S-09 | UX Microcopy | ✅ done |
| S-10 | LGPD Masking | ✅ done |
| S-11 | Request Update | ✅ done |
| S-12 | Validations | ✅ done |
| S-12b | Auth Middleware | ✅ done |

### Sprint 3: Admin + NFRs ✅
| Story | Feature | Status |
|-------|----------|--------|
| S-13 | Admin Dashboard | ✅ done |
| S-14 | Audit Logs | ✅ done |
| S-15 | Rate Limiting | ✅ done |
| S-16 | Server Caching | ✅ done |
| S-17 | Perfis + Permissões | ✅ done |
| S-18 | Performance | ✅ done |
| S-19 | Documentos endpoint | ✅ done |
| S-20 | Envolvidos endpoint | ✅ done |
| S-21 | Credit tracking | ✅ done |
| S-22 | Observabilidade | ✅ done |

### Sprint 4: Tier 2 Completo ✅
| Story | Feature | Status |
|-------|----------|--------|
| S-23 | Histograma staleness | ✅ done |
| S-24 | Distribuição tribunal | ✅ done |
| S-25 | Carteira quente/fria | ✅ done |
| S-26 | Amostragem estratificada | ✅ done |
| S-27 | Funil atualizações | ✅ done |

### Sprint 5: Refatoração ✅
| Story | Feature | Status |
|-------|----------|--------|
| S-28 | Refatorar escavador.ts | ✅ done |
| S-29 | Refatorar types/index.ts | ✅ done |
| S-30 | Refatorar page.tsx | ✅ done |
| S-31 | Refatorar AuthButton.tsx | ✅ done |
| S-32 | Testes pós-refatoração | ✅ done |

---

## 3. Arquitetura por Tier

| Tier | Descrição | Coverage | Status |
|------|-----------|----------|--------|
| **Tier 1** | Solo Essencial | 100% | ✅ done |
| **Tier 2** | Carteira Inteligente | 100% | ✅ done |
| **Tier 3** | Orders & Reports | 0% | backlog |
| **Tier 4** | Diagnóstico Estratégico | 0% | backlog |

---

## 4. Endpoints Implementados

| Rota | Descrição | Status |
|-----|-----------|--------|
| `/api/processes` | Lista processos + KPIs | ✅ |
| `/api/case-detail/[numero]` | Detalhe processo | ✅ |
| `/api/case-status/[numero]` | Status atualização | ✅ |
| `/api/case-documents/[numero]` | Documentos | ✅ |
| `/api/case-parties/[numero]` | Envolvidos | ✅ |
| `/api/request-update/[numero]` | Solicitar atualização | ✅ |
| `/api/lawyer-summary` | Resumo OAB | ✅ |
| `/api/audit-logs` | Logs auditoria | ✅ |

---

## 5. Testes

| Tipo | Quantidade | Status |
|------|-----------|--------|
| Unitários LGPD | 9 | ✅ |
| Unitários Cache | 3 | ✅ |
| Unitários Rate Limit | 2 | ✅ |
| **TOTAL** | **14** | **14 passing** |

---

## 6. Tier 3: Orders & Reports (NOVO)

### 6.1 Escopo do Tier 3

| Epic | Descrição | Stories |
|------|-----------|---------|
| **E-T3A** | Orders & State Machine | 5 |
| **E-T3B** | Catálogo de SKUs | 4 |
| **E-T3C** | Pagamento (Stripe) | 6 |
| **E-T3D** | Dashboard Cliente | 5 |
| **E-T3E** | Email Transacional | 3 |
| **E-T3F** | Integração Dados | 4 |
| **TOTAL** | | **27** |

---

### 6.2 Epic E-T3A: Orders & State Machine

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3A-01 | Criar tabela `orders` no Supabase | 3 | Alta |
| T3A-02 | Criar tabela `order_items` | 3 | Alta |
| T3A-03 | Implementar Order API (CRUD) | 5 | Alta |
| T3A-04 | Implementar State Machine de estados | 5 | Alta |
| T3A-05 | Hook de transição de estado com audit | 3 | Média |

**Critérios de Aceitação (T3A-01):**
- [ ] Tabela `orders` criada com campos: id, customer_id, status, total, stripe_session_id, created_at, updated_at
- [ ] Tabela `order_items` criada com campos: id, order_id, sku_id, quantity, unit_price, subtotal
- [ ] Migration aplicada no Supabase
- [ ] TypeScript types definidos

**Critérios de Aceitação (T3A-03):**
- [ ] GET /api/orders - listar orders do cliente
- [ ] GET /api/orders/[id] - detalhe da order
- [ ] POST /api/orders - criar nova order
- [ ] PATCH /api/orders/[id]/status - atualizar status (admin)
- [ ] Autenticação validada (apenas dono vê suas orders)

**Critérios de Aceitação (T3A-04):**
- [ ] Estados implementados: CREATED → PAYMENT_PENDING → PAID → PROCESSING → DELIVERED / FAILED / CANCELLED
- [ ] Validação de transição (não pode pular estados)
- [ ] Log de transição em audit_logs

---

### 6.3 Epic E-T3B: Catálogo de SKUs

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3B-01 | Criar tabela `sku_catalog` | 3 | Alta |
| T3B-02 |.seedar SKUs padrão (Saúde, Priorização, Governança) | 2 | Alta |
| T3B-03 | API para listar SKUs disponíveis | 3 | Alta |
| T3B-04 | Página de landing de produtos | 5 | Média |

**Critérios de Aceitação (T3B-01):**
- [ ] Tabela `sku_catalog` com campos: id, name, description, price_cents, sla_hours, is_active, created_at
- [ ] Campos opcionais: features (JSON), highlights (JSON)

**Critérios de Aceitação (T3B-02):**
- [ ] SKU "Report Saúde" - 24h - R$ 150
- [ ] SKU "Report Priorização" - 48h - R$ 300
- [ ] SKU "Report Governança" - 7 dias - R$ 600

**Critérios de Aceitação (T3B-04):**
- [ ] Landing page com cards de produtos
- [ ] Preços claros visíveis
- [ ] Botão "Comprar" funcional
- [ ] Link para documentação de SLAs

---

### 6.4 Epic E-T3C: Pagamento (Stripe)

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3C-01 | Configurar Stripe SDK | 2 | Alta |
| T3C-02 | Criar Checkout Session API | 5 | Alta |
| T3C-03 | Implementar webhook handler | 5 | Alta |
| T3C-04 | Criar página de sucesso/cancelamento | 3 | Alta |
| T3C-05 | Implementar retry de pagamento | 3 | Média |
| T3C-06 | Configurar Stripe Dashboard (admin) | 2 | Baixa |

**Critérios de Aceitação (T3C-02):**
- [ ] POST /api/checkout/create-session
- [ ] Parâmetros: order_id, sku_id, customer_email, success_url, cancel_url
- [ ] Retorna stripe_session_id e url de redirect
- [ ] Integração com metadata para webhook

**Critérios de Aceitação (T3C-03):**
- [ ] POST /api/webhooks/stripe
- [ ] Validação de assinatura Stripe
- [ ] Eventos processados: checkout.session.completed, checkout.session.expired, payment_intent.payment_failed
- [ ] Atualização de status da order conforme evento

**Critérios de Aceitação (T3C-04):**
- [ ] /checkout/success?session_id={id} - exibe confirmação + link dashboard
- [ ] /checkout/cancel?session_id={id} - permite retry

---

### 6.5 Epic E-T3D: Dashboard Cliente

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3D-01 | Criar página "Meus Reports" | 5 | Alta |
| T3D-02 | Componente de lista de orders | 3 | Alta |
| T3D-03 | Detalhe da order com timeline | 5 | Alta |
| T3D-04 | Download do Report entregue | 3 | Alta |
| T3D-05 | Seção "Plus" (benefícios) | 3 | Média |

**Critérios de Aceitação (T3D-01):**
- [ ] Rota /dashboard/reports
- [ ] Lista de orders com status, data, SKU, valor
- [ ] Filtros por status
- [ ] Ordenação por data (recente primeiro)

**Critérios de Aceitação (T3D-03):**
- [ ] Timeline visual showing: created → payment_pending → paid → processing → delivered
- [ ] Status atual destacado
- [ ] Tempo estimado restante (baseado em SLA)

**Critérios de Aceitação (T3D-04):**
- [ ] Botão de download disponível apenas para orders com status DELIVERED
- [ ] Log de download em audit_logs

---

### 6.6 Epic E-T3E: Email Transacional

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3E-01 | Configurar Resend SDK | 2 | Alta |
| T3E-02 | Template email confirmação pedido | 3 | Alta |
| T3E-03 | Template email entrega do Report | 3 | Alta |

**Critérios de Aceitação (T3E-01):**
- [ ] Configuração de API key Resend
- [ ] Função helper para envio de emails

**Critérios de Aceitação (T3E-02):**
- [ ] Email enviado ao criar order
- [ ] Conteúdo: resumo do pedido, valor, prazo, link para dashboard

**Critérios de Aceitação (T3E-03):**
- [ ] Email enviado quando order status muda para DELIVERED
- [ ] Conteúdo: link para download, resumo do Report

---

### 6.7 Epic E-T3F: Integração Dados

| Story ID | Descrição | Pontos | Prioridade |
|----------|-----------|--------|------------|
| T3F-01 | Implementar Data Adapter Interface | 5 | Alta |
| T3F-02 | Adapter Escavador | 5 | Média |
| T3F-03 | Adapter Jusbrasil | 5 | Média |
| T3F-04 | Configuração de fontes no admin | 3 | Baixa |

**Critérios de Aceitação (T3F-01):**
- [ ] Interface DataProvider com métodos: search(query), monitor(identifiers), getStatus(processId)
- [ ] Tipo de retorno padronizado
- [ ] Fallback entre providers

**Critérios de Aceitação (T3F-02):**
- [ ] Implementação de EscavadorAdapter
- [ ] Integração com API Escavador
- [ ] Tratamento de erros e rate limiting

---

## 7. Definition of Done (Tier 3)

- [ ] Código implementado
- [ ] Testes passando (unit + E2E)
- [ ] Build passing
- [ ] Code review aprovado
- [ ] Deployado staging
- [ ] Webhooks configurados (Stripe + provedores)
- [ ] Testes E2E de checkout completos
- [ ] Documentação API atualizada

---

## 8. Technical Debt Herdado

| Item | Severidade | Ação |
|------|-----------|------|
| test-flow.js (legacy) | baixa | Remover |
| Unused params (_numero) | baixa | Limpar |
| HealthMetrics import | baixa | Usar ou remover |

---

## 9. Roadmap Completo

| Fase | Descrição | Status |
|------|-----------|--------|
| Tier 1 | Solo Essencial | ✅ done |
| Tier 2 | Carteira Inteligente | ✅ done |
| Tier 3 | Orders & Reports | 🏃 Sprint 1 |
| Tier 4 | Diagnóstico Estratégico | ⏳ backlog |

---

## 10. Próximos Passos

1. [ ] Aprovar Sprint Planning
2. [ ] Iniciar Sprint 1 (E-T3A: Orders & State Machine)
3. [ ] Configurar ambiente Stripe (test mode)
4. [ ] Configurar Resend para development

---

## 11. Métricas Esperadas (Tier 3)

| Métrica | Meta |
|---------|------|
| Stories | 27 |
| Sprints | 4-5 |
| Cobertura testes | > 80% |
| E2E checkout | 5 cenários |

---

**Documento atualizado: 2026-04-08**

*Legenda: ✅ done | 🏃 in progress | ⏳ backlog | 🔴 blocked*
