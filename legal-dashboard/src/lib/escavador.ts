const ESCAVADOR_BASE_URL = 'https://api.escavador.com/api/v2'

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

  async getLawyerSummary(oab_estado: string, oab_numero: string, oab_tipo?: string) {
    return this.request<{ nome: string; tipo: string; quantidade_processos: number }>(
      '/advogado/resumo',
      { oab_estado, oab_numero, ...(oab_tipo ? { oab_tipo } : {}) }
    )
  }

  async getProcesses(
    oab_estado: string,
    oab_numero: string,
    options?: { limit?: number; status?: string; data_minima?: string; data_maxima?: string }
  ) {
    const params: Record<string, string> = { oab_estado, oab_numero }
    if (options?.limit) params.limit = String(options.limit)
    if (options?.status) params.status = options.status

    return this.request<{ items: any[]; quantidade_processos: number }>(
      '/advogado/processos',
      params
    )
  }

  async getCaseCNJ(numero_cnj: string) {
    return this.request<any>(`/processos/numero_cnj/${numero_cnj}`)
  }

  async getMovimentacoes(numero_cnj: string, limit = 100) {
    return this.request<{ items: any[] }>(`/processos/numero_cnj/${numero_cnj}/movimentacoes`, {
      limit: String(limit),
    })
  }

  async getStatusAtualizacao(numero_cnj: string) {
    return this.request<any>(`/processos/numero_cnj/${numero_cnj}/status-atualizacao`)
  }
}

export function createEscavadorClient(token: string) {
  return new EscavadorClient(token)
}