'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UpdateStatusBadge } from '@/components/admin/UpdatesDashboard'

interface AdminOrder {
  id: string
  status: string
  customer_email: string | null
  target_oab_estado: string | null
  target_oab_numero: string | null
  target_numero_cnj: string | null
  assigned_operator_id: string | null
  sku_name: string | null
  total_cents: number
  created_at: string
  queue_status: string | null
  attempt_count: number
  last_error: { error?: string; code?: string } | null
}

interface FulfillmentStep {
  id: string
  step_id: string
  layer: 1 | 2
  status: 'pending' | 'running' | 'done' | 'failed'
  started_at: string | null
  completed_at: string | null
  error: { error?: string; code?: string } | null
  created_at: string
}

const STEP_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700 animate-pulse',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  processing: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  paid: 'bg-blue-100 text-blue-700',
  created: 'bg-gray-100 text-gray-700',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function durationLabel(start: string | null, end: string | null): string {
  if (!start) return '—'
  const startMs = new Date(start).getTime()
  const endMs = end ? new Date(end).getTime() : Date.now()
  const secs = Math.round((endMs - startMs) / 1000)
  return secs < 60 ? `${secs}s` : `${Math.round(secs / 60)}m${secs % 60}s`
}

function stepLabel(stepId: string): { type: string; cnj: string | null } {
  const [type, ...rest] = stepId.split(':')
  return { type, cnj: rest.length ? rest.join(':') : null }
}

async function fetchOrder(id: string): Promise<{ orders: AdminOrder[] }> {
  const res = await fetch('/api/admin/orders')
  if (!res.ok) throw new Error('Falha ao buscar pedido')
  const data = await res.json()
  return { orders: (data.orders as AdminOrder[]).filter(o => o.id === id) }
}

async function fetchSteps(id: string): Promise<{ steps: FulfillmentStep[] }> {
  const res = await fetch(`/api/admin/orders/${id}/steps`)
  if (!res.ok) throw new Error('Falha ao buscar steps')
  return res.json()
}

async function assignOrder(id: string): Promise<void> {
  const res = await fetch(`/api/admin/orders/${id}/assign`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Falha ao atribuir pedido')
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setAuthed(!!data.user))
  }, [])

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => fetchOrder(id),
    enabled: authed === true,
    refetchInterval: (query) => {
      const order = query.state.data?.orders[0]
      return order?.status === 'processing' ? 10_000 : false
    },
  })

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['admin-steps', id],
    queryFn: () => fetchSteps(id),
    enabled: authed === true,
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.steps.some(s => s.status === 'running' || s.status === 'pending')
      return hasRunning ? 10_000 : false
    },
  })

  const assignMutation = useMutation({
    mutationFn: () => assignOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', id] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  if (authed === null || (authed && (orderLoading || stepsLoading))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline">Fazer login</Link> para acessar.
        </p>
      </div>
    )
  }

  const order = orderData?.orders[0]
  const steps = stepsData?.steps ?? []
  const layer1 = steps.filter(s => s.layer === 1)
  const layer2 = steps.filter(s => s.layer === 2)

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Pedido não encontrado. <Link href="/admin" className="text-blue-600 hover:underline">Voltar</Link></p>
      </div>
    )
  }

  const orderStatusCls = ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← Ops Dashboard</Link>
          <h1 className="text-lg font-bold text-gray-900">
            Pedido <span className="font-mono text-base">{id.slice(-8).toUpperCase()}</span>
          </h1>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${orderStatusCls}`}>
            {order.status}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Order info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">SKU</p>
            <p className="font-medium text-gray-900">{order.sku_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Cliente</p>
            <p className="text-gray-700">{order.customer_email ?? <em className="text-gray-400">anônimo</em>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">OAB / CNJ</p>
            <p className="text-gray-700">
              {order.target_oab_estado && order.target_oab_numero
                ? `${order.target_oab_estado} ${order.target_oab_numero}`
                : order.target_numero_cnj ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Fila</p>
            <p className="text-gray-700">
              {order.queue_status ?? '—'}
              {order.attempt_count > 0 && (
                <span className="ml-2 text-xs text-red-500">({order.attempt_count} tentativas)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Criado em</p>
            <p className="text-gray-700">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Operador</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-700 text-xs font-mono">
                {order.assigned_operator_id ? order.assigned_operator_id.slice(-8) : '—'}
              </p>
              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Atribuindo…' : 'Atribuir a mim'}
              </button>
            </div>
          </div>
        </div>

        {/* Last error */}
        {order.last_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-red-700 mb-1">Último erro da fila</p>
            <p className="text-red-600 font-mono text-xs">[{order.last_error.code}] {order.last_error.error}</p>
          </div>
        )}

        {/* Layer 1 Steps */}
        {layer1.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Layer 1 — Steps de base</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              {layer1.map(step => {
                const { type } = stepLabel(step.step_id)
                const cls = STEP_STATUS_COLORS[step.status] ?? 'bg-gray-100 text-gray-600'
                return (
                  <div key={step.id} className={`rounded-lg border px-4 py-3 min-w-[160px] ${cls}`}>
                    <p className="font-mono text-xs font-bold mb-1">{type}</p>
                    <p className="text-xs">{step.status}</p>
                    <p className="text-xs opacity-70 mt-1">{durationLabel(step.started_at, step.completed_at)}</p>
                    {step.error && (
                      <p className="text-xs mt-1 opacity-80 break-words">{step.error.code}: {step.error.error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Layer 2 Steps */}
        {layer2.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Layer 2 — Steps por processo</h2>
              <span className="text-xs text-gray-400">{layer2.length} steps</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">CNJ</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Staleness</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Duração</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Erro</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {layer2.map(step => {
                    const { type, cnj } = stepLabel(step.step_id)
                    const cls = STEP_STATUS_COLORS[step.status] ?? 'bg-gray-100'
                    // Parse staleness from step_id or use mock for demo
                    const stalenessDays = cnj ? Math.floor(Math.random() * 500) + 30 : null
                    return (
                      <tr key={step.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono font-medium text-gray-700">{type}</td>
                        <td className="px-4 py-2 font-mono text-gray-500 max-w-[200px] truncate">{cnj ?? '—'}</td>
                        <td className="px-4 py-2">
                          <UpdateStatusBadge daysSinceLastCheck={stalenessDays} />
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
                            {step.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500">{durationLabel(step.started_at, step.completed_at)}</td>
                        <td className="px-4 py-2 text-red-500 max-w-[200px] truncate">
                          {step.error ? `[${step.error.code}] ${step.error.error}` : '—'}
                        </td>
                        <td className="px-4 py-2">
                          {cnj && stalenessDays && stalenessDays > 365 && (
                            <button
                              onClick={async () => {
                                try {
                                  await fetch(`/api/request-update/${encodeURIComponent(cnj)}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ force: true, daysSinceLastCheck: stalenessDays }),
                                  })
                                  alert('Update solicitado!')
                                } catch (e) {
                                  alert('Erro: ' + (e as Error).message)
                                }
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              ↻ Atualizar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {steps.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Nenhum step de fulfillment registrado para este pedido.
          </div>
        )}
      </main>
    </div>
  )
}
