import { cacheGet, cacheSet, fileCacheGet, fileCacheSet, saveUpdateRequest, getUpdateRequest, listUpdateRequests, getPendingUpdates, UpdateRequest } from '@/lib/cache'

const ESCAVADOR_BASE_URL = 'https://api.escavador.com/api/v2'

// ─── Staleness Thresholds (Economic Inviability) ───────────────────────────────
// Configurável via env vars

function getStalenessThresholds() {
  return {
    // Processos com staleness acima deste valor não são atualizados automaticamente
    updateThresholdDays: Number(process.env.STALENESS_UPDATE_THRESHOLD) || 365,
    // Processos acima deste valor são marcados como Economic Inviability (não atualizar)
    eiThresholdDays: Number(process.env.STALENESS_EI_THRESHOLD) || 730,
  }
}

export function isEconomicInviability(daysSinceLastCheck: number | null): boolean {
  if (daysSinceLastCheck === null) return false
  const { eiThresholdDays } = getStalenessThresholds()
  return daysSinceLastCheck > eiThresholdDays
}

export function shouldRequestUpdate(daysSinceLastCheck: number | null): boolean {
  if (daysSinceLastCheck === null) return false
  const { updateThresholdDays, eiThresholdDays } = getStalenessThresholds()
  // Atualizar apenas se acima do threshold mas abaixo do EI
  return daysSinceLastCheck > updateThresholdDays && daysSinceLastCheck <= eiThresholdDays
}

// ─── Cache mode ──────────────────────────────────────────────────────────────
// ESCAVADOR_CACHE_MODE:
//   none   → sem cache (default, recomendado para CI)
//   memory → MemoryCache in-process (evita chamadas duplicadas dentro de um run)
//   file   → persiste em .cache/escavador/ entre re-runs (dev local)
//
// Configure em .env.local:
//   ESCAVADOR_CACHE_MODE=file
//   ESCAVADOR_CACHE_TTL_MS=3600000   # opcional, default 1h (só afeta modo memory)

type CacheMode = 'none' | 'memory' | 'file'

function getCacheMode(): CacheMode {
  const mode = process.env.ESCAVADOR_CACHE_MODE ?? 'none'
  if (mode === 'memory' || mode === 'file') return mode
  return 'none'
}

// Internal types (what our API exposes)
export interface LawyerSummary {
  nome: string
  tipo: string
  quantidade_processos: number
}

export interface ProcessItem {
  numero: string
  subject: string
  fonte_sigla: string
  grau: string
  daysSinceLastCheck: number
  status: string
}

export interface ProcessesResponse {
  items: ProcessItem[]
  quantidade_processos: number
}

export interface MovimentacaoItem {
  data: string
  tipo: string
  conteudo: string
  fonte: { sigla: string }
}

export interface MovimentacoesResponse {
  items: MovimentacaoItem[]
}

export interface StatusAtualizacao {
  data_ultima_verificacao: string
  ultima_verificacao?: {
    status: string
    solicitado_em: string
    concluido_em?: string
  }
}

export interface SolicitacaoAtualizacao {
  id: string
  status: string
  numero_processo: string
  solicitado_em: string
}

export interface EnvolvidoItem {
  nome: string
  tipo_pessoa: string
  polo: string
  cpf_cnpj?: string
}

export interface EnvolvidosResponse {
  items: EnvolvidoItem[]
}

export interface DocumentoPublicoItem {
  id: string
  tipo: string
  data: string
  descricao?: string
  url?: string
}

export interface DocumentosPublicosResponse {
  items: DocumentoPublicoItem[]
}

// Raw Escavador API response types
interface RawLawyerSummary {
  nome: string
  tipo: string
  quantidade_processos: number
}

interface RawProcessFonte {
  sigla: string
  tipo?: string
  grau?: number
  grau_formatado?: string
  status_predito?: string
}

