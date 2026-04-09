# Sprint Change Proposal — Sistema de Atualização de Processos com Callback

**Projeto:** Legal Dashboard
**Data:** 2026-04-09
**Versão:** 1
**Status:** ✅ Em Andamento — Implementação backend+infra concluída, frontend T6-T9 concluído

---

## Seção 1 — Resumo da Mudança

**Trigger:** Análise de qualidade da API Escavador revelou staleness sistêmico (p50=365 dias, p90=1095 dias) nos 3 pilotos de teste. Identificou-se que a API oferece endpoint de solicitação de atualização de processo, mas faltam:
1. Mecanismo de callback para receber resultado异步
2. Critério de viabilidade econômica para evitar custo excessivo

**Objetivo:**
- Implementar fluxo de request/update para processos stale com callback
- Definir threshold temporal para definir Economic Inviability (EI) — processos acima do limite não justificam custo de atualização

**Resultado esperado:**
- Reduzir staleness em processos de alta relevância (<365 dias)
- Evitar custo em processos de baixa relevância (>365 dias)

---

## Seção 2 — Análise de Impacto

### Componentes afetados

| Componente | Impacto | Tipo |
|---|---|---|
| `EscavadorClient` | Adicionar método `requestProcessUpdate()` | 🆕 |
| `cache.ts` | Armazenar request_id + callback config | 🔄 |
| `fulfillment-engine` | Integrar update flow no roteiro | 🔄 |
| UI (Admin) | Mostrar status "update pending/completed" | 🆕 |
| Webhook endpoint | Receber callback da API Escavador | 🆕 |

### Fluxo proposto

```
Processo com staleness > threshold
         ↓
[Verificar se já tem update_request_id pendente]
         ↓
[Se não → POST /api/v1/processos/{id}/atualizar]
         ↓
[Armazenar request_id + callback_url]
         ↓
[Aguardar callback (async)]
         ↓
[POST /webhook/escavador/update]
         ↓
[Atualizar cache com novos dados]
```

### Dados necessários do callback

```typescript
interface EscavadorUpdateCallback {
  request_id: string;
  processo_id: string;
  status: 'completed' | 'failed';
  timestamp: string;
  data?: {
    data_ultima_movimentacao: string;
    movimentacoes: Movimentacao[];
    fontes: Fonte[];
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## Seção 3 — Definição de Economic Inviability (EI)

### Thresholds implementados

| Threshold | Valor | Significado |
|---|---|---|
| `STALENESS_UPDATE_THRESHOLD` | **365 dias** | Acima deste valor, solicitar update automaticamente |
| `STALENESS_EI_THRESHOLD` | **730 dias (2 anos)** | Acima deste valor, **não** solicitar update (EI) |

### Lógica de decisão

```
Se dias <= 365      → Não precisa update (dados recentes)
Se 365 < dias <= 730 → ✅ Solicitar update
Se dias > 730       → ❌ Economic Inviability (ignorar)
```

| Staleness | Ação | Justificativa |
|---|---|---|
| <30 dias | ✅ Não atualizar | Alta relevância, dados recentes |
| 30-365 dias | ✅ Não atualizar | Dados suficientemente atuais |
| 365-730 dias | ✅ Atualizar | Stale, vale o custo |
| **>730 dias** | ❌ **Ignorar (EI)** | Custódia provavelmente extinta |

### Critérios complementares (futuro)

- **Quantidade de movimentações**: Se <5, considerar EI mesmo <365 dias
- **Status predito**: Se INATIVO + >180 dias, considerar EI
- **Última movimentação**: Se "arquivado" ou "extinto", EI independente do tempo

### Variáveis de ambiente

```env
# Threshold de staleness em dias para update automático
STALENESS_UPDATE_THRESHOLD=365

# Staleness para EI (não atualizar)
STALENESS_EI_THRESHOLD=730  # 2 anos

# Habilitar updates automáticos
ENABLE_AUTO_UPDATE=true
```

---

## Seção 4 — Task List

### Backend

- [x] **T1** — Adicionar `requestProcessUpdate(processoId: string)` em `escavador.ts` ✅ (já existia `requestUpdate`)
- [x] **T2** — Implementar armazenamento de `update_requests` no cache (request_id, processo_id, callback_url, created_at, status) ✅
- [x] **T3** — Criar endpoint `/api/webhooks/escavador` para receber callbacks ✅
- [ ] **T4** — Implementar retry logic (exponential backoff) para falhas no callback
- [x] **T5** — Adicionar lógica de threshold no fulfillment-engine (pular processos EI) ✅

### Frontend (Admin)

- [x] **T6** — Exibir badge "update pending" em processos stale ✅
- [x] **T7** — Exibir "update completed" com timestamp quando recebido ✅
- [x] **T8** — Permitir trigger manual de update (botão "Solicitar atualização") ✅
- [x] **T9** — Dashboard de stats: "updates pendentes", "updates concluídos", "updates falhados" ✅

### Infra

- [x] **T10** — Configurar callback URL no dashboard Escavador (se necessário) ✅ (via env var)
- [x] **T11** — Configurar idempotência no webhook (request_id como key) ✅

---

## Seção 5 — Definition of Done

- [ ] Fluxo completo de request → callback → update testado end-to-end
- [ ] Threshold aplicado corretamente no fulfillment (processos >365 dias pulados)
- [ ] UI mostra status de update pendente/concluído
- [ ] Retry logic funciona para callbacks falhados
- [ ] Métricas expostas: `stale_processes`, `updates_requested`, `updates_completed`, `updates_failed`
- [ ] Documentação: como configurar callback_url na API Escavador

---

## Seção 6 — Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API Escavador não suporta webhook callback | Baixa | Alto | Verificar docs; fallback para polling |
| Callback não chega (rede/firewall) | Média | Médio | Implementar polling fallback + retry |
| Custo de updates excede orçamento | Alta | Médio | Threshold EI reduz custos; monitoringalert |
| Dados de retorno diferentes do esperado | Média | Médio | Versionar schema de retorno |

---

## Seção 7 — Estimativa

| Tamanho | Estimativa |
|---|---|
| Backend | 3 story points |
| Frontend | 2 story points |
| Infra | 1 story point |
| **Total** | **6 story points** |

---

## Seção 8 — Dependências

- **API Escavador**: Confirmar suporte a webhook callback e formato de payload
- **SKU Schema**: Atualizar para incluir campo `staleness_threshold` por SKU (permite relatórios premium com threshold maior)

---

## Aprovação

| Role | Nome | Data | Assinatura |
|---|---|---|---|
| Product Owner | [PENDING] | | |
| Tech Lead | [PENDING] | | |
| QA | [PENDING] | | |

---

## Referências

- Documentação API Escavador: https://api.escavador.com/docs
- Análise de qualidade: `docs/api-quality-analysis.html`
- Arquitectura: `docs/arquitetura-modular-painel-processual.md`
- BMAD Method: Sprint Change Proposal Framework