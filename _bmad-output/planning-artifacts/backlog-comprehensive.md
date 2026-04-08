# Backlog Completo - Legal Dashboard

**Data:** 2026-04-08  
**Versão:** 2.0 (Comprehensive)  
**Base:** Research Document (docs/deep-research-report.md)

---

## 1. Overview

### 1.1 Cobertura do Research

| Categoria | Total | Backlog Original | Novo Backlog |
|-----------|-------|-----------------|-------------|
| Endpoints | 9 | 4 | 9 |
| Features MVP | 9 | 6 | 9 |
| Post-MVP | 4 | 0 | 4 |
| Health Metrics | 8 | 1 | 8 |
| NFRs | 7 | 4 | 7 |
| UX/LGPD | 8 | 0 | 8 |
| Testes | 7 | 1 | 7 |

**Nova Cobertura Alvo:** 100%

---

## 2. ENDPOINTS (9 stories)

### 2.1 Endpoints MVP

| Story ID | Endpoint | Descrição | Sprint | Status |
|----------|----------|-----------|--------|---------|
| E-01 | GET /advogado/resumo | Resumo OAB | 1 | ✅ done |
| E-02 | GET /advogado/processos | Lista processos | 2 | ⏳ |
| E-03 | GET /processos/{numero} | Capa processo | 2 | ⏳ |
| E-04 | GET .../movimentacoes | Movimentações | 2 | ⏳ |

### 2.2 Endpoints Falantes

| Story ID | Endpoint | Descrição | Sprint | Status |
|----------|----------|-----------|--------|---------|
| E-05 | GET .../status-atualizacao | Status atualização | 2 | 🔴 gap |
| E-06 | POST .../solicitar-atualizacao | Request update (async) | 2 | 🔴 gap |
| E-07 | GET .../documentos-publicos | Docs públicos | 3 | 🔴 gap |
| E-08 | GET .../envolvidos | Envolvidos | 3 | 🔴 gap |

### 2.3 Endpoints Post-MVP

| Story ID | Endpoint | Descrição | Sprint | Status |
|----------|----------|-----------|--------|---------|
| E-09 | GET monitoramentos/novos-processos | Feed eventos | 4 | 🔴 gap |

---

## 3. MVP FEATURES (9 stories)

### 3.1 Core Features

| Story ID | Feature | Research | Sprint | Status |
|----------|---------|----------|--------|---------|
| F-01 | OAB Selector | FR1 | 1 | ✅ done |
| F-02 | Health KPIs | FR2 | 2 | ⏳ |
| F-03 | Case Table | FR3 | 2 | ⏳ |
| F-04 | Case Detail | FR4 | 2 | ⏳ |
| F-05 | Admin Dashboard | FR5 | 3 | ⏳ |
| F-06 | Authentication | FR6 | 1 | ⚠️ parcial |

### 3.2 Features Faltando

| Story ID | Feature | Research | Sprint | Status |
|----------|---------|----------|--------|---------|
| F-07 | Request Update (async) | FR7 | 2 | 🔴 gap |
| F-08 | Error handling 401/402/404/422 | NFR4 | 2 | 🔴 gap |
| F-09 | Rate limiting display | NFR2 | 3 | 🔴 gap |

---

## 4. POST-MVP FEATURES (4 stories)

| Story ID | Feature | Research | Sprint | Status |
|----------|---------|----------|--------|---------|
| P-01 | Insights Panel | FR8 | 4 | 🔴 gap |
| P-02 | Multi-OAB support | FR9 | 4 | 🔴 gap |
| P-03 | Real-time alerts | Post-MVP | 4 | 🔴 gap |
| P-04 | API para integrações | Post-MVP | 4 | 🔴 gap |

---

## 5. HEALTH METRICS (8 stories)

| Story ID | Métrica | Definição | Sprint | Status |
|----------|---------|----------|--------|---------|
| M-01 | Total processos | quantidade_processos | 2 | ⏳ |
| M-02 | Staleness % | % desatualizados >30d | 2 | 🔴 gap |
| M-03 | Ativo/Inativo | status_predito | 2 | 🔴 gap |
| M-04 | Completude | % CNJ válido | 2 | 🔴 gap |
| M-05 | Cobertura por tribunal | count_by(fonte) | 3 | 🔴 gap |
| M-06 | Ritmo | Movimentações/30d | 4 | 🔴 gap |
| M-07 | Latência | Gap médio eventos | 4 | 🔴 gap |
| M-08 | Robustez | Taxa ERRO | 3 | 🔴 gap |

---

## 6. NON-FUNCTIONAL REQUIREMENTS (7 stories)

| Story ID | NFR | Descrição | Sprint | Status |
|----------|-----|----------|--------|---------|
| NFR-01 | Page load <3s | Performance | 2 | 🔴 gap |
| NFR-02 | Rate limiting | 500 req/min | 3 | 🔴 gap |
| NFR-03 | Uptime 99.5% | Disponibilidade | - | - |
| NFR-04 | Error handling | 401/402/404/422 | 2 | 🔴 gap |
| NFR-05 | LGPD/Masking | Data protection | 2 | 🔴 gap |
| NFR-06 | Audit Logs | Compliance | 3 | ⏳ |
| NFR-07 | Caching | TTL 5min | 3 | 🔴 gap |

---

## 7. UX/UI REQUIREMENTS (8 stories)

