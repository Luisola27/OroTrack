import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Deudor, Venta } from '../api/types'
import AbonoModal from '../components/AbonoModal'
import EstadoBadge from '../components/Badge'
import { DetallesVenta } from '../components/DetallesVenta'
import { ICONOS, Icon, List, PageHeader, Pill } from '../components/ui'
import { formatColones, formatFecha } from '../lib/format'

function severidad(dias: number): { tone: 'danger' | 'warn' | 'good'; label: string } {
  if (dias > 30) return { tone: 'danger', label: `${dias} días` }
  if (dias > 10) return { tone: 'warn', label: `${dias} días` }
  return { tone: 'good', label: dias === 0 ? 'hoy' : `${dias} día${dias === 1 ? '' : 's'}` }
}

export default function PorCobrar() {
  const [deudores, setDeudores] = useState<Deudor[]>([])
  const [abierto, setAbierto] = useState<number | null>(null)
  const [ventasCliente, setVentasCliente] = useState<Venta[]>([])
  const [abonando, setAbonando] = useState<Venta | null>(null)

  function cargar() {
    api.get<Deudor[]>('/ventas/deudores').then((r) => setDeudores(r.data))
  }

  function cargarVentas(clienteId: number) {
    api.get<Venta[]>('/ventas', { params: { clienteId, conSaldo: true } }).then((r) => setVentasCliente(r.data))
  }

  useEffect(cargar, [])

  function alternar(clienteId: number) {
    if (abierto === clienteId) {
      setAbierto(null)
      return
    }
    setAbierto(clienteId)
    setVentasCliente([])
    cargarVentas(clienteId)
  }

  const total = deudores.reduce((acc, d) => acc + d.saldoPendiente, 0)

  return (
    <div>
      <PageHeader
        title="Por cobrar"
        subtitle={
          deudores.length === 0 ? 'Nadie te debe nada.' : (
            <>
              {deudores.length} cliente(s) · <span className="num font-medium text-[var(--danger)]">{formatColones(total)}</span> en total · los más atrasados primero
            </>
          )
        }
      />

      <List isEmpty={deudores.length === 0} empty="No hay saldos pendientes. 🎉">
        {deudores.map((d) => {
          const sev = severidad(d.diasVencido)
          const estaAbierto = abierto === d.clienteId
          return (
            <div key={d.clienteId}>
              <button onClick={() => alternar(d.clienteId)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[var(--surface-2)]">
                <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: `var(--${sev.tone})` }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.clienteNombre}</div>
                  <div className="text-xs text-[var(--text-muted)]">Última venta fiada el {formatFecha(d.ultimaVentaFiada)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-sm font-semibold">{formatColones(d.saldoPendiente)}</div>
                  <Pill tone={sev.tone}>{sev.label}</Pill>
                </div>
                <span className="shrink-0 text-[var(--text-muted)] transition-transform" style={{ transform: estaAbierto ? 'rotate(90deg)' : undefined }}>
                  <Icon path={ICONOS.flecha} size={16} />
                </span>
              </button>

              {estaAbierto && (
                <div className="px-4 pb-4 pl-8" style={{ background: 'var(--surface-2)' }}>
                  {ventasCliente.length === 0 && <p className="py-3 text-sm text-[var(--text-muted)]">Cargando ventas…</p>}
                  {ventasCliente.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          Venta #{v.id} · {formatFecha(v.fecha)}
                        </div>
                        <DetallesVenta detalles={v.detalles} />
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-sm font-semibold text-[var(--danger)]">{formatColones(v.saldoPendiente)}</div>
                        <div className="num text-xs text-[var(--text-muted)]">de {formatColones(v.totalMonto)}</div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <button onClick={() => setAbonando(v)} className="btn btn-primary btn-sm">
                          Abonar
                        </button>
                        <EstadoBadge estado={v.estado} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </List>

      <AbonoModal
        key={abonando?.id ?? 0}
        venta={abonando}
        onClose={() => setAbonando(null)}
        onGuardado={() => {
          cargar()
          if (abierto) cargarVentas(abierto)
        }}
      />
    </div>
  )
}
