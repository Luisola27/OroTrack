import type { CajaResumen } from '../api/types'
import { etiquetaMetodo } from '../api/types'
import { formatColones, formatGramos } from '../lib/format'
import { Notice } from './ui'

/** Desglose del dinero de una caja: ventas, cómo entró y salió el dinero, y el efectivo esperado. */
export default function ResumenDinero({ r, mostrarGanancia }: { r: CajaResumen; mostrarGanancia: boolean }) {
  const efectivo = r.porMetodo.find((m) => m.metodo === 'Efectivo')!
  const metodosConMovimiento = r.porMetodo.filter((m) => m.cobrado || m.compras || m.entradas || m.salidas)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        <Dato label="Vendido" value={formatColones(r.totalVendido)} />
        <Dato label="Gramos vendidos" value={formatGramos(r.totalGramosVendido)} />
        <Dato label="Fiado otorgado" value={formatColones(r.totalFiadoOtorgado)} tone={r.totalFiadoOtorgado > 0 ? 'danger' : undefined} />
        <Dato label="Cobrado (contado + abonos)" value={formatColones(r.totalCobrado)} tone="good" />
        {mostrarGanancia && (
          <>
            <Dato label="Costo del material vendido" value={formatColones(r.costoMaterialVendido)} />
            <Dato label="Ganancia bruta" value={formatColones(r.gananciaBruta)} tone={r.gananciaBruta >= 0 ? 'accent' : 'danger'} />
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Efectivo esperado en caja</h3>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
          <Linea label="Cobrado en efectivo" value={efectivo.cobrado} signo="+" />
          <Linea label="Material comprado con efectivo de la caja" value={efectivo.compras} signo="−" />
          <Linea label="Entradas de efectivo (fondo, sencillo)" value={efectivo.entradas} signo="+" />
          <Linea label="Retiros y gastos en efectivo" value={efectivo.salidas} signo="−" />
          <div className="mt-2 flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold">Debería haber</span>
            <span className="num text-lg font-semibold" style={{ color: r.efectivoEsperado < 0 ? 'var(--danger)' : 'var(--text)' }}>
              {formatColones(r.efectivoEsperado)}
            </span>
          </div>
        </div>
        {r.efectivoEsperado < 0 && (
          <div className="mt-2">
            <Notice tone="warn">
              Salió más efectivo del que entró. Probablemente se compró material con plata que no estaba en esta caja: revisa si esa compra debió
              registrarse como <b>capital aparte</b> o a la caja de otra persona.
            </Notice>
          </div>
        )}
      </div>

      {metodosConMovimiento.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Dinero por método de pago</h3>
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="num w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)]">
                  <th className="py-1.5 font-medium">Método</th>
                  <th className="py-1.5 text-right font-medium">Cobrado</th>
                  <th className="py-1.5 text-right font-medium">Compras</th>
                  <th className="py-1.5 text-right font-medium">Entradas</th>
                  <th className="py-1.5 text-right font-medium">Salidas</th>
                  <th className="py-1.5 text-right font-medium">Neto</th>
                </tr>
              </thead>
              <tbody>
                {metodosConMovimiento.map((m) => (
                  <tr key={m.metodo} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    <td className="py-2">{etiquetaMetodo(m.metodo)}</td>
                    <td className="py-2 text-right">{formatColones(m.cobrado)}</td>
                    <td className="py-2 text-right" style={{ color: m.compras ? 'var(--danger)' : undefined }}>{m.compras ? `−${formatColones(m.compras)}` : '—'}</td>
                    <td className="py-2 text-right">{m.entradas ? formatColones(m.entradas) : '—'}</td>
                    <td className="py-2 text-right" style={{ color: m.salidas ? 'var(--danger)' : undefined }}>{m.salidas ? `−${formatColones(m.salidas)}` : '—'}</td>
                    <td className="py-2 text-right font-semibold">{formatColones(m.neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {r.comprasConCapital > 0 && (
        <Notice>
          Además se compró <b className="num">{formatColones(r.comprasConCapital)}</b> de material con capital aparte. No afecta la caja.
        </Notice>
      )}
    </div>
  )
}

function Dato({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'danger' | 'accent' }) {
  return (
    <div className="py-1.5">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="num font-semibold" style={{ color: tone ? `var(--${tone})` : undefined }}>
        {value}
      </div>
    </div>
  )
}

function Linea({ label, value, signo }: { label: string; value: number; signo: '+' | '−' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="num" style={{ color: signo === '−' && value > 0 ? 'var(--danger)' : undefined }}>
        {value > 0 ? `${signo} ` : ''}
        {formatColones(value)}
      </span>
    </div>
  )
}
