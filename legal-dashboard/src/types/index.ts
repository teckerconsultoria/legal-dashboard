export interface OAB {
  estado: string
  numero: string
  tipo?: 'ADVOGADO' | 'ADVOGADA'
}

export interface LawyerSummary {
  nome: string
  tipo: string
  quantidade_processos: number
  oab_estado: string
}

export interface Process {
  numero: string
  subject?: string
  fonte_sigla?: string
  status?: string
  data_ultima_verificacao?: string
}

export interface CaseDetail {
  capa?: any
  movimentacoes?: { items: any[] }
  status?: any
}

export interface HealthMetrics {
  total: number
  stalePercent: number
  activeCount: number
  inactiveCount: number
  sampleProcessed: number
}