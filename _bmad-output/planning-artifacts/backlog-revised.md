# Backlog Revisado - Legal Dashboard

**Data:** 2026-04-08  
**Versão:** 3.0 (Revisado)  
**Base:** Research Document

---

## 1. Overview

| Métrica | Anterior | Revisado |
|---------|----------|---------|
| Total Stories | 56 | **28** |
| Sprint 2 | 24 | **9** |
| Sprint 3 | 16 | **10** |
| Esforço total | ~259h | **~160h** |

---

## 2. Sprint 1: Infraestrutura ✅

**Status:** done

| Story ID | Feature | Status |
|----------|---------|---------|
| S-01 | Project Setup (Next.js + Supabase) | ✅ done |
| S-02 | Authentication | ✅ done |
| S-03 | OAB Selector | ✅ done |

**Blockers tratado em Sprint 2:**
- S-02a: Auth Middleware | 🔴 pendente | Alta prioridade

---

## 2. Sprint 2: Core MVP

**Foco:** Health Panel + Case Management

| Story ID | Feature | Estimativa | Dependências |
|----------|---------|-----------|--------------|
| S-04 | Endpoints (processos + detail + mov) | 8h | S-03 |
| S-05 | Health KPIs (total, stale%, active/inactive) | 8h | S-04 |
| S-06 | Case Table com filtros | 6h | S-04 |
| S-07 | Case Detail drawer | 6h | S-04 |
| S-08 | Error handling (401/402/404/422) | 4h | S-04 |
| S-09 | UX Microcopy (tooltips, labels, sampling) | 4h | S-05 |
| S-10 | LGPD Masking (CPF, nomes) | 6h | S-07 |
| S-11 | Request Update (POST + Status) | 8h | S-07 |
| S-12 | Validations (CNJ, paginação) | 4h | S-04 |
| **S-12b** | Auth Middleware | 4h | S-02 | 🔴 NOVO (blocker Sprint 1) |

**Sprint 2 Total:** 10 stories | ~58h

**Technical Debt (baixa prioridade):**
| TD-01 | Zustand setup | Remover ou usar |

---

## 3. Sprint 3: Admin + NFRs

**Foco:** Admin Dashboard + Non-Functionals

| Story ID | Feature | Estimativa | Dependências |
|----------|---------|-----------|--------------|
| S-13 | Admin Dashboard (credits, users) | 6h | S-02 |
| S-14 | Audit Logs | 4h | S-13 |
| S-15 | Rate Limiting (500 req/min) | 4h | S-04 |
| S-16 | Server Caching (5min TTL) | 6h | S-04 |
| S-17 | Perfis + Permissões | 4h | S-02 |
| S-18 | Page Load Performance (<3s) | 4h | S-04 |
| S-19 | Documentos públicos endpoint | 4h | S-07 |
| S-20 | Envolvidos endpoint | 4h | S-07 |
| S-21 | Credit tracking (header) | 4h | S-13 |
| S-22 | Observabilidade (logs) | 4h | S-08 |

**Sprint 3 Total:** 10 stories | ~40h

---

## 4. Sprint 4: Post-MVP

**Foco:** Enhancements

| Story ID | Feature | Estimativa | Dependências |
|----------|---------|-----------|--------------|
| S-23 | Insights Panel (trends) | 8h | S-05 |
| S-24 | Métricas avançadas (cobertura, ritmo) | 6h | S-23 |
| S-25 | Multi-OAB support | 6h | S-03 |
| S-26 | Real-time alerts | 8h | S-04 |
| S-27 | API para integrações | 6h | - |
| S-28 | Feed de eventos (novos processos) | 6h | S-04 |

**Sprint 4 Total:** 6 stories | ~40h

---

## 5. Resumo por Categoria

| Categoria | Stories |
|-----------|---------|
| Endpoints | 6 |
| Features MVP | 7 |
| Post-MVP | 4 |
| NFRs | 5 |
| UX/LGPD | 3 |
| Testes/Validations | 3 |
| **TOTAL** | **28** |

---

## 6. Esforço Total

| Sprint | Stories | Esforço |
|--------|---------|--------|
| Sprint 1 | 3 | ~24h |
| Sprint 2 | 9 | ~54h |
| Sprint 3 | 10 | ~40h |
| Sprint 4 | 6 | ~40h |
| **TOTAL** | **28** | **~158h** |

---

## 7. Coverage Research

| Categoria | Covered | % |
|-----------|---------|---|
| Endpoints MVP | 4/4 | 100% |
| Endpoints All | 6/9 | 67% |
| Features MVP | 7/9 | 78% |
| Post-MVP | 4/4 | 100% |
| NFRs | 5/7 | 71% |
| **Total** | **22/31** | **71%** |

---

## 8. Definition of Done

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review aprovado
- [ ] Deployado staging

---

## 9. Próximos Passos

1. [x] Sprint 1 completa
2. [x] Sprint 2 completa
3. [x] Sprint 3 completa
4. [ ] Sprint 4: Post-MVP
5. [ ] Adicionar testes unitários

---

## 10. Riscos

| Risco | Mitigação |
|------|----------|
| 28 stories ainda muitas | Priorizar MVP (Sprints 1-3) |
| ~158h esforço | Ajustar capacidade |