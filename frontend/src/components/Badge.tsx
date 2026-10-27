import type { EstadoVenta } from '../api/types'
import { Pill } from './ui'

const estilos: Record<EstadoVenta, { tone: 'good' | 'warn' | 'danger'; label: string }> = {
  Pagada: { tone: 'good', label: 'Pagado' },
  Parcial: { tone: 'warn', label: 'Abono parcial' },
  Pendiente: { tone: 'danger', label: 'Fiado' },
}

export default function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  const s = estilos[estado]
  return <Pill tone={s.tone}>{s.label}</Pill>
}
