interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RequestRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  check(identifier: string): boolean {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return true
    }

    if (record.count >= this.config.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

export const apiRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 500
})

setInterval(() => apiRateLimiter.cleanup(), 60000)