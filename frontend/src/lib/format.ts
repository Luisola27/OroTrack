/** Formatea un monto en colones costarricenses, ej. ₡41 600 o ₡80,50 */
export function formatColones(valor: number, decimales = 0): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)
}

/** Gramos con hasta 3 decimales, sin ceros de sobra: 12.5 g */
export function formatGramos(valor: number): string {
  return `${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 3 }).format(valor)} g`
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Inicio del día local en ISO (UTC). Usar esto y no `toISOString().slice(0, 10)`:
 * en Costa Rica, después de las 6 p. m. la fecha UTC ya es "mañana". */
export function inicioDelDiaISO(diasAtras = 0): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString()
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Extrae el mensaje de error que devuelve la API (texto plano) o usa uno por defecto. */
export function mensajeError(err: unknown, porDefecto: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  return typeof data === 'string' && data.trim() ? data : porDefecto
}
