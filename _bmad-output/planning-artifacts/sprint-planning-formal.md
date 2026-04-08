# Sprint Planning Formal - Legal Dashboard

**Data:** 2026-04-08  
**Versão:** 1.0  
**Status:** Planejamento inicial

---

## 1. Contexto do Planejamento

### 1.1 Documento Base

Este planejamento parte do documento de **Research** (`docs/deep-research-report.md`) e deve cover todo o escopo definido.

### 1.2 Estrutura Atual

| Componente | Status |
|------------|--------|
| Research | ✅ Completo |
| PRD | ✅ Completo |
| Architecture | ✅ Completo |
| Epics/Stories | ✅ 8 stories |
| Sprint 1 (Epic 1) | ✅ done |
| Sprint 2 | ⏳ backlog |
| Sprint 3 | ⏳ backlog |

---

## 2. Research Requirements - Full Mapping

### 2.1 Functional Requirements do Research

| ID | Requirement | Epic Correspondente | Story | Status Backlog |
|----|-------------|------------------|------|---------------|
| FR1 | OAB Selector (state + number + tipo) | Epic 1 | 1-3 | ✅ done |
| FR2 | Health KPIs (total, stale%, active/inactive) | Epic 2 | 2-1 | ⏳ |
| FR3 | Case Table com filtros | Epic 2 | 2-2 | ⏳ |
| FR4 | Case Detail (capa, mov, status) | Epic 2 | 2-3 | ⏳ |
| FR5 | Admin Dashboard | Epic 3 | 3-1 | ⏳ |
| FR6 | Authentication | Epic 1 | 1-2 | ✅ done |
| FR7 | Request Update (async) | - | - | ❌ gap |
| FR8 | Insights Panel | - | - | ❌ gap |
| FR9 | Multi-OAB support | - | - | ❌ gap |

### 2.2 Non-Functional Requirements do Research

| ID | Requirement | Implementado | Gap |
|----|------------|-----------|----------|-----|
| NFR1 | Page load < 3s | ⏳ | Sem validação |
| NFR2 | Rate Limiting 500 req/min | ❌ | 🔴 |
| NFR3 | Uptime 99.5% | ⏳ | - |
| NFR4 | Error handling 401/402/404/422 | ⚠️ | Parcial |
| NFR5 | LGPD/Masking | ❌ | 🔴 |
| NFR6 | Audit Logs | ⏳ | 3-2 pending |
| NFR7 | Caching 5min TTL | ❌ | 🔴 |

### 2.3 API Endpoints do Research

| Endpoint | Implementado | GAP |
|----------|------------|-----|
| `GET /advogado/resumo` | ✅ `/api/lawyer-summary` | - |
| `GET /advogado/processos` | ✅ `/api/processes` | - |
| `GET /processos/numero_cnj/{id}` | ✅ `/api/case-detail/[id]` | - |
| `GET .../movimentacoes` | ✅ (inside case-detail) | - |
| `GET .../status-atualizacao` | ❌ | 🔴 gap |
| `POST .../solicitar-atualizacao` | ❌ | 🔴 gap |
| `GET .../documentos-publicos` | ❌ | 🔴 gap |
| `GET .../envolvidos` | ❌ | 🔴 gap |

---

## 3. Epic Breakdown - Updated

### 3.1 Epic 1: Infraestrutura & Core

**Status:** ✅ done (Sprint 1 executada)

| Story | Description | Research Match | Status |
|-------|-------------|----------------|--------|
| 1-1 | Project Setup | Stack | ✅ done |
| 1-2 | Authentication | FR6 | ⚠️ parcial |
| 1-3 | OAB Selector | FR1 | ✅ done |

**Gaps remaining:** Auth middleware

---

### 3.2 Epic 2: Case Management

| Story | Description | Research Match | Status |
|-------|-------------|----------------|--------|
| 2-1 | Health Panel KPIs | FR2 | ⏳ |
| 2-2 | Case Table | FR3 | ⏳ |
| 2-3 | Case Detail | FR4 | ⏳ |

