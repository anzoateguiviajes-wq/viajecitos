'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * El ID se lee desde .env.local
 * Debe estar como: NEXT_PUBLIC_ADMIN_ID=tu-uuid-aqui
 */
const MASTER_ID = process.env.NEXT_PUBLIC_ADMIN_ID;

export default function AdminPanel() {
  const supabase = createClient()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'choferes' | 'pasajeros'>('choferes')
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [stats, setStats] = useState({ pendientes: 0, choferes: 0, pasajeros: 0 })

  useEffect(() => {
    async function checkAccess() {
      const { data: { user }, error } = await supabase.auth.getUser()

      // DEBUG LOGS
      console.log("--- Admin Auth Check ---");
      console.log("User Logged ID:", user?.id);
      console.log("Master ID ENV:", MASTER_ID);

      if (error || !user || user.id !== MASTER_ID) {
        console.error("Acceso denegado. Redirigiendo...");
        setTimeout(() => router.push('/'), 1500);
        return
      }

      setAuthorized(true)
      await fetchTodosLosUsuarios()
    }
    checkAccess()
  }, [router, supabase])

  async function fetchTodosLosUsuarios() {
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('actualizado_en', { ascending: false })

    if (data) {
      console.log("Usuarios cargados:", data); // Para debugear el usuario fantasma
      setUsuarios(data)
      setStats({
        pendientes: data.filter(u => u.verificado_chofer === 'pendiente').length,
        choferes: data.filter(u => u.tipo_usuario === 'chofer' || u.verificado_chofer === 'pendiente').length,
        pasajeros: data.filter(u => u.tipo_usuario === 'pasajero' && u.verificado_chofer !== 'pendiente').length
      })
    }
    setLoading(false)
  }

  async function actualizarEstado(userId: string, nuevoEstado: 'aprobado' | 'rechazado') {
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        verificado_chofer: nuevoEstado,
        tipo_usuario: nuevoEstado === 'aprobado' ? 'chofer' : 'pasajero' // Normalizamos el rol al aprobar
      })
      .eq('id', userId)

    if (!error) {
      fetchTodosLosUsuarios()
    } else {
      alert("Error al actualizar. Revisa las políticas RLS de Supabase.");
    }
  }

  // FILTRADO INTELIGENTE:
  // Si estamos en Choferes, mostramos choferes Y cualquier pendiente (venga de donde venga)
  const usuariosFiltrados = usuarios.filter(u => {
    if (activeTab === 'choferes') {
      return u.tipo_usuario === 'chofer' || u.verificado_chofer === 'pendiente';
    }
    return u.tipo_usuario === 'pasajero' && u.verificado_chofer !== 'pendiente';
  });

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Autenticando Nivel Maestro...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">
              CENTRAL <span className="text-yellow-400">ADMIN</span>
            </h1>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setActiveTab('choferes')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${activeTab === 'choferes' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/10'}`}
              >
                Choferes ({stats.choferes})
              </button>
              <button 
                onClick={() => setActiveTab('pasajeros')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${activeTab === 'pasajeros' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/10'}`}
              >
                Pasajeros ({stats.pasajeros})
              </button>
            </div>
          </div>
          
          {stats.pendientes > 0 && (
            <div className="bg-red-600 text-white px-6 py-3 rounded-2xl animate-pulse border-2 border-white/20">
              <p className="text-[10px] font-black uppercase tracking-widest">{stats.pendientes} POR VERIFICAR</p>
            </div>
          )}
        </div>

        {/* LISTADO */}
        {loading ? (
           <div className="py-20 text-center text-gray-700 font-black uppercase italic tracking-widest">Sincronizando...</div>
        ) : (
          <div className="grid gap-4">
            {usuariosFiltrados.map((user) => (
              <div key={user.id} className="bg-[#0a0a0a] border-2 border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:border-yellow-400/30 transition-all group">
                
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xl group-hover:text-yellow-400">
                    {user.nombre_completo?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm tracking-tight">{user.nombre_completo || 'Usuario Anónimo'}</h3>
                    <p className="text-gray-500 text-[10px] font-bold">ID: {user.id.slice(0,8)}... | {user.telefono || 'Sin Tel'}</p>
                  </div>
                </div>

                {activeTab === 'choferes' && (
                  <>
                    <div className="flex items-center gap-4 bg-[#111] px-5 py-3 rounded-2xl border border-white/5">
                      <div 
                        className="w-16 h-10 bg-black rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-yellow-400 transition-all"
                        onClick={() => user.foto_cedula_url && window.open(user.foto_cedula_url, '_blank')}
                      >
                        {user.foto_cedula_url ? (
                           <img src={user.foto_cedula_url} className="w-full h-full object-cover" alt="Documento" />
                        ) : (
                           <div className="flex items-center justify-center h-full text-[8px] text-gray-700 font-black">N/A</div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[8px] font-black text-gray-600 uppercase">Documento</p>
                        <p className="text-xs font-black tracking-widest uppercase">{user.cedula || '---'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => actualizarEstado(user.id, 'aprobado')}
                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${user.verificado_chofer === 'aprobado' ? 'bg-green-600/10 text-green-500 border border-green-500/50' : 'bg-green-600 text-white hover:bg-green-400 hover:text-black'}`}
                        disabled={user.verificado_chofer === 'aprobado'}
                      >
                        {user.verificado_chofer === 'aprobado' ? '✓ APROBADO' : 'APROBAR'}
                      </button>
                      <button 
                        onClick={() => actualizarEstado(user.id, 'rechazado')}
                        className="px-6 py-3 rounded-xl text-[9px] font-black uppercase bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                      >
                        RECHAZAR
                      </button>
                    </div>
                  </>
                )}

                {activeTab === 'pasajeros' && (
                  <div className="flex items-center gap-4 px-6 py-3 bg-[#111] rounded-2xl border border-white/5">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuenta Activa</span>
                  </div>
                )}

              </div>
            ))}

            {usuariosFiltrados.length === 0 && (
              <div className="text-center py-24 border-4 border-dashed border-white/5 rounded-[3rem]">
                <p className="text-gray-700 font-black uppercase text-[10px] tracking-[0.5em]">No se encontraron registros en esta red</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-20 text-center">
          <button onClick={() => router.push('/')} className="text-white/10 hover:text-yellow-400 text-[9px] font-black uppercase tracking-[0.6em] transition-all">
            — DESCONECTAR TERMINAL MAESTRA —
          </button>
        </div>
        
      </div>
    </main>
  )
}