interface RawProcessItem {
  numero_cnj: string
  data_ultima_verificacao?: string
  status?: string
  assunto?: string
  assunto_principal?: { nome: string }
  assunto_principal_normalizado?: { nome: string }
  // A API retorna fontes[] (nunca fonte singular)
  fontes?: RawProcessFonte[]
}

interface RawProcessesResponse {
  items: RawProcessItem[]
  quantidade_processos?: number              // presente no endpoint /resumo, ausente em /processos
  advogado_encontrado?: {
    nome: string
    tipo: string
    quantidade_processos: number
  }
  links?: { next?: string | null }
  paginator?: { per_page: number }
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function transformProcess(raw: RawProcessItem): ProcessItem {
  // Prioriza fonte do tipo TRIBUNAL; cai no primeiro disponível se não houver
  const fonte = raw.fontes?.find(f => f.tipo === 'TRIBUNAL') ?? raw.fontes?.[0]
  const grau = fonte?.grau_formatado ?? (fonte?.grau ? `${fonte.grau}º` : '1º')
  const subject = raw.assunto_principal_normalizado?.nome
    ?? raw.assunto_principal?.nome
    ?? raw.assunto
    ?? 'Procedimento Comum'
  const days = daysSince(raw.data_ultima_verificacao)
  // Usa status_predito do Escavador quando disponível — mais preciso que daysSince
  const statusPredito = fonte?.status_predito?.toUpperCase()
  const status = raw.status?.toUpperCase() ?? statusPredito ?? (days <= 30 ? 'ATIVO' : 'INATIVO')

  return {
    numero: raw.numero_cnj,
    subject,
    fonte_sigla: fonte?.sigla ?? '',
    grau,
    daysSinceLastCheck: days,
    status,
  }
}

export class EscavadorClient {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
    method = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${ESCAVADOR_BASE_URL}${endpoint}`)
    if (method === 'GET' && params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    // ── Cache lookup (apenas GET) ─────────────────────────────────────────
    const mode = getCacheMode()
    const cacheKey = `esc:GET:${endpoint}:${JSON.stringify(params ?? {})}`

    if (method === 'GET' && mode !== 'none') {
      const hit = mode === 'file'
        ? fileCacheGet<T>(cacheKey)
        : cacheGet<T>(cacheKey)
      if (hit !== null) return hit
    }

    // ── Fetch real ────────────────────────────────────────────────────────
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Requested-With': 'XMLHttpRequest',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok) {
      throw new Error(`Escavador API error: ${response.status}`)
    }

    const result: T = await response.json()

    // ── Cache store ───────────────────────────────────────────────────────
    if (method === 'GET' && mode !== 'none') {
      if (mode === 'file') {
        fileCacheSet(cacheKey, result)
      } else {
        const ttl = Number(process.env.ESCAVADOR_CACHE_TTL_MS) || 3_600_000
        cacheSet(cacheKey, result, ttl)
      }
    }

    return result
  }

  async getLawyerSummary(
    oab_estado: string,
    oab_numero: string,
    oab_tipo?: string
  ): Promise<LawyerSummary> {
    return this.request<RawLawyerSummary>('/advogado/resumo', {
      oab_estado,
      oab_numero,
      ...(oab_tipo ? { oab_tipo } : {}),
    })
  }

  async getProcesses(
    oab_estado: string,
    oab_numero: string,
    options?: { limit?: number; status?: string; data_minima?: string; data_maxima?: string }
  ): Promise<ProcessesResponse> {
    // Busca todas as páginas via cursor — fiel ao mapeamento de requisições por SKU.
    // O param `limit` controla o tamanho de cada página (max 100), não o total.
    // A paginação continua até `links.next` ser null/ausente.
    const pageSize = Math.min(options?.limit ?? 100, 100)
    const params: Record<string, string> = {
      oab_estado,
      oab_numero,
      limit: String(pageSize),
    }
    if (options?.status) params.status = options.status
    if (options?.data_minima) params.data_minima = options.data_minima
    if (options?.data_maxima) params.data_maxima = options.data_maxima

    const allItems: ProcessItem[] = []
    let quantidade_processos = 0
    let nextUrl: string | null | undefined = undefined // undefined = primeira chamada

    while (true) {
      let raw: RawProcessesResponse

      if (nextUrl === undefined) {
        // Primeira página — usa o método request normal (com cache por params)
        raw = await this.request<RawProcessesResponse>('/advogado/processos', params)
      } else {
        // Páginas seguintes — URL completa com cursor (inclui o próprio host)
        // O cache usa a URL completa como key
        const cursorKey = `esc:GET:cursor:${nextUrl}`
        const mode = getCacheMode()
        const cached = mode === 'file'
          ? fileCacheGet<RawProcessesResponse>(cursorKey)
          : mode === 'memory' ? cacheGet<RawProcessesResponse>(cursorKey) : null

        if (cached) {
          raw = cached
        } else {
          const res = await fetch(nextUrl, {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'X-Requested-With': 'XMLHttpRequest',
            },
          })
          if (!res.ok) throw new Error(`Escavador API error: ${res.status}`)
          raw = await res.json()
          if (mode === 'file') fileCacheSet(cursorKey, raw)
          else if (mode === 'memory') {
            const ttl = Number(process.env.ESCAVADOR_CACHE_TTL_MS) || 3_600_000
            cacheSet(cursorKey, raw, ttl)
          }
        }
      }

      allItems.push(...(raw.items ?? []).map(transformProcess))

      // Total real vem de advogado_encontrado (apenas na primeira página)
      if (raw.advogado_encontrado?.quantidade_processos) {
        quantidade_processos = raw.advogado_encontrado.quantidade_processos
      }

      // Continua se houver próxima página
      const next = raw.links?.next
      if (!next) break
      nextUrl = next
    }

    return { items: allItems, quantidade_processos }
  }

  async getCaseCNJ(numero_cnj: string): Promise<unknown> {
    return this.request<unknown>(`/processos/numero_cnj/${encodeURIComponent(numero_cnj)}`)
  }

  async getMovimentacoes(numero_cnj: string, limit = 100): Promise<MovimentacoesResponse> {
    return this.request<MovimentacoesResponse>(
      `/processos/numero_cnj/${encodeURIComponent(numero_cnj)}/movimentacoes`,
      { limit: String(limit) }
    )
  }

  async getStatusAtualizacao(numero_cnj: string): Promise<StatusAtualizacao> {
    return this.request<StatusAtualizacao>(
      `/processos/numero_cnj/${encodeURIComponent(numero_cnj)}/status-atualizacao`
    )
  }

  async getEnvolvidos(numero_cnj: string, limit = 50): Promise<EnvolvidosResponse> {
    return this.request<EnvolvidosResponse>(
      `/processos/numero_cnj/${encodeURIComponent(numero_cnj)}/envolvidos`,
      { limit: String(limit) }
    )
  }

  async getDocumentosPublicos(numero_cnj: string, limit = 50): Promise<DocumentosPublicosResponse> {
    return this.request<DocumentosPublicosResponse>(
      `/processos/numero_cnj/${encodeURIComponent(numero_cnj)}/documentos-publicos`,
      { limit: String(limit) }
    )
  }

  async requestUpdate(
    numero_cnj: string,
    options?: { documentos_publicos?: boolean; autos?: boolean; enviar_callback?: boolean }
  ): Promise<SolicitacaoAtualizacao> {
    return this.request<SolicitacaoAtualizacao>(
      `/processos/numero_cnj/${encodeURIComponent(numero_cnj)}/solicitar-atualizacao`,
      undefined,
      'POST',
      options ?? {}
    )
  }
}

export function createEscavadorClient(token: string) {
  return new EscavadorClient(token)
}
