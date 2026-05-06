'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Cargamos el mapa de forma dinámica para evitar errores de SSR
const MapaSeleccion = dynamic(() => import('@/components/MapaSeleccion'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center font-black uppercase text-[10px]">Cargando Mapa...</div>
})

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const mapRef = useRef<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // --- ESTADOS ORIGINALES REINTEGRADOS ---
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const [bio, setBio] = useState('') 
  const [tipoUsuario, setTipoUsuario] = useState('pasajero')
  const [verificadoChofer, setVerificadoChofer] = useState('pendiente')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [cedulaUrl, setCedulaUrl] = useState('')
  const [logoCooperativaUrl, setLogoCooperativaUrl] = useState('')
  const [fotosAuto, setFotosAuto] = useState<string[]>([]) 

  const [servicios, setServicios] = useState({
    aire_acondicionado: false,
    puerta_a_puerta: false,
    wifi: false,
    maletero: false,
    mascotas: false
  })

  // --- ESTADOS DE UBICACIÓN ---
  const [direccionReferencia, setDireccionReferencia] = useState('')
  const [coords, setCoords] = useState({ lat: -0.1807, lng: -78.4678 })

  useEffect(() => {
    async function loadPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()

      if (data) {
        setNombre(data.nombre_completo || '')
        setTelefono(data.telefono || '')
        setCedula(data.cedula || '')
        setBio(data.bio || '')
        setTipoUsuario(data.tipo_usuario || 'pasajero')
        setVerificadoChofer(data.verificado_chofer || 'pendiente')
        setAvatarUrl(data.avatar_url || '')
        setCedulaUrl(data.foto_cedula_url || '')
        setLogoCooperativaUrl(data.logo_cooperativa_url || '')
        setFotosAuto(data.fotos_auto || [])
        if (data.servicios) setServicios(data.servicios)
        
        setDireccionReferencia(data.direccion_referencia || '')
        if (data.latitud && data.longitud) {
          setCoords({ lat: data.latitud, lng: data.longitud })
        }
      }
      setLoading(false)
    }
    loadPerfil()
  }, [supabase, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('perfiles')
        .upsert({
          id: user.id,
          nombre_completo: nombre,
          telefono: telefono,
          cedula: cedula,
          bio: bio,
          tipo_usuario: tipoUsuario,
          avatar_url: avatarUrl,
          foto_cedula_url: cedulaUrl,
          logo_cooperativa_url: logoCooperativaUrl,
          fotos_auto: fotosAuto,
          servicios: servicios,
          direccion_referencia: direccionReferencia,
          latitud: coords.lat,
          longitud: coords.lng,
          actualizado_en: new Date().toISOString(),
        })

      if (error) throw error
      alert('¡Perfil actualizado!')
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const toggleServicio = (key: keyof typeof servicios) => {
    setServicios(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const uploadFile = async (event: any, setter: (url: string) => void) => {
    try {
      setUpdating(true)
      const file = event.target.files[0]
      if (!file) return;
      const fileName = `${user.id}-${Math.random()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('perfiles').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('perfiles').getPublicUrl(fileName)
      setter(publicUrl)
    } catch (error: any) {
      alert('Error al subir: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const uploadFotoAuto = async (event: any) => {
    if (fotosAuto.length >= 3) { alert('Máximo 3 fotos'); return; }
    await uploadFile(event, (url) => setFotosAuto(prev => [...prev, url]))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic">CARGANDO...</div>

  return (
    <main className="min-h-screen bg-[#f3f3f3] pb-20 text-black">
      <div className="bg-black pt-16 pb-32 px-6 border-b-8 border-yellow-400">
        <h1 className="text-5xl font-black italic text-white text-center uppercase tracking-tighter">Mi Perfil</h1>
      </div>

      <div className="max-w-2xl mx-auto -mt-16 px-6">
        <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] space-y-10">
          
          {/* SELECTOR DE ROL */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setTipoUsuario('pasajero')} className={`py-4 rounded-2xl border-4 border-black font-black uppercase text-xs transition-all ${tipoUsuario === 'pasajero' ? 'bg-yellow-400 translate-x-1 translate-y-1 shadow-none' : 'bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]'}`}>Soy Pasajero</button>
            <button type="button" onClick={() => setTipoUsuario('chofer')} className={`py-4 rounded-2xl border-4 border-black font-black uppercase text-xs transition-all ${tipoUsuario === 'chofer' ? 'bg-yellow-400 translate-x-1 translate-y-1 shadow-none' : 'bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]'}`}>Soy Chofer</button>
          </div>

          {/* FOTOS DE PERFIL Y DOCUMENTOS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 border-4 border-black rounded-[2rem] overflow-hidden bg-gray-50 relative group shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-2xl">👤</div>}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <input type="file" className="hidden" onChange={(e) => uploadFile(e, setAvatarUrl)} />
                  <span className="text-white text-[8px] font-black">SUBIR</span>
                </label>
              </div>
              <p className="text-[8px] font-black uppercase mt-3">Perfil</p>
            </div>

            {/* Cédula */}
            <div className="flex flex-col items-center">
              <div className="w-full h-24 border-4 border-black rounded-2xl overflow-hidden bg-gray-50 relative group shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                {cedulaUrl ? <img src={cedulaUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] font-black italic px-2">ID Cédula</div>}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => uploadFile(e, setCedulaUrl)} />
                  <span className="text-white text-[8px] font-black">SUBIR</span>
                </label>
              </div>
              <p className="text-[8px] font-black uppercase mt-3">Cédula</p>
            </div>

            {/* Logo Cooperativa (Solo Chofer) */}
            {tipoUsuario === 'chofer' && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 border-4 border-black rounded-[2rem] overflow-hidden bg-gray-50 relative group shadow-[4px_4px_0_0_rgba(255,215,0,0.3)] border-yellow-400">
                  {logoCooperativaUrl ? <img src={logoCooperativaUrl} className="w-full h-full object-contain p-2" /> : <div className="h-full flex items-center justify-center text-[8px] font-black text-yellow-600 uppercase italic">Logo Coop</div>}
                  <label className="absolute inset-0 bg-yellow-400/90 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                    <input type="file" className="hidden" onChange={(e) => uploadFile(e, setLogoCooperativaUrl)} />
                    <span className="text-black text-[8px] font-black">SUBIR</span>
                  </label>
                </div>
                <p className="text-[8px] font-black uppercase mt-3 text-yellow-600">Cooperativa</p>
              </div>
            )}
          </div>

          {/* PANEL PASAJERO (MAPA) */}
          {tipoUsuario === 'pasajero' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <div className="inline-block bg-yellow-400 border-4 border-black px-4 py-1 rounded-full shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                   <p className="text-[10px] font-black uppercase italic">📍 Punto de Recogida</p>
                </div>
                <div className="relative border-4 border-black rounded-[2.5rem] overflow-hidden h-72 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-white">
                  <MapaSeleccion ref={mapRef} initialCoords={coords} onLocationSelect={(newCoords: any) => setCoords(newCoords)} />
                </div>
                <button type="button" onClick={() => mapRef.current?.centerOnMe()} className="w-full bg-blue-400 border-4 border-black py-4 rounded-2xl font-black uppercase text-[10px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                  🎯 Detectar mi ubicación actual
                </button>
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-4 bg-black text-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase z-10 italic">Referencia de casa</label>
                <textarea value={direccionReferencia} onChange={(e) => setDireccionReferencia(e.target.value)} className="w-full p-4 border-4 border-black rounded-3xl font-bold outline-none bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-24 placeholder:text-gray-300 italic" placeholder="Ej: Casa blanca de dos pisos..." />
              </div>
            </div>
          )}

          {/* PANEL CHOFER (BIO + SERVICIOS + FOTOS AUTO) */}
          {tipoUsuario === 'chofer' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <label className="absolute -top-3 left-4 bg-black text-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase z-10 italic">Presentación</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-4 border-4 border-black rounded-3xl font-bold outline-none bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-28" />
              </div>

              {/* SERVICIOS */}
              <div className="relative border-4 border-black p-6 rounded-3xl bg-gray-50 space-y-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                <label className="absolute -top-4 left-4 bg-yellow-400 border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic">Servicios Incluidos</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'aire_acondicionado', label: 'Aire Acond.', icon: '❄️' },
                    { id: 'puerta_a_puerta', label: 'Puerta a Puerta', icon: '🏠' },
                    { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
                    { id: 'maletero', label: 'Maletero', icon: '💼' },
                    { id: 'mascotas', label: 'Mascotas', icon: '🐶' },
                  ].map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleServicio(item.id as any)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-black font-black text-[9px] uppercase transition-all ${servicios[item.id as keyof typeof servicios] ? 'bg-yellow-400 shadow-none' : 'bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]'}`}>
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FOTOS VEHÍCULO */}
              <div className="relative border-4 border-black p-6 rounded-[2.5rem] bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                <label className="absolute -top-4 left-4 bg-black text-yellow-400 border-2 border-black px-3 py-1 text-[10px] font-black uppercase italic">Fotos Vehículo (Máx 3)</label>
                <div className="grid grid-cols-3 gap-4">
                  {fotosAuto.map((url, i) => (
                    <div key={i} className="aspect-square border-2 border-black rounded-xl overflow-hidden relative shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFotosAuto(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] border border-black font-black">X</button>
                    </div>
                  ))}
                  {fotosAuto.length < 3 && (
                    <label className="aspect-square border-2 border-dashed border-black rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-yellow-50">
                      <input type="file" className="hidden" onChange={uploadFotoAuto} />
                      <span className="text-xl">🚗</span>
                      <span className="text-[7px] font-black">AÑADIR</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DATOS PERSONALES GENERALES */}
          <div className="space-y-8">
            <div className="relative">
              <label className="absolute -top-3 left-4 bg-yellow-400 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase z-10">Nombre Completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-4 border-4 border-black rounded-2xl font-bold bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] uppercase" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative">
                <label className="absolute -top-3 left-4 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase z-10">Nº Cédula</label>
                <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} className="w-full p-4 border-4 border-black rounded-2xl font-bold bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]" required />
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-4 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase z-10">WhatsApp</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-4 border-4 border-black rounded-2xl font-bold bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={updating} className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase border-4 border-black shadow-[8px_8px_0_0_rgba(254,240,138,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
            {updating ? 'PROCESANDO...' : 'ACTUALIZAR PERFIL'}
          </button>
        </form>
      </div>
    </main>
  )
}