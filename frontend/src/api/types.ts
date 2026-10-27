export type TipoPago = 'Contado' | 'Fiado'
export type EstadoVenta = 'Pagada' | 'Parcial' | 'Pendiente'
export type Calidad = 'Barata' | 'Media' | 'Cara'
export type MetodoPago = 'Efectivo' | 'Sinpe' | 'Transferencia' | 'RetiroSinTarjeta'

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Sinpe', label: 'Sinpe' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'RetiroSinTarjeta', label: 'Retiro sin tarjeta' },
]

export interface TipoOro {
  id: number
  nombre: string
  emoji: string
  quilateReferencia?: number
  permiteCalidad: boolean
  activo: boolean
}

export interface Cliente {
  id: number
  nombre: string
  telefono?: string
  direccion?: string
  identificacion?: string
  saldoPendiente: number
  activo: boolean
}

export type Rol = 'Admin' | 'Vendedor'

export interface Usuario {
  id: string
  nombreCompleto: string
  email: string
  rol?: Rol
  activo: boolean
}

export interface Contenedor {
  id: number
  tipoOro: TipoOro
  calidad?: Calidad
  pesoTotalGramos: number
  pesoDisponibleGramos: number
  costoPorGramo: number
  proveedor?: string
  activo: boolean
}

export interface VentaDetalleResumen {
  tipoOroNombre: string
  tipoOroEmoji: string
  calidad?: Calidad
  gramos: number
}

export interface Venta {
  id: number
  clienteId: number
  clienteNombre: string
  vendedorNombre: string
  fecha: string
  tipoPago: TipoPago
  estado: EstadoVenta
  totalGramos: number
  totalMonto: number
  saldoPendiente: number
  detalles: VentaDetalleResumen[]
}

export interface Deudor {
  clienteId: number
  clienteNombre: string
  saldoPendiente: number
  ultimaVentaFiada: string
  diasVencido: number
}

export type TipoMovimiento = 'Venta' | 'Reabastecimiento' | 'Ajuste'

export interface Movimiento {
  fecha: string
  tipo: TipoMovimiento
  contenedorId: number
  tipoOroNombre: string
  tipoOroEmoji: string
  calidad?: Calidad
  gramos: number
  usuarioNombre: string
  clienteNombre?: string
  metodo?: MetodoPago
  nota?: string
}

export interface InventarioPorTipo {
  tipoOroNombre: string
  tipoOroEmoji: string
  quilateReferencia?: number
  pesoDisponibleTotal: number
  pesoTotalHistorico: number
  gramosVendidosHistorico: number
  cantidadContenedores: number
}

export interface ResumenPorTipo {
  nombre: string
  emoji: string
  calidad?: Calidad
  gramos: number
  monto: number
}

export interface Resumen {
  totalVentas: number
  totalGramosVendidos: number
  totalMontoVendido: number
  totalFiado: number
  totalCobrado: number
  /** Solo viene para Admin. */
  costoVendido?: number | null
  ganancia?: number | null
  porTipo: ResumenPorTipo[]
}

export interface Cierre {
  id: number
  usuarioId: string
  usuarioNombre: string
  desde: string
  hasta: string
  totalVendido: number
  totalFiadoOtorgado: number
  costoMaterialVendido: number
  efectivoVentas: number
  efectivoCompras: number
  sinpeVentas: number
  sinpeCompras: number
  transferenciaVentas: number
  transferenciaCompras: number
  retiroSinTarjetaVentas: number
  retiroSinTarjetaCompras: number
  efectivoEntradas: number
  efectivoSalidas: number
  comprasConCapital: number
  efectivoContado: number
  efectivoEsperado: number
  diferencia: number
  nota?: string
  cerradoPorNombre: string
  fechaCierre: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  usuarioId: string
  nombreCompleto: string
  roles: string[]
}

export type FuenteDinero = 'Caja' | 'Capital'
export type TipoMovimientoCaja = 'Aporte' | 'Retiro' | 'Gasto'

export const TIPOS_MOVIMIENTO_CAJA: { value: TipoMovimientoCaja; label: string; ayuda: string }[] = [
  { value: 'Aporte', label: 'Entrada', ayuda: 'Fondo inicial, sencillo o capital que se deja en la caja.' },
  { value: 'Retiro', label: 'Retiro', ayuda: 'Dinero que se saca de la caja para entregarlo (dueño, banco).' },
  { value: 'Gasto', label: 'Gasto', ayuda: 'Algo que se pagó con la plata de la caja (transporte, comida…).' },
]

export function etiquetaMetodo(m?: MetodoPago | null): string {
  return METODOS_PAGO.find((x) => x.value === m)?.label ?? '—'
}

export interface MetodoResumen {
  metodo: MetodoPago
  cobrado: number
  compras: number
  entradas: number
  salidas: number
  neto: number
}

/** Estado de la caja de un usuario en un período (base del cierre). */
export interface CajaResumen {
  totalVendido: number
  totalGramosVendido: number
  totalFiadoOtorgado: number
  totalCobrado: number
  costoMaterialVendido: number
  gananciaBruta: number
  comprasConCaja: number
  comprasConCapital: number
  porMetodo: MetodoResumen[]
  efectivoEsperado: number
}

export interface CajaEstado {
  usuarioId: string
  usuarioNombre: string
  rol?: Rol
  ultimoCierre?: string | null
  resumen: CajaResumen
}

export interface CajaMovimiento {
  fecha: string
  tipo: string
  descripcion: string
  metodo?: MetodoPago | null
  monto: number
  afectaCaja: boolean
  responsableNombre: string
  nota?: string | null
}
