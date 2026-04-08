# Backlog Atualizado - Legal Dashboard

**Data:** 2026-04-08  
**Versão:** 4.0 (Baseado em Arquitetura Modular)
**Base:** `docs/arquitetura-modular-painel-processual.md`

---

## 1. Arquitetura por Tier

| Tier | Descrição | Status Atual |
|------|----------|-------------|
| Tier 1 | Solo Essencial | ⏳ Parcial (70%) |
| **Tier 2** | **Carteira Inteligente** | **MVP Atual** |
| Tier 3 | Inteligência de Escritório | ⏳ backlog |
| Tier 4 | Diagnóstico Estratégico | ⏳ backlog |

---

## 2. Sprint 1: Infraestrutura ✅

**Status:** done (3/3 stories)

| Story ID | Feature | Tier | Status |
|----------|---------|------|-------|
| S-01 | Project Setup (Next.js + Supabase) | 1 | ✅ done |
| S-02 | Authentication | 1 | ✅ done |
| S-03 | OAB Selector | 1 | ✅ done |

---

## 3. Sprint 2: Tier 2 MVP (Core - Carteira Inteligente)

**Status:** done (10/10 stories)

| Story ID | Feature | Tier | Status | Observação |
|----------|---------|------|--------|------------|
| S-04 | Endpoints (processos + detail + mov) | 2 | ✅ done | 7 endpoints |
| S-05 | Health KPIs (total, stale%, active/inactive) | 2 | ✅ done | 4 KPIs |
| S-06 | Case Table com filtros | 2 | ✅ done | tribunal + status |
| S-07 | Case Detail drawer | 2 | ✅ done | movimentos |
| S-08 | Error handling (401/402/404/422) | 2 | ✅ done | mensagens |
| S-09 | UX Microcopy (tooltips, labels) | 2 | ✅ done | tooltips |
| S-10 | LGPD Masking (CPF, nomes) | 2 | ✅ done | lib/lgpd.ts |
| S-11 | Request Update (async) | 2 | ✅ done | POST + Status |
| S-12 | Validations (CNJ, paginação) | 2 | ✅ done | validações |
| S-12b | Auth Middleware | 2 | ✅ done | blocker resolvido |

**Sprint 2 Total:** 10 stories | ✅ COMPLETO

---

## 4. Sprint 3: Admin + NFRs

**Status:** done (10/10 stories)

| Story ID | Feature | Tier | Status |
|----------|---------|------|--------|
| S-13 | Admin Dashboard (credits, users) | 2 | ✅ done |
| S-14 | Audit Logs | 2-3 | ✅ done |
| S-15 | Rate Limiting (500 req/min) | 2 | ✅ done |
| S-16 | Server Caching (5min TTL) | 2 | ✅ done |
| S-17 | Perfis + Permissões | 3 | ⏳ TD |
| S-18 | Performance (<3s) | 2 | ✅ done |
| S-19 | Documentos endpoint | 2 | ✅ done |
| S-20 | Envolvidos endpoint | 2-3 | ✅ done |
| S-21 | Credit tracking | 3 | ✅ done |
| S-22 | Observabilidade | 2 | ✅ done |

---

## 5. Sprint 4: Tier 2 Completo (Features Faltantes)

**Foco:** Completar Tier 2 para MVP

| Story ID | Feature | Tier | Estimativa | Dependências |
|----------|---------|------|-----------|--------------|
| S-23 | Histograma de Staleness | 2 | 8h | S-05 |
| S-24 | Distribuição por tribunal | 2 | 6h | S-04 |
| S-25 | Carteira quente/fria | 2 | 6h | S-05 |
| S-26 | Amostragem estratificada | 2 | 4h | S-04 |
| S-27 | Funil de atualizações | 2 | 4h | S-11 |

**Sprint 4 Total:** 5 stories | ~28h

---

## 6. Sprint 5: Tier 3 (Primeira Fase)

**Foco:** Multi-OAB + Governança

| Story ID | Feature | Tier | Estimativa | Dependências |
|----------|---------|------|-----------|--------------|
| S-28 | Multi-OAB support | 3 | 8h | S-03 |
| S-29 | Comparação entre OABs | 3 | 6h | S-28 |
| S-30 | Heatmap tribunal × advogado | 3 | 6h | S-28 |
| S-31 | Alertas configuráveis | 3 | 6h | S-05 |
| S-32 | RBAC (perfis) | 3 | 4h | S-17 |

**Sprint 5 Total:** 5 stories | ~30h

---

## 7. Sprint 6+: Tier 4 (Horizonte Estratégico)

**Foco:** Integração + BI

| Story ID | Feature | Tier | Estimativa |
|----------|---------|------|-----------|
| S-33 | Análise por tema/classe | 4 | 8h |
| S-34 | Contrapartes recorrentes | 4 | 6h |
| S-35 | Módulo de custo | 4 | 6h |
| S-36 | API própria | 4 | 8h |
| S-37 | Relatórios automáticos | 4 | 8h |

---

## 8. Coverage por Tier

| Tier | Feature | Coverage | Status |
|------|----------|----------|--------|
| Tier 1 | Solo Essencial | 70% | ⏳ |
| **Tier 2** | **Carteira Inteligente** | **80%** | ⏳ |
| Tier 3 | Inteligência de Escritório | 30% | ⏳ |
| Tier 4 | Diagnóstico Estratégico | 10% | ⏳ |

---

## 9. Test Coverage

| Módulo | Testes | Status |
|--------|-------|--------|
| LGPD | 9 | ✅ |
| Cache | 3 | ✅ |
| Rate Limit | 2 | ✅ |
| E2E | 3 | ⏳ |
| **TOTAL** | **17** | **14 passing** |

---

## 10. Definition of Done (Atualizado)

- [x] Código implementado
- [x] Testes passando
- [ ] Code review aprovado
- [ ] Deployado staging
- [ ] Validação com usuários Tier 2

---

## 11. Próximos Passos

1. [x] Sprint 1 ✅
2. [x] Sprint 2 ✅
3. [x] Sprint 3 ✅
4. [x] Testes unitários ✅
5. [ ] Sprint 4: Completar Tier 2 ⏳
6. [ ] Sprint 5: Tier 3 (primeira fase)
7. [ ] Avaliar Tier 4

---

## 12. Riscos e Mitigações

| Risco | Mitigação |
|------|----------|
| Escopo Tier 2 muito largo | Priorizar histograma + distribuição |
| Testes E2E não executados | Executar antes de Sprint 4 |
| Gap Tier 1 (30%) | Documentar como freemium |