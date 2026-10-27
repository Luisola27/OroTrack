import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { InventarioPorTipo, Movimiento, TipoMovimiento } from '../api/types'
import { etiquetaMetodo } from '../api/types'
import { EmojiGlyph } from '../components/EmojiGlyph'
import { Chips, List, PageHeader, Progress, Section, Stat } from '../components/ui'
import { formatFechaHora, formatGramos } from '../lib/format'

const FILTROS: { value: TipoMovimiento | 'Todos'; label: string }[] = [
  { value: 'Todos', label: 'Todos' },
  { value: 'Venta', label: 'Ventas' },
  { value: 'Reabastecimiento', label: 'Compras de material' },
  { value: 'Ajuste', label: 'Ajustes' },
]

const ESTILO_TIPO: Record<TipoMovimiento, { color: string; bg: string; signo: string; label: string }> = {
  Venta: { color: 'var(--danger)', bg: 'var(--danger-soft)', signo: '−', label: 'Venta' },
  Reabastecimiento: { color: 'var(--good)', bg: 'var(--good-soft)', signo: '+', label: 'Compra de material' },
  Ajuste: { color: 'var(--warn)', bg: 'var(--warn-soft)', signo: '±', label: 'Ajuste' },
}

export default function Movimientos() {
  const [inventario, setInventario] = useState<InventarioPorTipo[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [filtro, setFiltro] = useState<TipoMovimiento | 'Todos'>('Todos')

  useEffect(() => {
    api.get<InventarioPorTipo[]>('/movimientos/inventario-por-tipo').then((r) => setInventario(r.data))
    api.get<Movimiento[]>('/movimientos').then((r) => setMovimientos(r.data))
  }, [])

  const visibles = filtro === 'Todos' ? movimientos : movimientos.filter((m) => m.tipo === filtro)
  const totalDisponible = inventario.reduce((acc, i) => acc + i.pesoDisponibleTotal, 0)
  const totalVendido = inventario.reduce((acc, i) => acc + i.gramosVendidosHistorico, 0)
  const totalComprado = inventario.reduce((acc, i) => acc + i.pesoTotalHistorico, 0)

  return (
    <div>
      <PageHeader title="Movimientos de oro" subtitle="Entradas y salidas de material, y lo que queda por tipo" />

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Stat label="Disponible ahora" value={formatGramos(totalDisponible)} tone="accent" />
        <Stat label="Vendido (histórico)" value={formatGramos(totalVendido)} />
        <Stat label="Comprado (histórico)" value={formatGramos(totalComprado)} />
      </div>

      <Section title="Lo que queda por tipo">
        <List isEmpty={inventario.length === 0} empty="Aún no hay lotes.">
          {inventario.map((i) => (
            <div key={i.tipoOroNombre} className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">
                  <EmojiGlyph value={i.tipoOroEmoji} /> {i.tipoOroNombre}
                  <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{i.cantidadContenedores} lote(s)</span>
                </span>
                <span className="num text-[var(--text-muted)]">
                  <b className="text-[var(--text)]">{formatGramos(i.pesoDisponibleTotal)}</b> / {formatGramos(i.pesoTotalHistorico)}
                </span>
              </div>
              <Progress value={i.pesoTotalHistorico > 0 ? i.pesoDisponibleTotal / i.pesoTotalHistorico : 0} />
            </div>
          ))}
        </List>
      </Section>

      <Section title="Historial">
        <div className="mb-4">
          <Chips value={filtro} onChange={setFiltro} options={FILTROS} />
        </div>
        <List isEmpty={visibles.length === 0} empty="Sin movimientos para este filtro.">
          {visibles.map((m, idx) => {
            const estilo = ESTILO_TIPO[m.tipo]
            return (
              <div key={idx} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: estilo.bg, color: estilo.color }}>
                  {estilo.signo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    <EmojiGlyph value={m.tipoOroEmoji} /> {m.tipoOroNombre}
                    {m.calidad ? ` (${m.calidad})` : ''}
                  </div>
                  <div className="truncate text-xs text-[var(--text-muted)]">
                    {[estilo.label, m.clienteNombre, m.metodo && etiquetaMetodo(m.metodo), m.nota, m.usuarioNombre, formatFechaHora(m.fecha)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="num shrink-0 text-right text-sm font-semibold" style={{ color: estilo.color }}>
                  {m.gramos > 0 ? '+' : ''}
                  {formatGramos(m.gramos)}
                </div>
              </div>
            )
          })}
        </List>
      </Section>
    </div>
  )
}
