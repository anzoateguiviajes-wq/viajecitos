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

    if (error) {
      console.error(error)
      alert("Error al guardar")
    } else {
      alert("Referencia guardada ✅")
      setReferenciaInput(prev => {
        const nuevo = { ...prev }
        delete nuevo[reservaId]
        return nuevo
      })
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
      <main className="min-h-screen bg-[#f3f3f3] py-4 md:py-12 px-3 md:px-6 text-black overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          
          {/* Header más compacto en móvil */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4 p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border-[3px] md:border-4 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <div className="w-full">
              <h1 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                MIS <span className={perfil?.tipo_usuario === 'chofer' ? 'text-blue-600' : 'text-green-500'}>
                  {perfil?.tipo_usuario === 'chofer' ? 'RUTAS' : 'RESERVAS'}
                </span>
              </h1>
              <p className={`font-black uppercase text-[8px] md:text-[10px] tracking-[0.3em] mt-3 inline-block px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${perfil?.tipo_usuario === 'chofer' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {perfil?.tipo_usuario === 'chofer' ? 'MODO CONDUCTOR' : 'MODO PASAJERO'}
              </p>
            </div>
            {perfil?.tipo_usuario === 'chofer' && (
              <Link href="/publicar" className="w-full md:w-auto text-center bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] md:text-xs border-2 md:border-4 border-black shadow-[4px_4px_0_0_rgba(37,99,235,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase">
                + Nueva Ruta
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20 italic font-black animate-pulse text-xs">CARGANDO...</div>
          ) : (
            <div className="grid gap-6 md:gap-10">
              
              {/* VISTA CONDUCTOR */}
              {perfil?.tipo_usuario === 'chofer' && viajes.map((viaje) => (
                <div key={viaje.id} className="space-y-4">
                  <div className="bg-blue-50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-[3px] md:border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-lg md:text-3xl font-black italic uppercase leading-tight">
                        {viaje.origen} <span className="text-blue-600">→</span> {viaje.destino}
                      </div>
                      <div className="flex justify-center md:justify-start gap-2 mt-3">
                        <span className="bg-white border-2 border-black px-2 py-1 rounded-lg text-[8px] md:text-[10px] font-black italic">📅 {viaje.fecha_salida}</span>
                        <span className="bg-blue-600 text-white border-2 border-black px-2 py-1 rounded-lg text-[8px] md:text-[10px] font-black italic">💺 {viaje.cupos_disponibles} Libres</span>
                      </div>
                    </div>
                    <button onClick={() => eliminarViaje(viaje.id)} className="w-full md:w-auto bg-white text-red-600 font-black text-[8px] md:text-[10px] uppercase border-2 border-black px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                      Eliminar Ruta
                    </button>
                  </div>

                  <div className="ml-2 md:ml-16 space-y-3">
                    {solicitudesParaMisViajes.filter(s => s.viaje_id === viaje.id).map(solicitud => (
                      <div key={solicitud.id} className="bg-white border-[3px] border-black p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center shadow-[4px_4px_0_0_rgba(37,99,235,1)] gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-10 h-10 md:w-16 md:h-16 border-2 md:border-4 border-black rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {solicitud.perfiles?.avatar_url ? <img src={solicitud.perfiles.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-sm md:text-2xl">👤</span>}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-black text-sm md:text-xl uppercase leading-none truncate block">{solicitud.perfiles?.nombre_completo || 'Usuario'}</span>
                            {solicitud.referencia_pago && (
                              <span className="text-[8px] font-black text-blue-600 uppercase">Ref: {solicitud.referencia_pago}</span>
                            )}
                            <a href={`https://wa.me/${solicitud.perfiles?.telefono?.replace(/\D/g, '')}`} target="_blank" className="block font-black text-green-600 text-[8px] uppercase underline">
                              WhatsApp
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {solicitud.estado === 'pendiente' ? (
                            <>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'aprobado', viaje.id, viaje.cupos_disponibles)} className="flex-1 sm:flex-none bg-yellow-400 border-2 border-black px-3 py-2 rounded-lg font-black text-[9px] uppercase">Aprobar</button>
                              <button onClick={() => gestionarSolicitud(solicitud.id, 'rechazado', viaje.id, viaje.cupos_disponibles)} className="flex-1 sm:flex-none bg-white border-2 border-black px-3 py-2 rounded-lg font-black text-[9px] uppercase">Rechazar</button>
                            </>
                          ) : (
                            <span className={`w-full text-center text-[9px] font-black uppercase px-4 py-2 rounded-lg border-2 border-black ${solicitud.estado === 'aprobado' ? 'bg-green-400' : 'bg-red-400 text-white'}`}>
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
                <div key={reserva.id} className="bg-green-50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-[3px] md:border-4 border-black shadow-[4px_4px_0_0_rgba(34,197,94,1)] space-y-4 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-lg md:text-2xl font-black italic uppercase leading-tight">
                        {reserva.viajes?.origen} <span className="text-green-600">→</span> {reserva.viajes?.destino}
                      </div>
                      <div className="flex justify-center md:justify-start gap-2 mt-3">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black border-2 border-black uppercase ${reserva.estado === 'aprobado' ? 'bg-green-400' : reserva.estado === 'rechazado' ? 'bg-red-400 text-white' : 'bg-yellow-400'}`}>
                          {reserva.estado}
                        </span>
                        <span className="bg-white border-2 border-black px-2 py-1 rounded-lg text-[8px] font-black italic">📅 {reserva.viajes?.fecha_salida}</span>
                      </div>
                    </div>
                    <button onClick={() => cancelarSolicitudPasajero(reserva.id)} className="w-full md:w-auto bg-white text-black border-2 md:border-4 border-black px-4 py-2 rounded-xl text-[8px] md:text-[10px] font-black hover:bg-red-500 hover:text-white transition-all uppercase italic">
                      Cancelar Solicitud
                    </button>
                  </div>

                  {reserva.estado === 'aprobado' && (
                    <div className="pt-4 border-t-2 border-black border-dotted flex flex-col items-center gap-3">
                      <div className="w-full bg-white p-3 md:p-4 rounded-2xl border-2 border-black">
                        <p className="text-[8px] md:text-[9px] font-black uppercase mb-3 text-green-700 text-center md:text-left tracking-wider">Ingresa la referencia de tu pago móvil</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="####"
                            value={referenciaInput[reserva.id] !== undefined ? referenciaInput[reserva.id] : (reserva.referencia_pago || '')}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '');
                              setReferenciaInput({...referenciaInput, [reserva.id]: v});
                            }}
                            className="flex-1 border-2 md:border-4 border-black p-2 md:p-3 rounded-xl font-black text-lg md:text-xl tracking-[0.5em] text-center focus:ring-0 outline-none bg-gray-50 min-w-0"
                          />
                          <button 
                            onClick={() => actualizarReferencia(reserva.id)}
                            className="bg-green-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase border-2 md:border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:shadow-none transition-all"
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