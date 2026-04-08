const ESCAVADOR_BASE_URL = 'https://api.escavador.com/api/v2'

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

export class EscavadorClient {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${ESCAVADOR_BASE_URL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (!response.ok) {
      throw new Error(`Escavador API error: ${response.status}`)
    }

    return response.json()
  }

  async getLawyerSummary(oab_estado: string, oab_numero: string, oab_tipo?: string): Promise<LawyerSummary> {
    return this.request<LawyerSummary>(
      '/advogado/resumo',
      { oab_estado, oab_numero, ...(oab_tipo ? { oab_tipo } : {}) }
    )
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

    return this.request<ProcessesResponse>('/advogado/processos', params)
  }

  async getCaseCNJ(numero_cnj: string): Promise<unknown> {
    return this.request<unknown>(`/processos/numero_cnj/${numero_cnj}`)
  }

  async getMovimentacoes(numero_cnj: string, limit = 100): Promise<MovimentacoesResponse> {
    return this.request<MovimentacoesResponse>(`/processos/numero_cnj/${numero_cnj}/movimentacoes`, {
      limit: String(limit),
    })
  }

  async getStatusAtualizacao(numero_cnj: string): Promise<StatusAtualizacao> {
    return this.request<StatusAtualizacao>(`/processos/numero_cnj/${numero_cnj}/status-atualizacao`)
  }
}

export function createEscavadorClient(token: string) {
  return new EscavadorClient(token)
}