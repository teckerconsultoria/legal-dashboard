import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

// ─── MemoryCache ────────────────────────────────────────────────────────────

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

// ─── FileCache ───────────────────────────────────────────────────────────────
//
// Ativado via ESCAVADOR_CACHE_MODE=file em .env.local.
// Persiste respostas em .cache/escavador/<sha1(key)>.json entre re-runs.
// Inclui metadados (_meta) para rastreabilidade — nunca commitado (.gitignore).

interface FileCacheEnvelope<T> {
  _meta: {
    key: string
    fetched_at: string
  }
  data: T
}

function fileCacheDir(): string {
  // Prefira setar ESCAVADOR_CACHE_DIR como caminho absoluto em .env.local
  // para evitar NFT tracing do Turbopack (ex: /home/user/project/.cache/escavador)
  return process.env.ESCAVADOR_CACHE_DIR ?? join(process.cwd(), '.cache', 'escavador')
}

function fileCacheKey(key: string): string {
  return createHash('sha1').update(key).digest('hex') + '.json'
}

export function fileCacheGet<T>(key: string): T | null {
  // Não executar no browser
  if (typeof window !== 'undefined') return null
  try {
    const file = join(fileCacheDir(), fileCacheKey(key))
    if (!existsSync(file)) return null
    const raw = readFileSync(file, 'utf8')
    const envelope = JSON.parse(raw) as FileCacheEnvelope<T>
    return envelope.data
  } catch {
    return null
  }
}

export function fileCacheSet<T>(key: string, data: T): void {
  // Não executar no browser
  if (typeof window !== 'undefined') return
  try {
    const dir = fileCacheDir()
    mkdirSync(dir, { recursive: true })
    const envelope: FileCacheEnvelope<T> = {
      _meta: {
        key,
        fetched_at: new Date().toISOString(),
      },
      data,
    }
    writeFileSync(join(dir, fileCacheKey(key)), JSON.stringify(envelope, null, 2))
  } catch {
    // Falha silenciosa — cache é best-effort
  }
}

/** Remove entradas cujo key contém a substring fornecida. Usado pelo script de limpeza. */
export function fileCacheDeleteWhere(keySubstring: string): number {
  if (typeof window !== 'undefined') return 0
  try {
    const dir = fileCacheDir()
    if (!existsSync(dir)) return 0
    const files = readdirSync(dir).filter(f => f.endsWith('.json'))
    let count = 0
    for (const file of files) {
      try {
        const raw = readFileSync(join(dir, file), 'utf8')
        const envelope = JSON.parse(raw) as FileCacheEnvelope<unknown>
        if (envelope._meta?.key?.includes(keySubstring)) {
          unlinkSync(join(dir, file))
          count++
        }
      } catch {
        // arquivo corrompido — ignora
      }
    }
    return count
  } catch {
    return 0
  }
}

/** Apaga todos os arquivos de cache. */
export function fileCacheClear(): number {
  if (typeof window !== 'undefined') return 0
  try {
    const dir = fileCacheDir()
    if (!existsSync(dir)) return 0
    const files = readdirSync(dir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      try { unlinkSync(join(dir, file)) } catch { /* ignora */ }
    }
    return files.length
  } catch {
    return 0
  }
}

// ─── Update Request Tracking ───────────────────────────────────────────────────

export interface UpdateRequest {
  request_id: string
  numero_cnj: string
  status: 'pending' | 'completed' | 'failed'
  solicitado_em: string
  concluido_em?: string
  callback_url?: string
  error?: string
}

const UPDATE_REQUEST_PREFIX = 'esc:update-request:'

export function saveUpdateRequest(req: UpdateRequest): void {
  fileCacheSet(UPDATE_REQUEST_PREFIX + req.request_id, req)
}

export function getUpdateRequest(requestId: string): UpdateRequest | null {
  return fileCacheGet<UpdateRequest>(UPDATE_REQUEST_PREFIX + requestId)
}

export function listUpdateRequests(numeroCnj?: string): UpdateRequest[] {
  if (typeof window !== 'undefined') return []
  try {
    const dir = fileCacheDir()
    if (!existsSync(dir)) return []
    const files = readdirSync(dir).filter(f => f.endsWith('.json'))
    const requests: UpdateRequest[] = []
    for (const file of files) {
      if (!file.includes('update-request')) continue
      try {
        const raw = readFileSync(join(dir, file), 'utf8')
        const envelope = JSON.parse(raw) as { data: UpdateRequest }
        if (envelope.data) {
          if (!numeroCnj || envelope.data.numero_cnj === numeroCnj) {
            requests.push(envelope.data)
          }
        }
      } catch { /* ignora */ }
    }
    return requests.sort((a, b) => 
      new Date(b.solicitado_em).getTime() - new Date(a.solicitado_em).getTime()
    )
  } catch {
    return []
  }
}

export function getPendingUpdates(): UpdateRequest[] {
  if (typeof window !== 'undefined') return []
  try {
    const dir = fileCacheDir()
    if (!existsSync(dir)) return []
    const files = readdirSync(dir).filter(f => f.endsWith('.json'))
    const requests: UpdateRequest[] = []
    for (const file of files) {
      if (!file.includes('update-request')) continue
      try {
        const raw = readFileSync(join(dir, file), 'utf8')
        const envelope = JSON.parse(raw) as { data: UpdateRequest }
        if (envelope.data?.status === 'pending') {
          requests.push(envelope.data)
        }
      } catch { /* ignora */ }
    }
    return requests
  } catch {
    return []
  }
}