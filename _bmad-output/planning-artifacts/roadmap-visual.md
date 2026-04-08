# Roadmap - Legal Dashboard / Painel de Inteligência Processual

**Data:** 2026-04-08  
**Arquitetura Base:** `docs/arquitetura-modular-painel-processual.md`

---

## Visão Geral - Arquitetura por Tier

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 4 — Diagnóstico Estratégico (Horizonte)             │
│  ├─ API própria                                            │
│  ├─ Relatórios automáticos                                 │
│  └─ Integração sistemas externos                            │
├─────────────────────────────────────────────────────────────┤
│  TIER 3 — Inteligência de Escritório (2026 Q3+)             │
│  ├─ Multi-OAB                                               │
│  ├─ Heatmap tribunal × advogado                                │
│  ├─ RBAC completo                                          │
│  └─ Alertas configuráveis                                   │
├─────────────────────────────────────────────────────────────┤ ⬅️ Sprint 5
│  TIER 2 — Carteira Inteligente (MVP 2026 Q2)               │   5 stories
│  ├─ KPIs: total, stale%, active/inactive                   │
│  ├─ Histograma staleness         ⬅️ FALTA                  │
│  ├─ Distribuição tribunal        ⬅️ FALTA                 │
│  ├─ Carteira quente/fria          ⬅️ FALTA                 │
│  ├─ Amostragem estratificada      ⬅️ FALTA                 │
│  └─ Funil de atualizações                                    │
├─────────────────────────────────────────────────────────────┤ ⬅️ Sprint 4
│  TIER 1 — Solo Essencial (Free Trial)                      │   5 stories
│  ├─ OAB selector                                           │
│  ├─ Lista processos                                        │
│  └─ Status visual                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Sprint Planning

### Sprint 1 ✅ (Concluída)
- Infraestrutura básica
- 3 stories

### Sprint 2 ✅ (Concluída)
- Core MVP
- 10 stories

### Sprint 3 ✅ (Concluída)
- Admin + NFRs
- 10 stories

### Sprint 4 ⏳ (Próxima)
- Tier 2 Completo
- **5 stories prioritárias:**
  1. Histograma staleness (8h)
  2. Distribuição tribunal (6h)
  3. Carteira quente/fria (6h)
  4. Amostragem estratificada (4h)
  5. Funil atualizações (4h)

### Sprint 5 📋 (Planejada)
- Tier 3 Primeira Fase
- 5 stories

### Sprint 6+ 📋 (Horizonte)
- Tier 4

---

## Status Atual

| Métrica | Valor |
|---------|-------|
| **Tier atual** | Tier 2 (80%) |
| **Completude Tier 2** | 80% |
| **Stories totais** | 28 |
| **Stories completas** | 23 |
| **Testes passing** | 14/14 ✅ |
| **Build** | ✅ passing |

---

## Gaps Tier 2 (Sprint 4)

| # | Feature | Esforço | Status |
|---|---------|---------|--------|
| 1 | Histograma staleness | 8h | ⏳ falta |
| 2 | Distribuição tribunal | 6h | ⏳ falta |
| 3 | Carteira quente/fria | 6h | ⏳ falta |
| 4 | Amostragem | 4h | ⏳ falta |
| 5 | Funil atualizações | 4h | ⏳ falta |

---

## Próximos Passos

1. [x] Backlogs atualizados (tier architecture)
2. [x] Sprint status definido
3. [ ] Executar Sprint 4 (Tier 2 Completo)
4. [ ] Testes E2E
5. [ ] Validação com users