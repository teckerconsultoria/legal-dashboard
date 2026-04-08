const ESCAVADOR_BASE_URL = 'https://api.escavador.com/api/v2'

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

interface RawProcessItem {
  numero_cnj: string
  data_ultima_verificacao?: string
  status?: string
  assunto?: string
  assunto_principal?: { nome: string }
  fonte?: { sigla: string; grau?: string; grau_formatado?: string }
  fontes?: Array<{ sigla: string; grau?: string; grau_formatado?: string }>
}

interface RawProcessesResponse {
  items: RawProcessItem[]
  quantidade_processos: number
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function transformProcess(raw: RawProcessItem): ProcessItem {
  const fonte = raw.fonte ?? raw.fontes?.[0]
  const grau = fonte?.grau_formatado ?? (fonte?.grau ? `${fonte.grau}º` : '1º')
  const subject = raw.assunto_principal?.nome ?? raw.assunto ?? 'Procedimento Comum'
  const days = daysSince(raw.data_ultima_verificacao)
  const status = raw.status?.toUpperCase() ?? (days <= 30 ? 'ATIVO' : 'INATIVO')

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

    return response.json()
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
    const params: Record<string, string> = { oab_estado, oab_numero }
    if (options?.limit) params.limit = String(options.limit)
    if (options?.status) params.status = options.status
    if (options?.data_minima) params.data_minima = options.data_minima
    if (options?.data_maxima) params.data_maxima = options.data_maxima

    const raw = await this.request<RawProcessesResponse>('/advogado/processos', params)
    return {
      items: raw.items.map(transformProcess),
      quantidade_processos: raw.quantidade_processos,
    }
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
