# Research vs Backlog - Análise Completa

**Data:** 2026-04-08  
**Correção:**Não houve Sprint Planning formal. Apenas Epic 1 foi executado.

---

## 1. Estrutura Real do Projeto

| Componente | Status |
|------------|--------|
| **Epic 1** (Infraestrutura) | ✅ done |
| **Epic 2** (Case Management) | ⏳ backlog |
| **Epic 3** (Admin) | ⏳ backlog |

---

## 2. RESEARCH vs BACKLOG (por Epic/Sprint)

### Epic 1: Infraestrutura & Core (✅ Sprint 1 executada)

| Story | Research Correspondente | Status | Gap? |
|------|-------------------------|--------|------|
| 1-1 Project Setup | Stack: Next.js + Supabase | ✅ done | - |
| 1-2 Authentication | Login/Auth | ✅ Parcial | ⚠️ UI feita, sem middleware |
| 1-3 OAB Selector | FR1: OAB selector | ✅ done | - |

**Veredicto Epic 1:** 2.5/3 completo, 0.5 parcial

---

### Epic 2: Case Management (⏳ backlog)

| Story | Research Correspondente | Status | Gap? |
|------|---------------------|--------|------|
| 2-1 Health Panel KPIs | FR2: Health Panel | ⏳ backlog | - |
| 2-2 Case Table | FR3: Case Table | ⏳ backlog | - |
| 2-3 Case Detail | FR4: Case Detail | ⏳ backlog | - |

**Veredicto Epic 2:** 3 stories planejadas conforme research

**Gaps FAIXA neste Epic:**
- Request Update (async) - ❌ NÃO
- Status-atualizacao - ❌ NÃO

---

### Epic 3: Admin & Monitoring (⏳ backlog)

| Story | Research Correspondente | Status | Gap? |
|------|---------------------|--------|------|
| 3-1 Admin Dashboard | FR5: Admin | ⏳ backlog | - |
| 3-2 Audit Logs | FR6: Audit | ⏳ backlog | - |

**Veredicto Epic 3:** 2 stories planejadas conforme research

**Gaps FAIXA neste Epic:**
- Rate Limiting (500 req/min) - ❌ NÃO
- Caching TTL - ��� NÃO

---

## 2. Endpoints Research vs API Routes por Sprint

| Endpoint | Story | Implementado | Gap? |
|----------|-------|-------------|------|
| `/advogado/resumo` | 1-3 | ✅ `/api/lawyer-summary` | - |
| `/advogado/processos` | 2-1 | ✅ `/api/processes` | - |
| `/processos/numero_cnj/{id}` | 2-3 | ✅ `/api/case-detail/[numero]` | - |
| `.../movimentacoes` | 2-3 | ✅ (inside case-detail) | - |
| `.../status-atualizacao` | 2+ | ❌ NÃO | 🔴 gap |
| `POST .../solicitar-atualizacao` | 2+ | ❌ NÃO | 🔴 gap |
| `.../documentos-publicos` | research | ❌ NÃO | 🔴 gap |
| `.../envolvidos` | research | ❌ NÃO | 🔴 gap |

---

## 3. Features Research vs Sprint Assignment

| Feature | Research | Sprint 1 | Sprint 2 | Sprint 3 | Gap |
|----------|----------|---------|---------|---------|---------|-----|
| OAB Selector (state+number+tipo) | FR1 | ✅ 1-3 | - | - | - |
| Health KPIs (total, stale%, active/inactive) | FR2 | - | ✅ 2-1 | - | - |
| Case Table com filtros | FR3 | - | ✅ 2-2 | - | - |
| Case Detail (capa, mov, status) | FR4 | - | ✅ 2-3 | - | - |
| Request Update (async) | - | - | ❌ | 🔴 | Nova story? |
| Status-atualizacao | - | - | ❌ | 🔴 | Nova story? |
| Admin Dashboard | FR5 | - | - | ✅ 3-1 | - |
| Audit Logs | NFR6 | - | - | ✅ 3-2 | - |
| Rate Limiting | NFR2 | - | - | ❌ | 🔴 |
| Caching 5min | NFR3 | - | - | ❌ | 🔴 |
| LGPD Masking | NFR5 | - | ⚠️ 2-3 (menciona) | ❌ | 🔴 |
| Insights Panel | Post-MVP | - | ❌ | ❌ | 🔴 |

