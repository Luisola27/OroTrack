import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Venta } from '../api/types'
import EstadoBadge from '../components/Badge'
import AbonoModal from '../components/AbonoModal'
import { DetallesVenta } from '../components/DetallesVenta'
import { Avatar, Chips, List, PageHeader } from '../components/ui'
import { formatColones, formatFechaHora, inicioDelDiaISO } from '../lib/format'

const FILTROS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Últimos 7 días' },
  { value: 'mes', label: 'Últimos 30 días' },
  { value: 'todas', label: 'Todas' },
  { value: 'fiado', label: 'Solo fiado' },
  { value: 'saldo', label: 'Con saldo pendiente' },
] as const

type Filtro = (typeof FILTROS)[number]['value']

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [buscar, setBuscar] = useState('')
  const [abonando, setAbonando] = useState<Venta | null>(null)

  const cargar = useCallback(() => {
    const params: Record<string, string> = {}
    if (filtro === 'hoy') params.desde = inicioDelDiaISO()
    if (filtro === 'semana') params.desde = inicioDelDiaISO(7)
    if (filtro === 'mes') params.desde = inicioDelDiaISO(30)
    if (filtro === 'fiado') params.soloFiado = 'true'
    if (filtro === 'saldo') params.conSaldo = 'true'
    api.get<Venta[]>('/ventas', { params }).then((r) => setVentas(r.data))
  }, [filtro])

  useEffect(cargar, [cargar])

  const q = buscar.trim().toLowerCase()
  const visibles = q ? ventas.filter((v) => v.clienteNombre.toLowerCase().includes(q)) : ventas
  const total = visibles.reduce((acc, v) => acc + v.totalMonto, 0)
  const pendiente = visibles.reduce((acc, v) => acc + v.saldoPendiente, 0)

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle={
          <>
            {visibles.length} venta(s) · <span className="num">{formatColones(total)}</span>
            {pendiente > 0 && (
              <>
                {' '}· <span className="num text-[var(--danger)]">{formatColones(pendiente)} por cobrar</span>
              </>
            )}
          </>
        }
        actions={
          <Link to="/ventas/nueva" className="btn btn-primary">
            + Nueva venta
          </Link>
        }
      />

      <div className="mb-3">
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por cliente…" className="input max-w-sm" />
      </div>
      <div className="mb-4">
        <Chips value={filtro} onChange={setFiltro} options={[...FILTROS]} />
      </div>

      <List isEmpty={visibles.length === 0} empty="Sin ventas para este filtro.">
        {visibles.map((v) => (
          <div key={v.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar nombre={v.clienteNombre} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{v.clienteNombre}</div>
              <DetallesVenta detalles={v.detalles} />
              <div className="text-xs text-[var(--text-muted)]">
                #{v.id} · {formatFechaHora(v.fecha)} · {v.vendedorNombre}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="num text-sm font-semibold">{formatColones(v.totalMonto)}</div>
              {v.saldoPendiente > 0 && v.saldoPendiente < v.totalMonto && (
                <div className="num text-xs text-[var(--danger)]">debe {formatColones(v.saldoPendiente)}</div>
              )}
              <div className="mt-1 flex items-center justify-end gap-2">
                {v.saldoPendiente > 0 && (
                  <button onClick={() => setAbonando(v)} className="btn btn-secondary btn-sm">
                    Abonar
                  </button>
                )}
                <EstadoBadge estado={v.estado} />
              </div>
            </div>
          </div>
        ))}
      </List>

      <AbonoModal key={abonando?.id ?? 0} venta={abonando} onClose={() => setAbonando(null)} onGuardado={cargar} />
    </div>
  )
}
