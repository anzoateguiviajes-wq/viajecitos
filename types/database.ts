export interface Viaje {
  id: number;
  chofer_id: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  hora_salida: string;
  cupos_disponibles: number;
  precio_usd: number;
  perfiles?: {
    nombre_completo: string;
    telefono: string;
  };
}