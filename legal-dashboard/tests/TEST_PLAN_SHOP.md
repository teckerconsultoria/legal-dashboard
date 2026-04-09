# Plano de Testes - Módulo Shop (Legal Dashboard)

## Resumo Executivo

Este plano de testes cobre o módulo de e-commerce do Legal Dashboard, garantindo:
- **Fluxo completo de compra** (shop → checkout → pagamento)
- **Integrações Stripe** (checkout sessions, webhooks)
- **Integração Supabase** (orders, order_items, state machine)
- **API routes** (REST endpoints)

---

## Arquivos de Teste

### 1. Testes E2E (Playwright)

| Arquivo | Descrição | Cobertura |
|---------|-----------|-----------|
| `e2e/shop/shop-catalog.spec.ts` | Catálogo de produtos | Página /shop, listagem SKUs |
| `e2e/shop/checkout-flow.spec.ts` | Fluxo de checkout | Compra, redirecionamento Stripe |
| `e2e/shop/checkout-pages.spec.ts` | Páginas de retorno | Success, cancel |
| `e2e/shop/order-management.spec.ts` | Gerenciamento de pedidos | Dashboard, histórico |

### 2. Testes de Integração - API Routes

| Arquivo | Descrição | Endpoints |
|---------|-----------|-----------|
| `tests/api/checkout.test.ts` | Checkout API | POST /api/checkout |
| `tests/api/skus.test.ts` | SKUs API | GET /api/skus |
| `tests/api/orders.test.ts` | Orders API | GET/POST /api/orders |
| `tests/api/webhooks.test.ts` | Stripe Webhooks | POST /api/webhooks/stripe |

### 3. Testes de Integração - Supabase

| Arquivo | Descrição | Cobertura |
|---------|-----------|-----------|
| `tests/db/orders.crud.test.ts` | CRUD Orders | create, read, update, delete |
| `tests/db/order-items.test.ts` | CRUD Order Items | Relacionamentos |
| `tests/db/state-machine.test.ts` | State Machine | Transições de status |
| `tests/db/relations.test.ts` | Relacionamentos | SKU → Order → OrderItem |

---

## Estratégia de Teste

### E2E Tests (Playwright)
- **Ambiente**: Local com Stripe Test Mode
- **Dados**: Usar Stripe Test Cards (4242 4242 4242 4242)
- **Setup**: Reset de estado antes de cada teste
- **Isolamento**: Cada teste independente

### API Integration Tests
- **Mock**: Supabase e Stripe (unitário)
- **Real**: Testes de integração opcionais com ambiente de teste
- **HTTP**: Testar request/response completo

### Database Tests
- **Ambiente**: Supabase Local/Preview
- **Setup**: Migrations aplicadas, seed data
- **Teardown**: Limpeza após cada teste
- **Isolamento**: Transactions ou unique IDs

---

## Comandos de Execução

```bash
# E2E Tests (Playwright)
npx playwright test e2e/shop/

# Unit + Integration Tests (Vitest)
npm test

# API Routes apenas
npm test -- tests/api/

# Database apenas
npm test -- tests/db/

# Todos com coverage
npm run test:run -- --coverage
```

---

## Cenários de Teste Críticos

### Priority 1 - Must Have
1. ✅ Página /shop carrega catálogo
2. ✅ Selecionar produto inicia checkout
3. ✅ Redirecionamento Stripe funciona
4. ✅ Webhook atualiza status para "paid"
5. ✅ State machine impede transições inválidas

### Priority 2 - Should Have
1. Página de sucesso mostra detalhes do pedido
2. Página de cancelamento funciona
3. API /orders lista apenas pedidos do usuário
4. CRUD de order_items funciona corretamente

### Priority 3 - Nice to Have
1. Validação de estoque (se aplicável)
2. Testes de concorrência
3. Performance testing

---

## Variáveis de Ambiente para Testes

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Métricas de Qualidade

- **Coverage mínimo**: 80% shop module
- **E2E pass rate**: 100%
- **Flaky tests**: 0 (máximo tolerado)
- **Test execution time**: < 5 min total
