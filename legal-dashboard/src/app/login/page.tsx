'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup' | 'magic_link'>('login')

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setMessage('Verifique seu e-mail para confirmar o cadastro!')
      } else if (mode === 'magic_link') {
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard/reports`,
          },
        })
        if (magicLinkError) throw magicLinkError
        setMessage('Enviamos um link de acesso para o seu e-mail!')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        window.location.href = '/dashboard/reports'
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {mode === 'login' ? 'Acessar Conta' : mode === 'signup' ? 'Criar Conta' : 'Acesso Rápido'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md" 
              required 
              placeholder="seu@email.com"
            />
          </div>

          {mode !== 'magic_link' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-3 py-2 border rounded-md" 
                required 
                minLength={6}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 disabled:bg-gray-300 font-medium transition-colors mt-2"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Enviar Link de Acesso'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          {mode !== 'login' && (
            <button 
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Já tem uma conta? <span className="font-medium text-blue-600">Faça login</span>
            </button>
          )}
          
          {mode !== 'signup' && (
            <button 
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Não tem conta? <span className="font-medium text-blue-600">Cadastre-se</span>
            </button>
          )}

          {mode !== 'magic_link' && (
            <button 
              onClick={() => { setMode('magic_link'); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Esqueceu a senha? <span className="font-medium text-blue-600">Receber link de acesso</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}