'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthButton } from '@/components/AuthButton'

const OAB_ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface HealthMetrics {
  total: number
  stalePercent: number
  activeCount: number
  inactiveCount: number
  sampleProcessed: number
}

interface ProcessData {
  numero: string
  subject?: string
  fonte_sigla?: string
  status: string
  data_ultima_verificacao?: string
  daysSinceLastCheck: number
}

interface ProcessesResponse {
  metrics: HealthMetrics
  processes: ProcessData[]
}

function HealthMetricCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
    </div>
  )
}

function HealthPanel({ estado, numero }: { estado: string; numero: string }) {
  const { data, isLoading, error } = useQuery<ProcessesResponse>({
    queryKey: ['processes', estado, numero],
    queryFn: async () => {
      const params = new URLSearchParams({ oab_estado: estado, oab_numero: numero })
      const res = await fetch(`/api/processes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!estado && !!numero,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data?.metrics) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Erro ao carregar dados. Verifique a OAB.
      </div>
    )
  }

  const { metrics } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthMetricCard title="Total de Processos" value={metrics.total} subtitle="na carteira" color="text-blue-600" />
        <HealthMetricCard title="Desatualizados" value={`${metrics.stalePercent}%`} subtitle="> 30 dias" color={metrics.stalePercent > 50 ? 'text-red-600' : 'text-yellow-600'} />
        <HealthMetricCard title="Ativos" value={metrics.activeCount} color="text-green-600" />
        <HealthMetricCard title="Inativos" value={metrics.inactiveCount} color="text-gray-600" />
      </div>
      <p className="text-sm text-gray-400 text-right">*Baseado em {metrics.sampleProcessed} processos</p>
      <CaseTable processes={data.processes || []} />
    </div>
  )
}

function CaseDetailDrawer({ numero, onClose }: { numero: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ capa?: any; movimentacoes?: { items: any[] }; status?: any }>({
    queryKey: ['case-detail', numero],
    queryFn: async () => {
      const res = await fetch(`/api/case-detail/${encodeURIComponent(numero)}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: !!numero,
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Detalhes do Processo</h3>
            <p className="text-sm text-gray-500 font-mono">{numero}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-6">
          {data?.status && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Status</h4>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full ${
                  data.status.ultima_verificacao?.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.status.ultima_verificacao?.status || 'DESCONHECIDO'}
                </span>
                <span className="text-sm text-gray-500">
                  Última verificação: {data.status.data_ultima_verificacao ? new Date(data.status.data_ultima_verificacao).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>
          )}
          {(data?.movimentacoes?.items?.length ?? 0) > 0 && (
            <div>
              <h4 className="font-medium mb-3">Movimentações</h4>
              <div className="space-y-3 max-h-64 overflow-auto">
                {data?.movimentacoes?.items?.slice(0, 10).map((mov: any, i: number) => (
                  <div key={i} className="border-l-2 border-blue-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">{mov.data}</p>
                    <p className="text-sm font-medium">{mov.tipo}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{mov.conteudo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CaseTable({ processes }: { processes: ProcessData[] }) {
  const [filterTribunal, setFilterTribunal] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedCase, setSelectedCase] = useState('')

  const filtered = processes.filter(p => {
    if (filterTribunal && p.fonte_sigla !== filterTribunal) return false
    if (filterStatus && p.status !== filterStatus) return false
    return true
  })

  const tribunais = [...new Set(processes.map(p => p.fonte_sigla).filter(Boolean))] as string[]

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
        <select value={filterTribunal} onChange={(e) => setFilterTribunal(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todos os tribunais</option>
          {tribunais.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNJ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tribunal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Verificação</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.slice(0, 20).map((process) => (
              <tr key={process.numero} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{process.numero}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{process.fonte_sigla || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    process.status === 'ATIVO' ? 'bg-green-100 text-green-800' :
                    process.status === 'INATIVO' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {process.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {process.daysSinceLastCheck < 999 ? `${process.daysSinceLastCheck} dias atrás` : '-'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedCase(process.numero)} className="text-blue-600 hover:text-blue-700 text-sm">Ver detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
        Mostrando {Math.min(filtered.length, 20)} de {filtered.length} processos
      </div>
      {selectedCase && <CaseDetailDrawer numero={selectedCase} onClose={() => setSelectedCase('')} />}
    </div>
  )
}

export default function Home() {
  const [estado, setEstado] = useState('')
  const [numero, setNumero] = useState('')
  const [hasSearch, setHasSearch] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (estado && numero) {
      setHasSearch(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Legal Dashboard</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!hasSearch ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecione sua OAB</h2>
            <p className="text-gray-600 mb-6">Digite seus dados para visualizar sua carteira de processos</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
                  <option value="">Selecione o estado</option>
                  {OAB_ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número OAB</label>
                <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123456" className="w-full px-3 py-2 border rounded-md" required />
              </div>
              <button 
                type="submit"
                disabled={!estado || !numero} 
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Visualizar Carteira
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setHasSearch(false)} className="text-blue-600 hover:text-blue-700">← Nova busca</button>
              <p className="text-gray-600">OAB {estado} - {numero}</p>
            </div>
            <HealthPanel estado={estado} numero={numero} />
          </div>
        )}
      </main>
    </div>
  )
}