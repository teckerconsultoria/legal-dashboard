import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { cacheGet, cacheSet, apiCache, fileCacheGet, fileCacheSet, fileCacheClear, fileCacheDeleteWhere } from '../src/lib/cache'

describe('MemoryCache', () => {
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

// ─── FileCache ───────────────────────────────────────────────────────────────

const TEST_CACHE_DIR = join(process.cwd(), '.cache', 'escavador-test')

describe('FileCache', () => {
  beforeEach(() => {
    // Usa diretório isolado para testes
    process.env.ESCAVADOR_CACHE_DIR = TEST_CACHE_DIR
    mkdirSync(TEST_CACHE_DIR, { recursive: true })
  })

  afterEach(() => {
    // Limpa diretório de teste
    if (existsSync(TEST_CACHE_DIR)) {
      rmSync(TEST_CACHE_DIR, { recursive: true, force: true })
    }
    delete process.env.ESCAVADOR_CACHE_DIR
  })

  it('should return null for cache miss', () => {
    expect(fileCacheGet('esc:GET:/advogado/resumo:{}')).toBe(null)
  })

  it('should store and retrieve data with _meta envelope', () => {
    const key = 'esc:GET:/advogado/resumo:{"oab_estado":"PB","oab_numero":"24398"}'
    const data = { nome: 'Renato Lacerda', quantidade_processos: 42 }

    fileCacheSet(key, data)
    const retrieved = fileCacheGet<typeof data>(key)

    expect(retrieved).toEqual(data)
  })

  it('should persist across calls (simulating re-run)', () => {
    const key = 'esc:GET:/advogado/processos:{"oab_estado":"PB","oab_numero":"13477"}'
    const data = { items: [{ numero: '1234567-89.2020.8.15.0001' }], quantidade_processos: 1 }

    fileCacheSet(key, data)
    // Segunda leitura simula novo ciclo
    const hit = fileCacheGet<typeof data>(key)
    expect(hit).not.toBeNull()
    expect(hit!.quantidade_processos).toBe(1)
  })

  it('fileCacheClear should remove all entries and return count', () => {
    fileCacheSet('key-a', { a: 1 })
    fileCacheSet('key-b', { b: 2 })

    const removed = fileCacheClear()
    expect(removed).toBe(2)
    expect(fileCacheGet('key-a')).toBe(null)
  })

  it('fileCacheDeleteWhere should remove matching entries only', () => {
    fileCacheSet('esc:GET:/advogado/resumo:{"oab_numero":"24398"}', { nome: 'Renato' })
    fileCacheSet('esc:GET:/advogado/resumo:{"oab_numero":"13477"}', { nome: 'Victor' })

    const removed = fileCacheDeleteWhere('24398')
    expect(removed).toBe(1)
    // Entrada de Victor intacta
    expect(fileCacheGet('esc:GET:/advogado/resumo:{"oab_numero":"13477"}')).not.toBeNull()
  })
})