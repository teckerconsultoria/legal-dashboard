# Roadmap de Sprints — Legal Dashboard

## Sprint Atuais

### Sprint 2026-04-08: Fulfillment Foundation ✅ CONCLUÍDA
**Status:** Concluída
**Deliverables:**
- Engine de fulfillment baseado em SKU schema
- Paginação completa da API Escavador
- E2E tests FE-01 a FE-07 passando
- Rotas `/admin/orders`, `/admin/orders/[id]`

**Arquivo:** `docs/sprint-change-proposal-2026-04-08.md`

---

### Sprint 2026-04-09: Staleness Callback & Economic Inviability 🚧 EM ANDAMENTO
**Status:** Em Andamento (backend+infra✅, frontend✅)
**Deliverables:**
- Threshold EI: 730 dias (2 anos) não atualiza
- Threshold update: 365 dias (ativa update)
- Webhook `/api/webhooks/escavador` para callbacks
- UI: dashboard de updates + badges + trigger manual

**Pendências:**
- Retry logic para updates falhados (T4)
- Integração do resultado do callback com cache do processo

**Arquivo:** `docs/sprint-change-proposal-2026-04-09-staleness-callback.md`

---

## Sprint Planejadas

### Sprint 2026-04-10: Checkout com Coleta de Inputs (OAB/CNJ)
**Proposta:** Coletar OAB+Estado ou CNJ no checkout antes do pagamento

**Dependência:** Fulfillment schema (já define required_inputs)

**Tasks previstas:**
1. Criar página `/checkout/inputs` para coletar dados do cliente antes do Stripe
2. Validar inputs contra schema.required_inputs do SKU selecionado
3. Armazenar inputs na order (target_oab_estado, target_oab_numero, target_numero_cnj)
4. Redirecionar para Stripe checkout após inputs válidos
5. UI: formulário com UF dropdown + input número + opção CNJ

**Dependências:** SKU schema (required_inputs)

---

### Sprint 2026-04-11: Cache de Processos com Staleness Metadata
**Proposta:** Armazenar timestamp de fetch por processo para calcular staleness real vs string "há X dias"

**Tasks previstas:**
1. Adicionar campo `fetched_at` no cache de processo
2. Calcular staleness = now - fetched_at
3. Expor staleness real na UI
4. Dashboard de evolução temporal por processo

**Dependências:** Sprint 2026-04-09 (webhook precisa popular dados)

---

### Sprint 2026-04-12: Otimização de Custos - Priorização de Tribunais
**Proposta:** Focar scraping em tribunais com maior volume por advogado

**Tasks previstas:**
1. Agregar distribuição tribunais por OAB (já em cache)
2. Score de prioridade por tribunal (baseado em volume + stickiness)
3. Queue paralelo por tribunal no fulfillment
4. Rate limiting por tribunal (evitar ban)

**Dependências:** Nenhuma (pode paralelo com outras sprints)

---

### Sprint 2026-04-12: Monitoring & Alerts - Dashboard de Saúde
**Proposta:** Métricas operacionais para o ops dashboard

**Tasks previstas:**
1. Métricas: stale_processes, updates_requested, updates_completed, updates_failed
2. Alertas: >20% gap resumo vs coletado, >50% updates falhados
3. Health check endpoint `/api/health/fulfillment`
4. Logging estruturado para debug

**Dependências:** Sprint 2026-04-09 (update stats já expostos)

---

### Sprint 2026-04-13: SKU Schema V2 - Dynamic Thresholds
**Proposta:** Permitir threshold de staleness customizado por SKU

**Tasks previstas:**
1. Adicionar campo `staleness_threshold_days` no SKU schema
2. SKU premium pode ter threshold maior (ex: 2 anos vs 1 ano)
3. UI para configurar threshold por SKU
4. Validação: threshold > EI threshold (730)

**Dependências:** Sprint 2026-04-09 (EI thresholds já configuráveis globalmente)

---

## Backlog (ordenado por prioridade)

| Prioridade | Item | Estimativa |
|---|---|---|
| HIGH | T4: Retry logic para updates falhados | 2 SP |
| HIGH | Cache de processos com staleness real | 3 SP |
| MED | Monitoring dashboard de saúde | 3 SP |
| MED | Priorização de tribunais | 2 SP |
| LOW | SKU schema V2 com thresholds customizados | 2 SP |
| LOW | UI de configuração de thresholds | 1 SP |

---

## Métricas de Sprint

| Sprint | Story Points | Entregues | Pendentes |
|---|---|---|---|
| 2026-04-08 | 8 | 8 | 0 |
| 2026-04-09 | 6 | 5 (T1-T3,T5,T6-T9) | 1 (T4) |
| 2026-04-10 | 3 | 0 | 3 |
| 2026-04-11 | 2 | 0 | 2 |
| 2026-04-12 | 3 | 0 | 3 |

---

_Last updated: 2026-04-09_