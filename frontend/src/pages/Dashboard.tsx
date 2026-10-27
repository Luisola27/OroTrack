import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CajaEstado, Contenedor, Resumen, Venta } from '../api/types'
import { ordenarPorQuilate } from '../constants/quilates'
import { useAuth } from '../context/AuthContext'
import { QuilateBadge } from '../components/QuilateBadge'
import { EmojiGlyph } from '../components/EmojiGlyph'
import { DetallesVenta } from '../components/DetallesVenta'
import EstadoBadge from '../components/Badge'
import { Avatar, ICONOS, Icon, List, PageHeader, Progress, Section, Stat } from '../components/ui'
import { formatColones, formatFecha, formatFechaHora, formatGramos, inicioDelDiaISO } from '../lib/format'

export default function Dashboard() {
  const { nombreCompleto, esAdmin } = useAuth()
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [lotesBajos, setLotesBajos] = useState<Contenedor[]>([])
  const [caja, setCaja] = useState<CajaEstado | null>(null)

  useEffect(() => {
    api.get<Resumen>('/reportes/resumen', { params: { desde: inicioDelDiaISO() } }).then((r) => setResumen(r.data))
    api.get<Venta[]>('/ventas').then((r) => setVentas(r.data.slice(0, 6)))
    api.get<Contenedor[]>('/contenedores').then((r) =>
      setLotesBajos(r.data.filter((c) => c.activo && c.pesoTotalGramos > 0 && c.pesoDisponibleGramos / c.pesoTotalGramos < 0.25)),
    )
    api.get<CajaEstado>('/caja/estado').then((r) => setCaja(r.data))
  }, [])

  const primerNombre = (nombreCompleto ?? '').split(' ')[0]
  const fecha = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoy = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  return (
    <div>
      <PageHeader title={`Hola, ${primerNombre}`} subtitle={hoy} />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vendido hoy" value={formatColones(resumen?.totalMontoVendido ?? 0)} hint={`${resumen?.totalVentas ?? 0} venta(s)`} />
        <Stat label="Cobrado hoy" value={formatColones(resumen?.totalCobrado ?? 0)} tone="good" hint="contado + abonos" />
        <Stat label="Fiado hoy" value={formatColones(resumen?.totalFiado ?? 0)} tone={resumen?.totalFiado ? 'danger' : undefined} />
        {esAdmin ? (
          <Stat label="Ganancia hoy" value={formatColones(resumen?.ganancia ?? 0)} tone="accent" hint="vendido − costo del material" />
        ) : (
          <Stat label="Gramos vendidos" value={formatGramos(resumen?.totalGramosVendidos ?? 0)} />
        )}
      </div>

      {caja && (
        <Link to="/caja" className="card mb-8 flex items-center gap-4 p-4 transition-colors hover:border-[var(--border)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icon path={ICONOS.caja} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[var(--text-muted)]">Efectivo que deberías tener en tu caja</div>
            <div className="num text-lg font-semibold">{formatColones(caja.resumen.efectivoEsperado)}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {caja.ultimoCierre ? `desde el cierre del ${formatFecha(caja.ultimoCierre)}` : 'aún no tienes cierres'}
            </div>
          </div>
          <Icon path={ICONOS.flecha} />
        </Link>
      )}

      {resumen && resumen.porTipo.length > 0 && (
        <Section title="Vendido hoy por tipo de oro">
          <List>
            {resumen.porTipo.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <EmojiGlyph value={p.emoji} /> {p.nombre}
                  {p.calidad ? ` (${p.calidad})` : ''}
                </span>
                <span className="num text-right">
                  <span className="text-[var(--text-muted)]">{formatGramos(p.gramos)}</span>
                  <span className="ml-3 font-semibold">{formatColones(p.monto)}</span>
                </span>
              </div>
            ))}
          </List>
        </Section>
      )}

      <Section title="Ventas recientes" action={<Link to="/ventas" className="link text-sm">Ver todas</Link>}>
        <List isEmpty={ventas.length === 0} empty="Aún no hay ventas registradas.">
          {ventas.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar nombre={v.clienteNombre} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{v.clienteNombre}</div>
                <DetallesVenta detalles={v.detalles} />
                <div className="text-xs text-[var(--text-muted)]">
                  {formatFechaHora(v.fecha)} · {v.vendedorNombre}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="num text-sm font-semibold">{formatColones(v.totalMonto)}</div>
                <div className="mt-1">
                  <EstadoBadge estado={v.estado} />
                </div>
              </div>
            </div>
          ))}
        </List>
      </Section>

      {lotesBajos.length > 0 && (
        <Section title="Lotes por acabarse" action={<Link to="/lotes" className="link text-sm">Ver lotes</Link>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {ordenarPorQuilate(lotesBajos).map((c) => (
              <div key={c.id} className="card p-4">
                <div className="mb-3 flex items-center justify-between text-sm font-medium">
                  <span><QuilateBadge tipoOro={c.tipoOro} />{c.calidad ? ` (${c.calidad})` : ''}</span>
                  <span className="num text-[var(--warn)]">{formatGramos(c.pesoDisponibleGramos)}</span>
                </div>
                <Progress value={c.pesoDisponibleGramos / c.pesoTotalGramos} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
