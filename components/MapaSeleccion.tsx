'use client'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'

const customIcon = L.divIcon({
  html: `<span style="font-size: 30px;">📍</span>`,
  className: 'dummy-class',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Lógica interna del mapa
function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  const map = useMap()

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng)
      map.panTo(e.latlng)
    },
  })

  return position ? <Marker position={position} icon={customIcon} /> : null
}

// Usamos forwardRef para poder controlar el "FlyTo" desde el botón exterior
const MapaSeleccion = forwardRef(({ onLocationSelect, initialCoords }: any, ref) => {
  const [position, setPosition] = useState(initialCoords.lat !== -0.1807 ? initialCoords : null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  // Esta función se podrá llamar desde el padre (PerfilPage)
  useImperativeHandle(ref, () => ({
    centerOnMe: () => {
      if (mapInstance) {
        mapInstance.locate().on("locationfound", (e) => {
          setPosition(e.latlng)
          onLocationSelect(e.latlng)
          mapInstance.flyTo(e.latlng, 16)
        })
      }
    }
  }))

  return (
    <MapContainer 
      center={initialCoords} 
      zoom={15} 
      style={{ height: '100%', width: '100%' }}
      ref={setMapInstance}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker 
        position={position} 
        setPosition={setPosition} 
        onLocationSelect={onLocationSelect} 
      />
    </MapContainer>
  )
})

MapaSeleccion.displayName = 'MapaSeleccion'
export default MapaSeleccion