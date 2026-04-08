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
  daysSinceLastCheck?: number
}

export interface CaseCapa {
  numero: string
  subject: string
  classe: string
  vara: string
  natureza: string
  valor_causa: string
  polo_ativo: string
  polo_passivo: string
}

export interface Movimentacao {
  data: string
  tipo: string
  conteudo: string
}

export interface Movimentacoes {
  items: Movimentacao[]
}

export interface ProcessStatus {
  data_ultima_verificacao: string
  ultima_verificacao?: {
    status: 'PENDENTE' | 'SUCESSO' | 'ERRO' | 'NAO_ENCONTRADO'
    solicitado_em: string
    concluido_em?: string
  }
}

export interface CaseDetail {
  capa?: CaseCapa
  movimentacoes?: Movimentacoes
  status?: ProcessStatus
}

export interface HealthMetrics {
  total: number
  stalePercent: number
  activeCount: number
  inactiveCount: number
  sampleProcessed: number
}

export interface ProcessData {
  numero: string
  subject?: string
  fonte_sigla?: string
  grau?: string
  status?: string
  daysSinceLastCheck?: number
}

export interface ProcessesResponse {
  metrics: HealthMetrics
  processes: ProcessData[]
  histogram?: Array<{ range: string; count: number }>
  distributionByTribunal?: Array<{ tribunal: string; count: number; percent: number }>
  hotCold?: { quente: number; morno: number; frio: number }
}