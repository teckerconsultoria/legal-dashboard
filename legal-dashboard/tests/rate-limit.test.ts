import { describe, it, expect, beforeEach } from 'vitest'
import { apiRateLimiter } from '../src/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    apiRateLimiter.reset('test-user')
  })

  it('should allow requests within limit', () => {
    expect(apiRateLimiter.check('test-user')).toBe(true)
  })

  it('should block after limit exceeded', () => {
    for (let i = 0; i < 500; i++) {
      apiRateLimiter.check('test-user')
    }
    expect(apiRateLimiter.check('test-user')).toBe(false)
  })
})