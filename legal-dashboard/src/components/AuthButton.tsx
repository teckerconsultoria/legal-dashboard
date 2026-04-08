'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <span className="text-gray-400">Loading...</span>
  }

  if (user) {
    return (
      <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
        Logout
      </button>
    )
  }

  return (
    <a href="/login" className="text-blue-600 hover:text-blue-700">
      Login
    </a>
  )
}