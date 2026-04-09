'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface UpdateRequest {
  request_id: string
  numero_cnj: string
  status: 'pending' | 'completed' | 'failed'
  solicitado_em: string
  concluido_em?: string
  error?: string
}

interface UpdatesStats {
  total: number
  pending: number
  completed: number
  failed: number
  recent: UpdateRequest[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  const labels: Record<string, string> = {
    pending: '⏳ Pendente',
    completed: '✅ Concluído',
    failed: '❌ Falhou',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchUpdates(): Promise<UpdatesStats> {
  const res = await fetch('/api/admin/updates')
  if (!res.ok) throw new Error('Falha ao buscar atualizações')
  return res.json()
}

async function requestManualUpdate(cnj: string, force: boolean = false) {
  const res = await fetch(`/api/request-update/${encodeURIComponent(cnj)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force, daysSinceLastCheck: 400 }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao solicitar update')
  }
  return res.json()
}

export function UpdatesDashboard() {
  const queryClient = useQueryClient()
  const [manualCnj, setManualCnj] = useState('')
  const [manualError, setManualError] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['updates-stats'],
    queryFn: fetchUpdates,
    refetchInterval: 30_000, // Poll a cada 30s
  })

  const mutation = useMutation({
    mutationFn: () => requestManualUpdate(manualCnj, true),
    onSuccess: () => {
      setManualCnj('')
      setManualError('')
      queryClient.invalidateQueries({ queryKey: ['updates-stats'] })
    },
    onError: (err: Error) => setManualError(err.message),
  })

  const stats = data ?? { total: 0, pending: 0, completed: 0, failed: 0, recent: [] }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">📥 Solicitações de Atualização</h2>
        <button
          onClick={() => refetch()}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-200">
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Concluídos</p>
          <p className="text-lg font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Falhos</p>
          <p className="text-lg font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Manual trigger */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Número CNJ (ex: 0001234-56.2023.4.05.0000)"
          value={manualCnj}
          onChange={e => setManualCnj(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!manualCnj || manualLoading}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {manualLoading ? 'Enviando...' : 'Solicitar Update'}
        </button>
        {manualError && <span className="text-xs text-red-500">{manualError}</span>}
      </div>

      {/* Recent list */}
      {isLoading ? (
        <div className="px-4 py-8 text-center text-gray-400">Carregando...</div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-red-500">{(error as Error).message}</div>
      ) : stats.recent.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400">Nenhuma solicitação ainda.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Request ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Processo CNJ</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Solicitado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Concluído</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recent.map(update => (
                <tr key={update.request_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {update.request_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {update.numero_cnj.slice(0, 20)}…
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={update.status} />
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {formatDate(update.solicitado_em)}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {formatDate(update.concluido_em)}
                  </td>
                  <td className="px-4 py-2 text-red-500 text-xs max-w-[200px] truncate">
                    {update.error ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function UpdateStatusBadge({ daysSinceLastCheck }: { daysSinceLastCheck: number | null }) {
  if (daysSinceLastCheck === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        ❓ Sem dados
      </span>
    )
  }

  if (daysSinceLastCheck <= 90) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        ✅ Atualizado ({daysSinceLastCheck}d)
      </span>
    )
  }

  if (daysSinceLastCheck <= 365) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        ⚠️ Stale ({daysSinceLastCheck}d)
      </span>
    )
  }

  if (daysSinceLastCheck <= 730) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
        🔄 Precisa Update ({daysSinceLastCheck}d)
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      ⛔ EI ({daysSinceLastCheck}d)
    </span>
  )
}