### 7.1 Microcopy e Tooltips

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| U-01 | Tooltip staleness | "Baseado em data_ultima_verificacao" | 2 | 🔴 gap |
| U-02 | Label IA | "classificação por IA" | 2 | 🔴 gap |
| U-03 | Label não encontrado | Explicação status | 2 | 🔴 gap |

### 7.2 Sampling e Modos

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| U-04 | Sampling toggle | "Amostra rápida vs Completo" | 2 | 🔴 gap |
| U-05 | Sample indicator | "Baseado em N processos" | 2 | 🔴 gap |

### 7.3 Perfis e Permissões

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| U-06 | Perfis de usuário | Admin/Analista/Leitura | 3 | 🔴 gap |
| U-07 | Consentimento | LGPD consent | 3 | 🔴 gap |

### 7.4 Visual Guidelines

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| U-08 | Semantic colors | Verde/Amarelo/Vermelho | 2 | 🔴 gap |

---

## 8. LGPD REQUIREMENTS (4 stories)

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| L-01 | Mask CPF/CNPJ | ***.**.123-** | 2 | 🔴 gap |
| L-02 | Mask nomes | Reduzir a iniciais | 2 | 🔴 gap |
| L-03 | Controle por perfil | Exibição controlada | 3 | 🔴 gap |
| L-04 | Auditoria acesso | Log de visualizações | 3 | 🔴 gap |

---

## 9. TEST CHECKLIST (7 stories)

| Story ID | Requisito | Descrição | Sprint | Status |
|----------|----------|---------|--------|---------|
| T-01 | Auth header validation | Bearer token | 1 | ⚠️ |
| T-02 | Credit tracking | Creditos-Utilizados | 3 | 🔴 gap |
| T-03 | Rate limit enforcement | 500 req/min | 3 | 🔴 gap |
| T-04 | CNJ validation | NUMERO_CNJ_INVALIDO | 2 | 🔴 gap |
| T-05 | Status validation | PENDENTE/SUCESSO/ERRO | 2 | 🔴 gap |
| T-06 | Paginação testada | links.next | 2 | 🔴 gap |
| T-07 | Observabilidade | Logs 402/404/422 | 2 | 🔴 gap |

---

## 10. SPRINT PLANNING ATUALIZADO

### 10.1 Sprint 1: Infraestrutura (✅ done)

| Story IDs | Total |
|----------|-------|
| E-01, F-01, F-06 | 3 |
| + T-01 | +1 |
| **Total Sprint 1** | **4** |

### 10.2 Sprint 2: Case Management (⏳)

| Story IDs | Total |
|----------|-------|
| E-02, E-03, E-04 | 3 |
| F-02, F-03, F-04 | 3 |
| F-08, NFR-04 | 2 |
| M-01, M-02, M-03, M-04 | 4 |
| U-01, U-02, U-03, U-04, U-05, U-08 | 6 |
| L-01, L-02 | 2 |
| T-04, T-05, T-06, T-07 | 4 |
| **Total Sprint 2** | **24** |

### 10.3 Sprint 3: Admin & Monitoring (⏳)

| Story IDs | Total |
|----------|-------|
| E-07, E-08 | 2 |
| F-05, F-09 | 2 |
| M-05, M-08 | 2 |
| NFR-02, NFR-05, NFR-06, NFR-07 | 4 |
| U-06, U-07 | 2 |
| L-03, L-04 | 2 |
| T-02, T-03 | 2 |
| **Total Sprint 3** | **16** |

### 10.4 Sprint 4: Post-MVP (⏳)

| Story IDs | Total |
|----------|-------|
| E-09 | 1 |
| P-01, P-02, P-03, P-04 | 4 |
| M-06, M-07 | 2 |
| **Total Sprint 4** | **7** |

---

## 11. RESUMO

### 11.1 Stories por Categoria

| Categoria | Total |
|-----------|-------|
| Endpoints | 9 |
| MVP Features | 9 |
| Post-MVP | 4 |
| Health Metrics | 8 |
| NFRs | 7 |
| UX/UI | 8 |
| LGPD | 4 |
| Testes | 7 |
| **TOTAL** | **56** |

### 11.2 Esforço Estimado

| Sprint | Stories | Esforço Estimado |
|--------|---------|---------------|
| Sprint 1 | 4 | ~24h |
| Sprint 2 | 24 | ~120h |
| Sprint 3 | 16 | ~80h |
| Sprint 4 | 7 | ~35h |
| **TOTAL** | **51** | **~259h** |

### 11.3 Comparativo Research vs Backlog

| Métrica | Research | Backlog | Gap |
|---------|----------|--------|-----|
| Esforço MVP | 146-270h | ~259h | +13h |
| Features | 14+ | 56 | 42 |
| Coverage | - | 100% | - |

---

## 12. Risks e Mitigações

| Risco | Mitigação |
|------|----------|
| Escopo muito grande | Priorizar MVP vs Post-MVP |
| Esforço 259h | Dividir em sprints menores |
| Gaps técnicos | Adicionar stories técnicas |

---

## 13. Definition of Done

- [ ] Endpoint implementado e testado
- [ ] Feature funcional
- [ ] Métrica calculada corretamente
- [ ] UX aplicada
- [ ] LGPD compliance
- [ ] Teste passando

---

## 14. Próximos Passos

1. [ ] Revisar backlog proposto
2. [ ] Priorizar MVP (Sprints 1-3)
3. [ ]认同 Post-MVP (Sprint 4)
4. [ ] Iniciar Sprint 2