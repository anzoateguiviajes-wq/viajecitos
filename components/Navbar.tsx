'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X } from 'lucide-react' // Instala lucide-react si no lo tienes

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false) // Estado para el menú móvil
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

  // Cerrar menú móvil cuando cambie la ruta
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleGoHome = () => {
    if (pathname === '/') {
      window.location.reload()
    } else {
      window.location.href = '/'
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
        
        {/* LOGO */}
        <button onClick={handleGoHome} className="flex items-center gap-2 group z-50">
          <div className="bg-yellow-400 p-1 rounded group-hover:scale-110 transition-transform">
            <span className="text-black text-xl">📍</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">
            VIAJES <span className="text-yellow-400">ANZOÁTEGUI</span>
          </span>
        </button>

        {/* BOTÓN HAMBURGUESA (Solo móvil) */}
        <div className="flex items-center gap-4">
          {user && (
            <button 
              className="md:hidden text-yellow-400 p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <div className="flex gap-6 items-center">
                  <NavLink href="/" active={pathname === '/'} onClick={handleGoHome}>INICIO</NavLink>
                  <NavLink href="/publicar" active={pathname === '/publicar'}>PUBLICAR</NavLink>
                  <NavLink href="/mis-viajes" active={pathname === '/mis-viajes'}>MIS VIAJES</NavLink>
                  <NavLink href="/perfil" active={pathname === '/perfil'}>MI PERFIL</NavLink>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-black bg-gray-900 border border-white/10 px-4 py-2 rounded-xl hover:bg-red-600 transition-all uppercase"
                >
                  Salir
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-white text-black px-5 py-2 rounded-xl font-black text-[10px] hover:bg-yellow-400 transition-all uppercase"
              >
                Entrar con Google
              </button>
            )}
          </div>
          
          {/* BOTÓN LOGIN MÓVIL (Si no hay usuario) */}
          {!user && (
            <button 
              onClick={handleLogin}
              className="md:hidden bg-white text-black px-4 py-2 rounded-xl font-black text-[10px]"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* MENÚ MÓVIL (Overlay) */}
      <div className={`
        fixed inset-0 bg-black/95 z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col items-center gap-8 text-center">
          <button onClick={handleGoHome} className="text-2xl font-black tracking-widest text-yellow-400">INICIO</button>
          <Link href="/publicar" className="text-2xl font-black tracking-widest">PUBLICAR</Link>
          <Link href="/mis-viajes" className="text-2xl font-black tracking-widest">MIS VIAJES</Link>
          <Link href="/perfil" className="text-2xl font-black tracking-widest">MI PERFIL</Link>
          <button 
            onClick={handleLogout}
            className="mt-4 text-red-500 font-black tracking-widest border-2 border-red-500 px-8 py-3 rounded-full"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    </nav>
  )
}

// Sub-componente para los links (limpia el código)
function NavLink({ href, children, active, onClick }: any) {
  const content = (
    <span className={`text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors uppercase ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
      {children}
    </span>
  )

  if (onClick) {
    return <button onClick={onClick}>{content}</button>
  }

  return <Link href={href}>{content}</Link>
}