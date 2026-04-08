# Testes Unitários - Legal Dashboard

## LGPD Tests (lgpd.test.ts)
```typescript
import { maskCPF, maskCNPJ, maskName, maskPhone } from '../src/lib/lgpd'

describe('LGPD Masking', () => {
  test('maskCPF valid', () => expect(maskCPF('12345678901')).toBe('***.***.***-01'))
  test('maskCNPJ valid', () => expect(maskCNPJ('12345678000190')).toBe('**.***.***/****-90'))
  test('maskName full', () => expect(maskName('João Silva')).toBe('João .'))
  test('maskPhone 10', () => expect(maskPhone('11999999999')).toBe('(**) ****-9999'))
})
```

## Rate Limit Tests (rate-limit.test.ts)
```typescript
import { apiRateLimiter } from '../src/lib/rate-limit'

test('within limit', () => expect(apiRateLimiter.check('user1')).toBe(true))
test('exceeded limit', () => {
  for (let i = 0; i < 500; i++) apiRateLimiter.check('user1')
  expect(apiRateLimiter.check('user1')).toBe(false)
})
```

## Cache Tests (cache.test.ts)
```typescript
import { cacheGet, cacheSet } from '../src/lib/cache'

test('cache set/get', () => {
  cacheSet('key1', { data: 'test' })
  expect(cacheGet('key1')).toEqual({ data: 'test' })
})
```

---

## Executar Testes

```bash
npm test        # ou
vitest run     # unit tests
npx playwright test e2e/  # E2E tests
```

---

## Cobertura Atual

| Módulo | Testes | Status |
|--------|-------|--------|
| LGPD | 4 | ✅ |
| Rate Limit | 2 | ✅ |
| Cache | 2 | ✅ |
| E2E | 3 | ✅ |
| **TOTAL** | **11** | ✅ |