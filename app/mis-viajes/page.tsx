'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AuthGuard from '@/components/AuthProvider'

export default function MisViajes() {
  const [viajes, setViajes] = useState<any[]>([])
  const [misReservas, setMisReservas] = useState<any[]>([])
  const [solicitudesParaMisViajes, setSolicitudesParaMisViajes] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referenciaInput, setReferenciaInput] = useState<{ [key: string]: string }>({})
  const supabase = createClient()

  const getData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profileData } = await supabase
        .from('perfiles')
        .select('tipo_usuario')
        .eq('id', user.id)
        .single()
      
      setPerfil(profileData)

      if (profileData?.tipo_usuario === 'chofer') {
        const { data: misRutas } = await supabase
          .from('viajes')
          .select('*')
          .eq('chofer_id', user.id)
          .order('fecha_salida', { ascending: true })
        setViajes(misRutas || [])

        // CORRECCIÓN: Explicitamos 'referencia_pago' en el select para asegurar su carga
        const { data: solicitantes } = await supabase
          .from('reservas')
          .select(`
            id,
            estado,
            viaje_id,
            pasajero_id,
            referencia_pago,
            viajes!inner(id, chofer_id),
            perfiles:pasajero_id(nombre_completo, telefono, avatar_url)
          `)
          .eq('viajes.chofer_id', user.id)
        setSolicitudesParaMisViajes(solicitantes || [])

      } else {
        const { data: misReservasData } = await supabase
          .from('reservas')
          .select(`
            id,
            estado,
            referencia_pago,
            viajes (origen, destino, fecha_salida)
          `)
          .eq('pasajero_id', user.id)
        setMisReservas(misReservasData || [])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    getData()
  }, [])

  const actualizarReferencia = async (reservaId: string) => {
    const ref = referenciaInput[reservaId]
    if (!ref || ref.length < 4) return alert("Ingresa los últimos 4 dígitos")

    const { error } = await supabase
      .from('reservas')
      .update({ referencia_pago: ref })
      .eq('id', reservaId)

    if (error) alert("Error al guardar")
    else {
      alert("Referencia guardada ✅")
      getData()
    }
  }

  const gestionarSolicitud = async (reservaId: string, nuevoEstado: 'aprobado' | 'rechazado', viajeId: number, cuposActuales: number) => {
    const { error: errorReserva } = await supabase
      .from('reservas')
      .update({ estado: nuevoEstado })
      .eq('id', reservaId)

    if (errorReserva) return alert("Error al actualizar la solicitud")

    if (nuevoEstado === 'aprobado') {
      await supabase
        .from('viajes')
        .update({ cupos_disponibles: Math.max(0, cuposActuales - 1) })
        .eq('id', viajeId)
    }
    getData()
  }

  const eliminarViaje = async (id: number) => {
    if (!confirm('¿Estás seguro? Se eliminará la ruta.')) return
    const { error } = await supabase.from('viajes').delete().eq('id', id)
    if (!error) getData()
  }

  const cancelarSolicitudPasajero = async (reservaId: string) => {
    if (!confirm('¿Quieres cancelar esta solicitud?')) return
    const { error } = await supabase.from('reservas').delete().eq('id', reservaId)
    if (!error) getData()
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f3f3f3] py-12 px-6 text-black">
        <div className="max-w-4xl mx-auto">
          
          {/* HEADER RESALTADO POR ROL */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 p-8 rounded-[3rem] border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                MIS <span className={perfil?.tipo_usuario === 'chofer' ? 'text-blue-600' : 'text-green-500'}>
                  {perfil?.tipo_usuario === 'chofer' ? 'RUTAS' : 'RESERVAS'}
                </span>
              </h1>
              <p className={`font-black uppercase text-[10px] tracking-[0.4em] mt-4 inline-block px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${perfil?.tipo_usuario === 'chofer' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {perfil?.tipo_usuario === 'chofer' ? 'MODO CONDUCTOR' : 'MODO PASAJERO'}
              </p>
            </div>
            {perfil?.tipo_usuario === 'chofer' && (
              <Link href="/publicar" className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs border-4 border-black shadow-[6px_6px_0_0_rgba(37,99,235,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">
                + Nueva Ruta
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20 italic font-black animate-pulse">CARGANDO DATOS...</div>
          ) : (
            <div className="grid gap-10">
              
              {/* VISTA CONDUCTOR */}
              {perfil?.tipo_usuario === 'chofer' && viajes.map((viaje) => (
                <div key={viaje.id} className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <div className="text-3xl font-black italic uppercase leading-none">
                        {viaje.origen} <span className="text-blue-600">→</span> {viaje.destino}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <span className="bg-white border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic shadow-[2px_2px_0_0_rgba(0,0,0,1)]">📅 {viaje.fecha_salida}</span>
                        <span className="bg-blue-600 text-white border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic shadow-[2px_2px_0_0_rgba(0,0,0,1)]">💺 {viaje.cupos_disponibles} Libres</span>
                      </div>
                    </div>
                    <button onClick={() => eliminarViaje(viaje.id)} className="bg-white text-red-600 font-black text-[10px] uppercase border-4 border-black px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                      Eliminar Ruta
                    </button>
                  </div>

                  <div className="ml-6 md:ml-16 space-y-4">
                    {solicitudesParaMisViajes.filter(s => s.viaje_id === viaje.id).map(solicitud => (
                      <div key={solicitud.id} className="bg-white border-4 border-black p-5 rounded-[2.5rem] flex flex-wrap justify-between items-center shadow-[6px_6px_0_0_rgba(37,99,235,1)]">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 border-4 border-black rounded-full overflow-hidden bg-gray-100 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                            {solicitud.perfiles?.avatar_url ? <img src={solicitud.perfiles.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl">👤</span>}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-xl uppercase leading-none">{solicitud.perfiles?.nombre_completo || 'Usuario'}</span>
                              {solicitud.referencia_pago ? (
                                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                  PAGO: {solicitud.referencia_pago}
                                </span>
                              ) : (
                                <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full border-2 border-black italic">
                                  Sin referencia
                                </span>
                              )}
                            </div>
                            <a href={`https://wa.me/${solicitud.perfiles?.telefono?.replace(/\D/g, '')}`} target="_blank" className="inline-block font-black text-green-600 text-[10px] uppercase underline decoration-2 underline-offset-4">
                              Contactar WhatsApp
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {solicitud.estado === 'pendiente' ? (
                            <>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'aprobado', viaje.id, viaje.cupos_disponibles)} className="bg-yellow-400 border-2 border-black px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none transition-all">Aprobar</button>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'rechazado', viaje.id, viaje.cupos_disponibles)} className="bg-white border-2 border-black px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none transition-all">Rechazar</button>
                            </>
                          ) : (
                            <span className={`text-xs font-black uppercase px-8 py-3 rounded-xl border-4 border-black ${solicitud.estado === 'aprobado' ? 'bg-green-400' : 'bg-red-400 text-white'}`}>
                              {solicitud.estado === 'aprobado' ? '✓ Aceptado' : '× Rechazado'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* VISTA PASAJERO */}
              {perfil?.tipo_usuario === 'pasajero' && misReservas.map((reserva) => (
                <div key={reserva.id} className="bg-green-50 p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0_0_rgba(34,197,94,1)] space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <div className="text-2xl font-black italic uppercase leading-none">
                        {reserva.viajes?.origen} <span className="text-green-600">→</span> {reserva.viajes?.destino}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black border-2 border-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${reserva.estado === 'aprobado' ? 'bg-green-400' : reserva.estado === 'rechazado' ? 'bg-red-400 text-white' : 'bg-yellow-400'}`}>
                          {reserva.estado}
                        </span>
                        <span className="bg-white border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic">📅 {reserva.viajes?.fecha_salida}</span>
                      </div>
                    </div>
                    <button onClick={() => cancelarSolicitudPasajero(reserva.id)} className="bg-white text-black border-4 border-black px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all uppercase italic">
                      Cancelar Solicitud
                    </button>
                  </div>

                  {reserva.estado === 'aprobado' && (
                    <div className="pt-6 border-t-4 border-black border-dotted flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full bg-white p-4 rounded-3xl border-2 border-black">
                        <p className="text-[10px] font-black uppercase mb-2 text-green-700">Paso Final: Ingresa los últimos 4 dígitos de tu pago móvil</p>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            maxLength={4}
                            placeholder="####"
                            value={referenciaInput[reserva.id] || reserva.referencia_pago || ''}
                            onChange={(e) => setReferenciaInput({...referenciaInput, [reserva.id]: e.target.value})}
                            className="flex-1 border-4 border-black p-3 rounded-2xl font-black text-xl tracking-[0.5em] text-center focus:ring-0 outline-none bg-gray-50"
                          />
                          <button 
                            onClick={() => actualizarReferencia(reserva.id)}
                            className="bg-green-500 text-white px-8 py-2 rounded-2xl font-black text-xs uppercase border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none hover:translate-y-1 transition-all"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}