interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private defaultTTL: number = 300000

  set(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiresAt })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

export const apiCache = new MemoryCache<unknown>()

setInterval(() => apiCache.cleanup(), 60000)

export function cacheGet<T>(key: string): T | null {
  return apiCache.get(key) as T | null
}

export function cacheSet<T>(key: string, data: T, ttl?: number): void {
  apiCache.set(key, data, ttl)
}