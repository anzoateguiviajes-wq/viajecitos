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

        const { data: solicitantes } = await supabase
          .from('reservas')
          .select(`
            *,
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
            viajes (*)
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

  // Nueva función para que el pasajero guarde su referencia
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
    if (!confirm('¿Estás seguro? Se eliminará la ruta y las solicitudes.')) return
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
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                MIS <span className="text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  {perfil?.tipo_usuario === 'chofer' ? 'RUTAS' : 'RESERVAS'}
                </span>
              </h1>
              <p className="text-black font-bold uppercase text-[10px] tracking-[0.4em] mt-4 bg-yellow-400 inline-block px-3 py-1 border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                {perfil?.tipo_usuario === 'chofer' ? 'Panel de Conductor' : 'Panel de Pasajero'}
              </p>
            </div>
            {perfil?.tipo_usuario === 'chofer' && (
              <Link href="/publicar" className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs border-4 border-black shadow-[6px_6px_0_0_rgba(253,224,71,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">
                + Nueva Ruta
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20 italic font-black">CARGANDO...</div>
          ) : (
            <div className="grid gap-10">
              {perfil?.tipo_usuario === 'chofer' && viajes.map((viaje) => (
                <div key={viaje.id} className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <div className="text-3xl font-black italic uppercase leading-none">
                        {viaje.origen} <span className="text-yellow-400">→</span> {viaje.destino}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <span className="bg-gray-100 border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic">📅 {viaje.fecha_salida}</span>
                        <span className="bg-yellow-400 border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic">💺 {viaje.cupos_disponibles} Libres</span>
                      </div>
                    </div>
                    <button onClick={() => eliminarViaje(viaje.id)} className="text-red-600 font-black text-[10px] uppercase border-2 border-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                      Eliminar Ruta
                    </button>
                  </div>

                  <div className="ml-6 md:ml-16 space-y-3">
                    {solicitudesParaMisViajes.filter(s => s.viaje_id === viaje.id).map(solicitud => (
                      <div key={solicitud.id} className="bg-white border-4 border-black p-5 rounded-[2rem] flex flex-wrap justify-between items-center shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 border-4 border-black rounded-2xl overflow-hidden bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            {solicitud.perfiles?.avatar_url ? <img src={solicitud.perfiles.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xl">👤</span>}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Link href={`/perfil-publico/${solicitud.pasajero_id}`} className="font-black text-lg uppercase hover:text-blue-600 flex items-center gap-2 group leading-none">
                                {solicitud.perfiles?.nombre_completo || 'Usuario'}
                              </Link>
                              {/* REFERENCIA VISIBLE PARA EL CHOFER */}
                              {solicitud.referencia_pago && (
                                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded border-2 border-black">
                                  REF: {solicitud.referencia_pago}
                                </span>
                              )}
                            </div>
                            <a href={`https://wa.me/${solicitud.perfiles?.telefono?.replace(/\D/g, '')}`} target="_blank" className="inline-flex items-center gap-2 bg-[#25D366] border-2 border-black px-3 py-1.5 rounded-xl">
                              <span className="font-black text-[11px] text-white uppercase italic">WhatsApp</span>
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {solicitud.estado === 'pendiente' ? (
                            <>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'aprobado', viaje.id, viaje.cupos_disponibles)} className="bg-yellow-400 border-2 border-black px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all">Aprobar</button>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'rechazado', viaje.id, viaje.cupos_disponibles)} className="bg-white border-2 border-black px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all">Rechazar</button>
                            </>
                          ) : (
                            <span className={`text-xs font-black uppercase px-8 py-3 rounded-xl border-4 border-black ${solicitud.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {solicitud.estado === 'aprobado' ? '✅ CONFIRMADO' : '❌ RECHAZADA'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {perfil?.tipo_usuario === 'pasajero' && misReservas.map((reserva) => (
                <div key={reserva.id} className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)] space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <div className="text-2xl font-black italic uppercase leading-none">
                        {reserva.viajes?.origen} <span className="text-yellow-400">→</span> {reserva.viajes?.destino}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black border-2 border-black uppercase ${reserva.estado === 'aprobado' ? 'bg-green-400' : reserva.estado === 'rechazado' ? 'bg-red-400 text-white' : 'bg-yellow-400'}`}>
                          {reserva.estado.toUpperCase()}
                        </span>
                        <span className="bg-gray-100 border-2 border-black px-3 py-1 rounded-xl text-[10px] font-black italic">📅 {reserva.viajes?.fecha_salida}</span>
                      </div>
                    </div>
                    <button onClick={() => cancelarSolicitudPasajero(reserva.id)} className="bg-white text-black border-4 border-black px-8 py-4 rounded-2xl text-[11px] font-black hover:bg-red-500 hover:text-white transition-all uppercase italic">
                      Cancelar
                    </button>
                  </div>

                  {/* INPUT PARA CARGAR REFERENCIA (SOLO SI ESTÁ APROBADO) */}
                  {reserva.estado === 'aprobado' && (
                    <div className="pt-4 border-t-2 border-gray-100 flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <p className="text-[9px] font-black uppercase mb-1 ml-2">¿Ya pagaste? Carga los últimos 4 dígitos:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={4}
                            placeholder="Ej: 8823"
                            value={referenciaInput[reserva.id] || reserva.referencia_pago || ''}
                            onChange={(e) => setReferenciaInput({...referenciaInput, [reserva.id]: e.target.value})}
                            className="flex-1 border-4 border-black p-2 rounded-xl font-black text-sm uppercase focus:ring-0 outline-none"
                          />
                          <button 
                            onClick={() => actualizarReferencia(reserva.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:shadow-none"
                          >
                            Guardar
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