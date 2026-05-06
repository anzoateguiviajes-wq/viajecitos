'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Si no hay sesión, lo mandamos al home
        router.push('/')
      } else {
        setSession(session)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black">VALIDANDO SESIÓN...</div>

  return session ? <>{children}</> : null
}