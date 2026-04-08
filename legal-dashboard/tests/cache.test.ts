import { describe, it, expect, beforeEach } from 'vitest'
import { cacheGet, cacheSet, apiCache } from '../src/lib/cache'

describe('Server Caching', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  it('should store and retrieve data', () => {
    cacheSet('test-key', { value: 'test-data' })
    expect(cacheGet('test-key')).toEqual({ value: 'test-data' })
  })

  it('should return null for expired cache', () => {
    cacheSet('test-key', { value: 'test-data' }, 1)
    return new Promise(resolve => setTimeout(resolve, 10)).then(() => {
      expect(cacheGet('test-key')).toBe(null)
    })
  })

  it('should return null for non-existent key', () => {
    expect(cacheGet('non-existent')).toBe(null)
  })
})