**Gaps (não mapeados):**
- Request Update endpoint
- Status-atualizacao endpoint

---

### 3.3 Epic 3: Admin & Monitoring

| Story | Description | Research Match | Status |
|-------|-------------|----------------|--------|
| 3-1 | Admin Dashboard | FR5 | ⏳ |
| 3-2 | Audit Logs | NFR6 | ⏳ |

**Gaps (não mapeados):**
- Rate Limiting
- Server Caching
- Credit Usage Tracking

---

## 4. Proposed Sprints

### 4.1 Sprint Planning

| Sprint | Epic | Stories | Duração | Capacidade |
|--------|-----|---------|---------|----------|
| Sprint 1 | Epic 1 | 3 | 1 semana | ~24h |
| Sprint 2 | Epic 2 | 3 | 1 semana | ~24h |
| Sprint 3 | Epic 3 | 2 | 1 semana | ~16h |

### 4.2 Gaps a distribuir nas Sprints

| Gap | Severidade | Sprint Sugerida |
|-----|-----------|----------------|
| Auth Middleware | alta | Sprint 2 |
| Request Update | alta | Sprint 2 |
| Status-atualizacao | alta | Sprint 2 |
| LGPD Masking | média | Sprint 2 |
| Rate Limiting | alta | Sprint 3 |
| Server Caching | alta | Sprint 3 |
| Credit Tracking | média | Sprint 3 |
| Insights Panel | baixa | Post-MVP |

---

## 5. Stories Adicionais Propostas

### 5.1 Novas Stories para Sprint 2

| Story ID | Título | Descrição | Estimativa |
|---------|--------|----------|----------|
| 2-4 | Auth Middleware | Proteger rotas | 4h |
| 2-5 | Request Update | POST endpoint | 6h |
| 2-6 | Status Atualização | Status endpoint | 4h |
| 2-7 | LGPD Masking | Utilitário masking | 4h |

### 5.2 Novas Stories para Sprint 3

| Story ID | Título | Descrição | Estimativa |
|---------|--------|----------|----------|
| 3-3 | Rate Limiting | Middleware 500/min | 4h |
| 3-4 | Server Caching | TTL 5min | 6h |
| 3-5 | Credit Tracking | Usage display | 4h |

### 5.3 Post-MVP

| Story ID | Título | Descrição |
|---------|--------|----------|
| 4-1 | Insights Panel | Tendências |
| 4-2 | Multi-OAB | Múltiplas OABs |

---

## 6. Cobertura Research vs Backlog

### 6.1 Resumo

| Categoria | Total | Covered | Gap |
|-----------|-------|---------|-----|
| Functional Requirements | 9 | 6 | 3 |
| Non-Functional Requirements | 7 | 4 | 3 |
| API Endpoints | 8 | 4 | 4 |

### 6.2 Percentage

- **Features covered:** 67% (6/9)
- **NFR covered:** 57% (4/7)
- **Endpoints covered:** 50% (4/8)

---

## 7. Risks e Mitigações

| Risk | Mitigação |
|------|-----------|
| Escopo creep | Freeze backlog após Sprint Planning |
| TD acumulando | 20% tempo dedicado |
| Gaps não descobertos | Revisão a cada sprint |

---

## 8. Definition of Ready

- [ ] Story tem AC completos
- [ ] Estimativa de esforço
- [ ] Dependências identificadas
- [ ] Criteria de teste definidos

## 9. Definition of Done

- [ ] Código implementado
- [ ] testes passando
- [ ] Code review aprovado
- [ ] Deployado staging
- [ ] Dokumentação atualizada

---

## 10. Próximos Passos

1. [ ] Revisar stories propostas
2. [ ] Definir ordem de prioridade
3. [ ] Estimar esforço por story
4. [ ] Aprovar Sprint 2 backlog
5. [ ] Iniciar Sprint 2

---

## 11. Histórico

| Versão | Data | Mudança |
|-------|------|---------|
| 1.0 | 2026-04-08 | Initial planning |