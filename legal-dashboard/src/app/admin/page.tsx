'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UpdatesDashboard } from '@/components/admin/UpdatesDashboard'

interface AdminOrder {
  id: string
  status: string
  customer_email: string | null
  target_oab_estado: string | null
  target_oab_numero: string | null
  target_numero_cnj: string | null
  assigned_operator_id: string | null
  total_cents: number
  sku_name: string | null
  created_at: string
  updated_at: string
  queue_status: string | null
  attempt_count: number
  last_error: { error?: string; code?: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const QUEUE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  processing: 'bg-blue-50 text-blue-600',
  done: 'bg-green-50 text-green-600',
  dead: 'bg-red-50 text-red-600',
}

function StatusBadge({ value, map }: { value: string | null; map: Record<string, string> }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>
  const cls = map[value] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {value}
    </span>
  )
}

async function fetchOrders(): Promise<{ orders: AdminOrder[] }> {
  const res = await fetch('/api/admin/orders')
  if (!res.ok) throw new Error('Falha ao buscar pedidos')
  return res.json()
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user)
    })
  }, [])

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
    enabled: authed === true,
    refetchInterval: (query) =>
      query.state.data?.orders.some(o => o.status === 'processing') ? 10_000 : false,
  })

  if (authed === null || (authed && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Acesso restrito ao operador.</p>
          <Link href="/login" className="text-blue-600 hover:underline">Fazer login</Link>
        </div>
      </div>
    )
  }

  const orders = data?.orders ?? []
  const processing = orders.filter(o => o.status === 'processing').length
  const failed = orders.filter(o => o.status === 'failed' || o.queue_status === 'dead').length
  const delivered = orders.filter(o => o.status === 'delivered').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Ops Dashboard</h1>
          </div>
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-gray-400">
              Atualizado: {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
              {processing > 0 && <span className="ml-2 text-indigo-500">(polling 10s)</span>}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Updates Dashboard */}
        <UpdatesDashboard />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total de pedidos</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Processando</p>
            <p className="text-2xl font-bold text-indigo-600">{processing}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Entregues</p>
            <p className="text-2xl font-bold text-green-600">{delivered}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Falhos / Dead</p>
            <p className="text-2xl font-bold text-red-600">{failed}</p>
          </div>
        </div>

        {/* Tabela de pedidos */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Pedidos</h2>
            {error && (
              <span className="text-xs text-red-500">Erro ao carregar: {(error as Error).message}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">OAB</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tentativas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">
                        {order.sku_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                        {order.customer_email ?? <span className="text-gray-400 italic">anônimo</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {order.target_oab_estado && order.target_oab_numero
                          ? `${order.target_oab_estado} ${order.target_oab_numero}`
                          : order.target_numero_cnj
                            ? <span className="font-mono text-xs">{order.target_numero_cnj.slice(0, 16)}…</span>
                            : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={order.status} map={STATUS_COLORS} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={order.queue_status} map={QUEUE_COLORS} />
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {order.attempt_count > 0
                          ? <span className={order.attempt_count >= 2 ? 'text-red-500 font-medium' : ''}>
                              {order.attempt_count}
                            </span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {order.assigned_operator_id
                          ? <span className="text-gray-600">{order.assigned_operator_id.slice(-6)}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 hover:underline text-xs whitespace-nowrap"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