---

## 4. matrix de Cobertura Sprint a Sprint

| Sprint | Total Stories | Conformes Research | Gaps Internos | Veredicto |
|--------|-----------|-----------------|---------------|-----------|
| Sprint 1 | 3 | 2.5/3 | Auth middleware | ⚠️ Parcial |
| Sprint 2 | 3 | 3/3 | 3 (update, status, insights) | ⚠️ Gaps |
| Sprint 3 | 2 | 2/2 | 2 (rate, cache) | ⚠️ Gaps |

---

## 5. Gaps Identificados (por Prioridade)

### 🔴 Críticos (impedem proposta)

| # | Gap | Sprint | Severity | Story Recomendada |
|---|-----|--------|----------|-----------------|
| 1 | Rate Limiting (500 req/min) | 3 | alta | 3-1 (extend) |
| 2 | Request Update + Status | 2+ | alta | 2-4 (nova) |
| 3 | Caching (5min TTL) | 3 | alta | 3-3 (nova) |
| 4 | LGPD Masking | 2 | média | 2-3 (extend) |

### ⚠️ Gaps de Implementação (não blocks)

| # | Gap | Sprint | Severity | Story |
|---|-----|--------|--------|-------|
| 5 | Insights Panel | 2+ | alta | Post-MVP |
| 6 | Credit Usage Tracking | 3 | média | 3-1 (extend) |
| 7 | Multi-OAB support | futuro | média | Backlog |
| 8 | Real-time alerts | futuro | baixa | Backlog |

---

## 6. Redundâncias e Inconsistências

### Redundâncias
| Item | Situação | Ação |
|------|----------|------|
| Zustand instalado | Sem uso efetivo | Remover ou usar (TD) |
| Admin page `/admin` | Vazia | Implementar 3-1 |
| Login page | Sem proteção | Adicionar middleware |

### Inconsistências
| Item | Situação | Ação |
|------|----------|------|
| Research: "Amostra rápida" | UI não expõe | Adicionar toggle |
| Research: Rate limit 500 | Não implementado | Adicionar TD |
| PRD: 3 segundos | Sem validação | Adicionar test |
| Story 2-3: LGPD masking | Mencionado, não feito | Implementar |

---

## 7. Proposta de Atualização do Backlog

### Storys a Adicionar

| Novo ID | Título | Sprint | Prioridade |
|---------|--------|--------|-----------|
| 1-2b | Auth Middleware | 1 | alta |
| 2-4 | Request Update (async) | 2 | alta |
| 2-5 | Status Atualização | 2 | alta |
| 3-3 | Server Caching | 3 | alta |
| 3-4 | Server Rate Limiting | 3 | alta |
| 4-1 | Insights Panel | 4 | média |

### Storys a Modificar

| ID | Modificação |
|----|-------------|
| 1-2 | + Auth Middleware |
| 2-3 | + LGPD masking (completo) |
| 3-1 | + Credit tracking |

---

## 8. Resumo Final

| Métrica | Valor |
|---------|-------|
| Stories Research | 14 |
| Stories Backlog | 8 |
| Gaps críticos | 4 |
| Gaps funcionais | 4 |
| Redundâncias | 3 |
| Inconsistências | 4 |

**Cobertura: ~60%** (8/14 features do research no backlog)

**Ações:**
- [ ] Adicionar 4 stories críticas ao backlog
- [ ] Modificar 3 stories existentes
- [ ] Considerar 4 stories como Post-MVP