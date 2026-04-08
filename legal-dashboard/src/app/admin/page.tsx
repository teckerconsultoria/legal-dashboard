'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface UserStats {
  id: string
  email: string
  creditsUsed: number
  lastActive: string
}

export default function AdminPage() {
  const [user, setUser] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [rateLimit, setRateLimit] = useState(500)
  const users: UserStats[] = [
    { id: '1', email: 'john@example.com', creditsUsed: 1250, lastActive: '2026-04-08' },
    { id: '2', email: 'maria@example.com', creditsUsed: 890, lastActive: '2026-04-07' },
    { id: '3', email: 'carlos@example.com', creditsUsed: 567, lastActive: '2026-04-06' },
    { id: '4', email: 'ana@example.com', creditsUsed: 432, lastActive: '2026-04-05' },
  ]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as UserStats | null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Acesso restrito. Faça login como administrador.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">Ir para login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">← Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Créditos hoje</p>
            <p className="text-3xl font-bold text-blue-600">1,250</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Créditos mês</p>
            <p className="text-3xl font-bold text-green-600">28,500</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Usuários ativos</p>
            <p className="text-3xl font-bold text-purple-600">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Média/usuário</p>
            <p className="text-3xl font-bold text-orange-600">784</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">Uso por usuário</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créditos usados</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.creditsUsed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Configurações</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite de rate (req/min)</label>
              <input 
                type="number" 
                value={rateLimit} 
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2 border rounded-md" 
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Salvar</button>
          </div>
        </div>
      </main>
    </div>
  )
}