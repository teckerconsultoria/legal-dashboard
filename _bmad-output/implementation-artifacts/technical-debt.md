# Technical Debt - Legal Dashboard

**Data:** 2026-04-08  
**Sprint:** 2 (planejada)

---

## Dívida Técnica Identificada

### 1. Estado Global (Zustand)

| Item | Descrição | Prioridade | Esforço |
|------|----------|----------|---------|
| **Global State** | Zustand instalado mas não utilizado. Estados locais com useState. | média | 4h |

**Recomendação:** Implementar store para:
- Auth state (user, session)
- OAB selection persistente
- Configurações de filtros

---

### 2. Testes Automatizados

| Item | Descrição | Prioridade | Esforço |
|------|----------|----------|---------|
| **E2E Tests** | Playwright instalado, sem testes | alta | 8h |
| **Unit Tests** | Componentes sem testes | média | 4h |

**Recomendação:** Setup inicial:
- Teste de login flow
- Teste de OAB selector
- Smoke tests

---

### 3. Autenticação

| Item | Descrição | Prioridade | Esforço |
|------|----------|----------|---------|
| **Auth Middleware** | rotas privadas sem proteção | alta | 2h |
| **Session Refresh** | sem refresh token automático | baixa | 2h |

**Recomendação:** Adicionar middleware de proteção para rotas autenticadas.

---

### 4. Admin Dashboard

| Item | Descrição | Prioridade | Esforço |
|------|----------|----------|---------|
| **Página vazia** | `/admin` existe, sem funcionalidade | alta | 6h |

**Recomendação:** Implementar:
- Credit usage display
- User management (CRUD)
- Rate limit config

---

### 5. LGPD/Masking

| Item | Descrição | Prioridade | Esforço |
|------|----------|----------|---------|
| **Data Masking** | Dados pessoais não mascarados | média | 4h |

**Recomendação:** Implementar utilitário de masking para CPFs/CNPJs.

---

## backlog Sprint 2

| # | Item | Prioridade | Esforço |
|---|------|-----------|---------|
| 1 | Auth Middleware | alta | 2h |
| 2 | E2E Tests | alta | 8h |
| 3 | Admin Dashboard | alta | 6h |
| 4 | Global State (Zustand) | média | 4h |
| 5 | LGPD Masking | média | 4h |
| 6 | Unit Tests | média | 4h |
| 7 | Session Refresh | baixa | 2h |

**Total estimado:** 30h

---

## Ações Recomendadas

1. **Alta prioridade:** Auth middleware + E2E tests (pre-requisitos)
2. **Média prioridade:** Admin + Zustand (funcionalidade core)
3. **Baixa prioridade:** LGPD masking + Session refresh

---

## Definition of Done

- [ ] Auth middleware implementada
- [ ] Smoke tests passando
- [ ] Admin dashboard funcional
- [ ] Zustand store ativo
- [ ] LGPD masking aplicado