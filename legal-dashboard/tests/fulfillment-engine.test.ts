import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processBatch } from '@/lib/fulfillment-engine'

// ─── processBatch ───────────────────────────────────────────────────────────

describe('processBatch', () => {
  it('processes all items and returns settled results', async () => {
    const items = [1, 2, 3]
    const fn = vi.fn().mockResolvedValue(undefined)
    const results = await processBatch(items, fn, 5)
    expect(results).toHaveLength(3)
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not throw when fn rejects — returns rejected result', async () => {
    const items = [1, 2, 3]
    const fn = vi.fn().mockImplementation(async (n: number) => {
      if (n === 2) throw new Error('step failed')
    })
    const results = await processBatch(items, fn, 5)
    expect(results).toHaveLength(3)
    expect(results[0].status).toBe('fulfilled')
    expect(results[1].status).toBe('rejected')
    expect(results[2].status).toBe('fulfilled')
  })

  it('processes in batches of batchSize', async () => {
    const callOrder: number[] = []
    const items = [1, 2, 3, 4, 5, 6]
    const fn = vi.fn().mockImplementation(async (n: number) => {
      callOrder.push(n)
    })
    await processBatch(items, fn, 3)
    expect(fn).toHaveBeenCalledTimes(6)
    // First batch [1,2,3] then [4,5,6]
    expect(callOrder.slice(0, 3).sort()).toEqual([1, 2, 3])
    expect(callOrder.slice(3).sort()).toEqual([4, 5, 6])
  })

  it('handles empty items array', async () => {
    const fn = vi.fn()
    const results = await processBatch([], fn, 5)
    expect(results).toHaveLength(0)
    expect(fn).not.toHaveBeenCalled()
  })

  it('processes single item', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const results = await processBatch([42], fn, 5)
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('fulfilled')
    expect(fn).toHaveBeenCalledWith(42, 0, [42])
  })

  it('returns all results even when some fail', async () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const fn = vi.fn().mockImplementation(async (n: number) => {
      if (n % 3 === 0) throw new Error(`fail ${n}`)
    })
    const results = await processBatch(items, fn, 5)
    expect(results).toHaveLength(10)
    const failed = results.filter(r => r.status === 'rejected')
    // items 0, 3, 6, 9 fail
    expect(failed).toHaveLength(4)
  })
})

// ─── enqueueOrder (mocked supabase) ────────────────────────────────────────

describe('enqueueOrder — idempotency', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('does not throw on conflict (23505 = already queued)', async () => {
    vi.doMock('@/utils/supabase/server', () => ({
      createServiceClient: () => ({
        from: () => ({
          insert: vi.fn().mockResolvedValue({
            error: { code: '23505', message: 'duplicate key' },
          }),
        }),
      }),
    }))

    const { enqueueOrder } = await import('@/lib/fulfillment-engine')
    await expect(enqueueOrder('test-order-id')).resolves.toBeUndefined()
  })

  it('throws on non-conflict errors', async () => {
    vi.doMock('@/utils/supabase/server', () => ({
      createServiceClient: () => ({
        from: () => ({
          insert: vi.fn().mockResolvedValue({
            error: { code: '42501', message: 'permission denied' },
          }),
        }),
      }),
    }))

    const { enqueueOrder } = await import('@/lib/fulfillment-engine')
    await expect(enqueueOrder('test-order-id')).rejects.toThrow('enqueueOrder failed')
  })

  it('succeeds on clean insert (no error)', async () => {
    vi.doMock('@/utils/supabase/server', () => ({
      createServiceClient: () => ({
        from: () => ({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }))

    const { enqueueOrder } = await import('@/lib/fulfillment-engine')
    await expect(enqueueOrder('test-order-id')).resolves.toBeUndefined()
  })
})
