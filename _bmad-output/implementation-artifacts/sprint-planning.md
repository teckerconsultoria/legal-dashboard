# Sprint Planning - Legal Dashboard

**Data:** 2026-04-08  
**Status:** Planejamento inicial

---

## 1. Estrutura de Sprints

| Sprint | Epic | Stories | Duração | Início | Fim |
|--------|------|---------|---------|---------|-------|-----|
| Sprint 1 | Epic 1: Infraestrutura | 3 | 1 semana | 2026-04-01 | 2026-04-08 |
| Sprint 2 | Epic 2: Case Management | 3 | 1 semana | - | - |
| Sprint 3 | Epic 3: Admin & Monitoring | 2 | 1 semana | - | - |

**Total estimado:** 3 semanas

---

## 2. Sprint 1: Infraestrutura & Core (✅ Concluída)

**Período:** 2026-04-01 a 2026-04-08  
**Status:** ✅ done

### Stories Executadas

| Story | Descrição | Status |
|--------|-----------|--------|
| 1-1 Project Setup | Next.js 16.2 + Supabase | ✅ done |
| 1-2 Authentication | Login page + Auth | ✅ done |
| 1-3 OAB Selector | Homepage selector | ✅ done |

### Retrospective Items
- Auth middleware pendente
- Zustand não utilizado

---

## 3. Sprint 2: Case Management (⏳Planejada)

**Período:** Não iniciada  
**Duração sugerida:** 1 semana

### Stories

| Story | Descrição | Prioridade | Estimativa |
|--------|-----------|------------|-------------|
| 2-1 Health Panel KPIs | KPIs: total, stale%, active/inactive | alta | 8h |
| 2-2 Case Table | Lista com filtros | alta | 8h |
| 2-3 Case Detail | Drawer com movimientos | alta | 8h |

### Gaps Internos a Tratar

| Gap | Origem | Severidade |
|-----|-------|------------|
| Request Update (async) | Research | alta |
| Status-atualizacao | Research | alta |

### Dependências
- Epic 1 completo

---

## 4. Sprint 3: Admin & Monitoring (⏳ Planejada)

**Período:** Não iniciada  
**Duração sugerida:** 1 semana

### Stories

| Story | Descrição | Prioridade | Estimativa |
|--------|-----------|------------|-------------|
| 3-1 Admin Dashboard | Credit usage, rate limits | média | 8h |
| 3-2 Audit Logs | Logs de acesso | média | 6h |

### Gaps Internos a Tratar

| Gap | Origem | Severidade |
|-----|-------|------------|
| Rate Limiting (500 req/min) | NFR2 | alta |
| Server Caching (5min) | NFR7 | alta |

### Dependências
- Epic 2 completo

---

## 5. Technical Debt a Distribuir

| Item | Sprint | Severidade |
|------|--------|------------|
| Auth Middleware | 2 | alta |
| LGPD Masking | 2 | média |
| Credit Tracking | 3 | média |
| Server Caching | 3 | alta |

---

## 6. Definitions

### Definition of Ready
- [ ] Story tem Acceptance Criteria
- [ ] tasks detalhadas
- [ ] Dependências identificadas
- [ ] Estimativa de esforço

### Definition of Done
- [ ] Código implementado
- [ ] testes passando
- [ ] Code review aprovado
- [ ] Deployado para staging

---

## 7. capacidade

| Sprint | Stories | Esforço Total |
|--------|---------|---------------|
| Sprint 1 | 3 | ~24h |
| Sprint 2 | 3 + TD | ~28h |
| Sprint 3 | 2 + TD | ~26h |

**Total estimado:** ~78h (sem TD)

---

## 8. Riscos

| Risco | Mitigação |
|------|-----------|
| API Escavador indisponível | Mock data para dev |
| Escopo creep | Fechar escopo no início |
| TD acumulando | Dedicar 20% do tempo |

---

## 9. Tracking

| Métrica | Meta |
|--------|------|
| Velocidade | 3 stories/sprint |
| Cycle time | < 2 dias/story |
| Bug escape rate | < 5% |

---

## 10. Próximos Passos

1. [ ] Iniciar Sprint 2 (Epic 2)
2. [ ] Executar histórias em pares
3. [ ] Daily standups
4. [ ] Sprint review ao final

---

## 11. Histórico de Execução

| Sprint | Início | Fim | Stories | Completed |
|--------|--------|-----|---------|------------|
| Sprint 1 | 2026-04-01 | 2026-04-08 | 3 | 2.5 |