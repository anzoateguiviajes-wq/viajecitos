'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CITIES = [
  "Anaco", "Barcelona", "Cantaura", "Caracas", "Cumana", 
  "El Tigre", "Guanta", "Lechería", "Maturín", "Pariaguán", 
  "Puerto La Cruz", "Puerto Ordaz", "San Tomé", "Santa Ana", "Soledad", "Valle de la Pascua"
].sort()

export default function Home() {
  const [viajes, setViajes] = useState<any[]>([])
  const [filteredViajes, setFilteredViajes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOrigen, setSearchOrigen] = useState('')
  const [searchDestino, setSearchDestino] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('viajes')
        .select(`
          *,
          perfiles (
            id,
            nombre_completo,
            telefono,
            avatar_url,
            verificado_chofer,
            servicios,
            logo_cooperativa_url
          )
        `)
        .order('fecha_salida', { ascending: true })

      if (error) {
        console.error("Error en la consulta de Supabase:", error.message)
        const { data: fallbackData } = await supabase.from('viajes').select('*')
        if (fallbackData) {
          setViajes(fallbackData)
          setFilteredViajes(fallbackData)
        }
      } else if (data) {
        setViajes(data)
        setFilteredViajes(data)
      }
    } catch (err) {
      console.error("Error crítico:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const resultados = viajes.filter((v: any) => 
      (searchOrigen === '' || v.origen === searchOrigen) && 
      (searchDestino === '' || v.destino === searchDestino)
    )
    setFilteredViajes(resultados)
  }, [searchOrigen, searchDestino, viajes])

  const handleWhatsApp = (viaje: any) => {
    const nombreChofer = viaje.perfiles?.nombre_completo || 'el chofer'
    const msj = `Hola ${nombreChofer}! Vi tu viaje de ${viaje.origen} a ${viaje.destino} en la App.`
    const telefono = viaje.perfiles?.telefono || viaje.telefono_contacto 
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msj)}`, '_blank')
  }

  const handleSolicitarPuesto = async (viaje: any) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("DEBES INICIAR SESIÓN para solicitar un puesto.");
      router.push('/login');
      return;
    }

    if (user.id === viaje.chofer_id) {
      alert("No puedes solicitar un puesto en tu propio viaje.");
      return;
    }

    const confirmar = confirm(`¿Quieres enviar una solicitud de puesto para el viaje a ${viaje.destino}? El chofer deberá aprobarla.`);
    
    if (confirmar) {
      const { error } = await supabase
        .from('reservas')
        .insert([
          { 
            viaje_id: viaje.id, 
            pasajero_id: user.id,
            estado: 'pendiente' 
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          alert("Ya tienes una solicitud pendiente para este viaje.");
        } else {
          console.error(error);
          alert("Hubo un error al procesar la solicitud.");
        }
      } else {
        alert("🚀 ¡SOLICITUD ENVIADA! Revisa el estado en tu panel.");
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] pb-20 font-sans text-black">
      {/* HEADER */}
      <div className="bg-yellow-400 pt-16 pb-32 px-6 border-b-8 border-black">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-black uppercase leading-[0.8] mb-4">
            RUTAS <br/> <span className="text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">DISPONIBLES</span>
          </h1>
        </div>
      </div>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto -mt-16 px-6">
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="p-4 bg-gray-50 rounded-2xl border-2 border-black font-black uppercase text-xs outline-none text-black" value={searchOrigen} onChange={(e)=>setSearchOrigen(e.target.value)}>
            <option value="">¿ORIGEN?</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="p-4 bg-gray-50 rounded-2xl border-2 border-black font-black uppercase text-xs outline-none text-black" value={searchDestino} onChange={(e)=>setSearchDestino(e.target.value)}>
            <option value="">¿DESTINO?</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={()=>{setSearchOrigen(''); setSearchDestino('')}} className="bg-black text-white font-black rounded-2xl py-4 uppercase text-xs border-2 border-black hover:bg-yellow-400 hover:text-black transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none">
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* SECCIÓN DE SUGERENCIAS Y RECLAMOS (VISIBLE AL INICIO) */}
      <div className="max-w-6xl mx-auto mt-10 px-6">
        <div className="bg-blue-600 border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-black text-white uppercase text-sm italic italic leading-tight">¿Sugerencias, cambios o reclamos?</p>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Tu feedback nos ayuda a crecer</p>
          </div>
          <a 
            href="mailto:anzoateguiviajes@gmail.com" 
            className="w-full md:w-auto text-center bg-white text-black font-black px-6 py-3 rounded-xl border-2 border-black hover:bg-yellow-400 transition-all text-xs uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none"
          >
            anzoateguiviajes@gmail.com
          </a>
        </div>
      </div>

      {/* GRID DE VIAJES */}
      <div className="max-w-[1400px] mx-auto py-12 px-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-8 border-black border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <p className="font-black uppercase text-gray-400">Sincronizando rutas...</p>
          </div>
        ) : filteredViajes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredViajes.map((viaje) => (
              <div key={viaje.id} className="bg-white rounded-[3.5rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-8 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col">
                      <p className="text-4xl font-black text-black italic leading-none">${viaje.precio_usd}</p>
                      <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                        viaje.cupos_disponibles <= 2 ? 'bg-red-400' : 'bg-yellow-400'
                      }`}>
                        <span className="text-[10px] font-black uppercase italic text-black">
                          {viaje.cupos_disponibles > 0 ? `${viaje.cupos_disponibles} Puestos Libres` : 'AGOTADO'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {viaje.perfiles?.verificado_chofer === 'aprobado' && (
                            <div className="bg-green-100 border-2 border-green-600 px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="text-[8px] font-black text-green-600 uppercase">✓ Chofer Verificado</span>
                            </div>
                        )}
                        {viaje.perfiles?.logo_cooperativa_url && (
                            <div className="bg-white border-2 border-black p-1.5 rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-14 h-14 flex items-center justify-center overflow-hidden group-hover:rotate-3 transition-transform">
                                <img src={viaje.perfiles.logo_cooperativa_url} className="w-full h-full object-contain" alt="Logo" />
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-8">
                    <div className="w-32 h-32 bg-gray-100 border-4 border-black rounded-[3rem] shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden rotate-2 group-hover:rotate-0 transition-all">
                      {viaje.perfiles?.avatar_url ? (
                        <img src={viaje.perfiles.avatar_url} className="w-full h-full object-cover" alt="Chofer" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl bg-yellow-50">👤</div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="font-black text-lg uppercase italic leading-none text-black">{viaje.perfiles?.nombre_completo || 'Chofer Privado'}</h3>
                      <Link href={`/perfil-publico/${viaje.perfiles?.id || '#'}`} className="inline-block mt-2 text-[9px] font-black uppercase text-blue-600 border-b-2 border-blue-600 pb-0.5 hover:text-black hover:border-black transition-colors">
                        Ver Perfil y Vehículo
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-4 border-black p-5 rounded-[2rem] mb-6 relative overflow-hidden">
                    <div className="absolute left-7 top-[40%] h-[20%] border-l-4 border-dotted border-black"></div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-black shrink-0"></div>
                        <p className="text-xl font-black uppercase italic leading-none truncate text-black">{viaje.origen}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-black rounded-full border-2 border-black shrink-0"></div>
                        <p className="text-xl font-black uppercase italic leading-none truncate text-black">{viaje.destino}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-t-4 border-dashed border-black pt-6">
                    <div className="text-center flex-1 border-r-2 border-black/10">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Fecha</p>
                      <p className="font-black text-xl italic text-black">{viaje.fecha_salida}</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Hora</p>
                      <p className="font-black text-xl italic text-black">{viaje.hora_salida?.slice(0,5)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleWhatsApp(viaje)} 
                      disabled={viaje.cupos_disponibles === 0}
                      className="p-2 rounded-2xl border-4 border-black bg-white hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-8 h-8" alt="WA" />
                    </button>

                    <button 
                      onClick={() => handleSolicitarPuesto(viaje)} 
                      disabled={viaje.cupos_disponibles === 0}
                      className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${
                        viaje.cupos_disponibles === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-black text-white hover:bg-yellow-400 hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                      }`}
                    >
                      {viaje.cupos_disponibles === 0 ? 'AGOTADO' : 'Solicitar Puesto'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-8 border-dashed border-gray-200 rounded-[5rem]">
            <p className="text-gray-300 font-black text-4xl uppercase italic tracking-tighter">Ruta no encontrada</p>
            <button onClick={()=>{setSearchOrigen(''); setSearchDestino('')}} className="mt-4 text-black font-black uppercase text-xs underline">Mostrar todos los viajes</button>
          </div>
        )}
      </div>
    </main>
  )
}