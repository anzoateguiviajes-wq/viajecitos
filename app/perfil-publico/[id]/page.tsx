'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Cargamos el mapa solo para pasajeros
const MapaSeleccion = dynamic(() => import('@/components/MapaSeleccion'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center font-black uppercase text-[10px]">Cargando Ubicación...</div>
})

export default function PerfilPublico() {
  const { id } = useParams()
  const supabase = createClient()
  const router = useRouter()
  
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPerfil() {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error("Error cargando perfil:", error)
        router.push('/')
      } else {
        setPerfil(data)
      }
      setLoading(false)
    }
    loadPerfil()
  }, [id, supabase, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic uppercase">Cargando Perfil...</div>

  const esChofer = perfil.tipo_usuario === 'chofer'

  return (
    <main className="min-h-screen bg-[#f3f3f3] pb-20">
      {/* HEADER DINÁMICO */}
      <div className={`${esChofer ? 'bg-yellow-400' : 'bg-black'} pt-16 pb-32 px-6 border-b-8 border-black transition-colors duration-500`}>
        <button onClick={() => router.back()} className="mb-8 bg-white text-black px-6 py-2 rounded-xl font-black uppercase text-xs shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black">
          ← Volver
        </button>
        <h1 className={`text-5xl font-black italic uppercase leading-none ${esChofer ? 'text-black' : 'text-white'}`}>
          Perfil del <br/> 
          <span className={`${esChofer ? 'text-white' : 'text-yellow-400'} drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
            {esChofer ? 'Chofer' : 'Pasajero'}
          </span>
        </h1>
      </div>

      <div className="max-w-2xl mx-auto -mt-16 px-6">
        <div className="bg-white p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] space-y-8">
          
          {/* FOTO Y IDENTIFICACIÓN */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 border-8 border-black rounded-[4rem] overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)] mb-6 bg-gray-100">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-6xl">👤</div>
              )}
            </div>
            <h2 className="text-3xl font-black uppercase italic text-center">{perfil.nombre_completo}</h2>
            
            {esChofer && perfil.verificado_chofer === 'aprobado' && (
              <span className="mt-2 bg-green-500 text-white px-4 py-1 rounded-full border-2 border-black font-black text-[10px] uppercase">✓ Chofer Verificado</span>
            )}
          </div>

          {/* SECCIÓN DINÁMICA: MAPA (PASAJERO) O VEHÍCULO (CHOFER) */}
          {!esChofer ? (
            /* VISTA PASAJERO: UBICACIÓN */
            <div className="space-y-6">
              <div className="relative border-4 border-black rounded-[2.5rem] overflow-hidden h-64 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-gray-200">
                <MapaSeleccion 
                  initialCoords={{ lat: perfil.latitud, lng: perfil.longitud }} 
                  onLocationSelect={() => {}} // Solo lectura en perfil público
                />
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-[1000]">
                  📍 Punto de Recogida
                </div>
              </div>
              
              <div className="bg-blue-50 border-4 border-black p-6 rounded-3xl relative">
                <span className="absolute -top-4 left-6 bg-black text-white px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black">Referencia de Casa</span>
                <p className="font-bold text-gray-700 leading-tight">
                  {perfil.direccion_referencia || "No se proporcionó una referencia específica."}
                </p>
              </div>
            </div>
          ) : (
            /* VISTA CHOFER: BIO Y AUTO */
            <>
              <div className="bg-gray-50 border-4 border-black p-6 rounded-3xl relative">
                <span className="absolute -top-4 left-6 bg-black text-white px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black">Sobre mí</span>
                <p className="font-bold text-gray-700 leading-tight">
                  {perfil.bio || "Este chofer aún no ha agregado una presentación."}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-black uppercase italic text-sm flex items-center gap-2">
                  <span>🚗</span> Mi Vehículo
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {perfil.fotos_auto && perfil.fotos_auto.length > 0 ? (
                    perfil.fotos_auto.map((url: string, i: number) => (
                      <div key={i} className="border-4 border-black rounded-[2rem] overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                        <img src={url} className="w-full h-64 object-cover" alt={`Auto ${i}`} />
                      </div>
                    ))
                  ) : (
                    <div className="p-10 border-4 border-dashed border-gray-200 rounded-3xl text-center font-black text-gray-300 uppercase">Sin fotos del auto</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* BOTÓN CONTACTO (Común para ambos) */}
          <a 
            href={`https://wa.me/${perfil.telefono?.replace(/\+/g, '')}`}
            className="block w-full bg-[#25D366] text-black text-center py-6 rounded-2xl font-black uppercase border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            Contactar por WhatsApp
          </a>

        </div>
      </div>
    </main>
  )
}