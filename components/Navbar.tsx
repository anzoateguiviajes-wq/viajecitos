'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  // Función para resetear la app y volver al menú principal
  const handleGoHome = () => {
    if (pathname === '/') {
      window.location.reload() // Si ya está en home, refresca para limpiar filtros
    } else {
      window.location.href = '/' // Fuerza ir al inicio y resetear estado
    }
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-black text-white px-6 py-4 shadow-2xl sticky top-0 z-50 border-b border-yellow-400/20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* LOGO - Ahora con comportamiento de reset */}
        <button onClick={handleGoHome} className="flex items-center gap-2 group">
          <div className="bg-yellow-400 p-1 rounded group-hover:scale-110 transition-transform">
            <span className="text-black text-xl">📍</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">
            VIAJES <span className="text-yellow-400">ANZOÁTEGUI</span>
          </span>
        </button>

        <div className="flex items-center gap-4 md:gap-8">
          {user ? (
            <>
              <div className="hidden md:flex gap-6 items-center">
                {/* BOTÓN INICIO - Mismo comportamiento que el logo */}
                <button 
                  onClick={handleGoHome}
                  className={`text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors uppercase ${pathname === '/' ? 'text-yellow-400' : 'text-gray-400'}`}
                >
                  INICIO
                </button>

                <Link href="/publicar" className={`text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors ${pathname === '/publicar' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  PUBLICAR
                </Link>
                <Link href="/mis-viajes" className={`text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors ${pathname === '/mis-viajes' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  MIS VIAJES
                </Link>
                <Link href="/perfil" className={`text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors ${pathname === '/perfil' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  MI PERFIL
                </Link>
              </div>

              <button 
                onClick={handleLogout}
                className="text-[10px] font-black bg-gray-900 border border-white/10 px-4 py-2 rounded-xl hover:bg-red-600 hover:border-red-600 transition-all uppercase"
              >
                Salir
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl font-black text-[10px] hover:bg-yellow-400 transition-all shadow-lg uppercase"
            >
              Entrar con Google
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}