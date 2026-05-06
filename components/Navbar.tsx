'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
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

  // Cerrar menú móvil al cambiar de ruta o al redimensionar a desktop
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleGoHome = () => {
    setIsOpen(false)
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
        
        {/* LOGO - Siempre visible y clickeable */}
        <button onClick={handleGoHome} className="flex items-center gap-2 group z-50">
          <div className="bg-yellow-400 p-1 rounded group-hover:scale-110 transition-transform">
            <span className="text-black text-xl">📍</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">
            VIAJES <span className="text-yellow-400">ANZOÁTEGUI</span>
          </span>
        </button>

        {/* ACCIONES DERECHA */}
        <div className="flex items-center gap-4">
          
          {/* NAVEGACIÓN DESKTOP (Oculta en móviles) */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/" active={pathname === '/'} onClick={handleGoHome}>INICIO</NavLink>
            {user ? (
              <>
                <NavLink href="/publicar" active={pathname === '/publicar'}>PUBLICAR</NavLink>
                <NavLink href="/mis-viajes" active={pathname === '/mis-viajes'}>MIS VIAJES</NavLink>
                <NavLink href="/perfil" active={pathname === '/perfil'}>MI PERFIL</NavLink>
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
                className="bg-white text-black px-5 py-2 rounded-xl font-black text-[10px] hover:bg-yellow-400 transition-all uppercase shadow-lg"
              >
                Entrar con Google
              </button>
            )}
          </div>

          {/* BOTÓN HAMBURGUESA (Solo visible en móviles) */}
          <button 
            className="md:hidden text-yellow-400 p-2 z-50 hover:bg-yellow-400/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL (Overlay pantalla completa) */}
      <div className={`
        fixed inset-0 bg-black/98 z-40 flex flex-col items-center justify-center transition-all duration-300 ease-in-out md:hidden
        ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
      `}>
        <div className="flex flex-col items-center gap-10 text-center">
          <button 
            onClick={handleGoHome} 
            className={`text-3xl font-black tracking-widest uppercase ${pathname === '/' ? 'text-yellow-400' : 'text-white'}`}
          >
            INICIO
          </button>
          
          {user ? (
            <>
              <Link href="/publicar" className={`text-3xl font-black tracking-widest uppercase ${pathname === '/publicar' ? 'text-yellow-400' : 'text-white'}`}>
                PUBLICAR
              </Link>
              <Link href="/mis-viajes" className={`text-3xl font-black tracking-widest uppercase ${pathname === '/mis-viajes' ? 'text-yellow-400' : 'text-white'}`}>
                MIS VIAJES
              </Link>
              <Link href="/perfil" className={`text-3xl font-black tracking-widest uppercase ${pathname === '/perfil' ? 'text-yellow-400' : 'text-white'}`}>
                MI PERFIL
              </Link>
              <button 
                onClick={handleLogout}
                className="mt-6 text-red-500 font-black tracking-widest border-2 border-red-500 px-10 py-4 rounded-full hover:bg-red-500 hover:text-white transition-all"
              >
                CERRAR SESIÓN
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-yellow-400 text-black font-black px-10 py-4 rounded-full text-xl uppercase shadow-xl active:scale-95 transition-transform"
            >
              ENTRAR CON GOOGLE
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, children, active, onClick }: any) {
  const styles = `text-[10px] font-black tracking-widest hover:text-yellow-400 transition-colors uppercase ${active ? 'text-yellow-400' : 'text-gray-400'}`

  if (onClick) {
    return <button onClick={onClick} className={styles}>{children}</button>
  }

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  )
}