'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthProvider'

const CITIES = [
  "Anaco", "Barcelona", "Cantaura", "Caracas", "Cumana", 
  "El Tigre", "Guanta", "Lechería", "Maturín", "Pariaguán", 
  "Puerto La Cruz", "Puerto Ordaz", "San Tomé", "Soledad", "Valle de la Pascua"
].sort()

export default function PublicarViaje() {
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [precio, setPrecio] = useState('')
  const [cupos, setCupos] = useState('4')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Solo validamos que sea TIPO CHOFER
      const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('tipo_usuario')
        .eq('id', currentUser.id)
        .single()

      if (error || perfil?.tipo_usuario !== 'chofer') {
        alert("ACCESO RESTRINGIDO: Debes cambiar tu rol a CHOFER en el perfil para publicar.")
        router.push('/perfil')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }
    
    checkUserRole()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setEnviando(true)
    setStatus('idle')

    const { error } = await supabase.from('viajes').insert([
      { 
        origen, 
        destino, 
        precio_usd: parseFloat(precio), 
        cupos_disponibles: parseInt(cupos),
        fecha_salida: fecha,
        hora_salida: hora,
        chofer_id: user.id 
      }
    ])

    if (error) {
      console.error(error)
      setStatus('error')
      setEnviando(false)
    } else {
      setStatus('success')
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-8 border-black border-t-white rounded-full animate-spin mb-4"></div>
        <p className="font-black uppercase italic text-black">Cargando panel...</p>
      </div>
    )
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-yellow-400 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-black italic tracking-tighter text-black uppercase leading-none">
              PUBLICAR <span className="text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)] text-6xl">RUTA</span>
            </h1>
            <div className="inline-block bg-black text-white px-4 py-1 mt-2 rotate-1 shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest">Panel de Publicación Directa</p>
            </div>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="bg-white p-8 md:p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] space-y-6"
          >
            {status === 'success' && (
              <div className="bg-green-400 border-4 border-black p-4 rounded-2xl font-black text-center animate-bounce">
                ¡VIAJE PUBLICADO! 🚀
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-500 text-white border-4 border-black p-4 rounded-2xl font-black text-center">
                ERROR AL GUARDAR. INTENTA DE NUEVO.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Desde:</label>
                <select 
                  required
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none focus:bg-yellow-50 transition-colors"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                >
                  <option value="">Origen...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Hacia:</label>
                <select 
                  required
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none focus:bg-yellow-50 transition-colors"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                >
                  <option value="">Destino...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Día de salida:</label>
                <input 
                  type="date"
                  required
                  min={hoy}
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Hora estimada:</label>
                <input 
                  type="time"
                  required
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Precio ($):</label>
                <input 
                  type="number"
                  placeholder="20"
                  required
                  min="1"
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase ml-2 italic">Puestos:</label>
                <input 
                  type="number"
                  required
                  min="1"
                  max="8"
                  className="p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold outline-none"
                  value={cupos}
                  onChange={(e) => setCupos(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={enviando || status === 'success'}
              className={`w-full py-5 rounded-[2rem] font-black text-xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-1 active:translate-y-1 ${
                enviando ? 'bg-gray-300' : 'bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black uppercase'
              }`}
            >
              {enviando ? 'PROCESANDO...' : 'LANZAR RUTA'}
            </button>
          </form>
        </div>
      </main>
    </AuthGuard>
  )
}