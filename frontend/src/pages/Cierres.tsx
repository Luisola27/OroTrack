import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { CajaResumen, Cierre, Usuario } from '../api/types'
import ResumenDinero from '../components/ResumenDinero'
import { IconDropdown, type IconOption } from '../components/IconDropdown'
import { ErrorBox, Field, List, MoneyInput, PageHeader, Pill, Section } from '../components/ui'
import { formatColones, formatFechaHora, mensajeError } from '../lib/format'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** input datetime-local siempre trabaja en hora local del navegador, nunca UTC. */
function aInputLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
}

/** El backend espera UTC; el input datetime-local no trae zona horaria, así que se interpreta como local y se convierte. */
function inputLocalAIso(valorLocal: string): string {
  return new Date(valorLocal).toISOString()
}

/** datetime-local no tiene segundos: sin esto, "Hasta" trunca al :00 y excluye ventas hechas
 * en ese mismo minuto pero con segundos > 0. Se redondea al final del minuto. */
function inputLocalAIsoFinDeMinuto(valorLocal: string): string {
  const fecha = new Date(valorLocal)
  fecha.setSeconds(59, 999)
  return fecha.toISOString()
}

export default function Cierres() {
  const [params] = useSearchParams()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [historial, setHistorial] = useState<Cierre[]>([])
  const [detalle, setDetalle] = useState<number | null>(null)

  const [usuarioId, setUsuarioId] = useState(params.get('usuario') ?? '')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState(aInputLocal(new Date()))
  const [efectivoContado, setEfectivoContado] = useState('')
  const [nota, setNota] = useState('')

  const [resumen, setResumen] = useState<CajaResumen | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cargarBase() {
    api.get<Usuario[]>('/usuarios').then((r) => setUsuarios(r.data.filter((u) => u.activo)))
    api.get<Cierre[]>('/cierres').then((r) => setHistorial(r.data))
  }

  useEffect(cargarBase, [])

  useEffect(() => {
    setResumen(null)
    if (!usuarioId) {
      setDesde('')
      return
    }
    api.get<string | null>('/cierres/ultimo', { params: { usuarioId } }).then((r) => {
      setDesde(r.data ? aInputLocal(new Date(r.data)) : '')
    })
  }, [usuarioId])

  async function calcular() {
    if (!usuarioId || !desde || !hasta) return
    setError(null)
    setCalculando(true)
    try {
      const { data } = await api.get<CajaResumen>('/cierres/resumen', {
        params: { usuarioId, desde: inputLocalAIso(desde), hasta: inputLocalAIsoFinDeMinuto(hasta) },
      })
      setResumen(data)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo calcular el resumen.'))
    } finally {
      setCalculando(false)
    }
  }

  async function confirmarCierre() {
    if (!resumen || !usuarioId) return
    if (!efectivoContado.trim()) {
      setError('Cuenta el efectivo físico e ingrésalo antes de cerrar.')
      return
    }
    setError(null)
    setGuardando(true)
    try {
      await api.post('/cierres', {
        usuarioId,
        desde: inputLocalAIso(desde),
        hasta: inputLocalAIsoFinDeMinuto(hasta),
        efectivoContado: Number(efectivoContado) || 0,
        nota: nota || null,
      })
      setResumen(null)
      setEfectivoContado('')
      setNota('')
      cargarBase()
      setDesde(hasta)
      setHasta(aInputLocal(new Date()))
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el cierre.'))
    } finally {
      setGuardando(false)
    }
  }

  const diferencia = (Number(efectivoContado) || 0) - (resumen?.efectivoEsperado ?? 0)
  const hayContado = efectivoContado.trim() !== ''

  return (
    <div>
      <PageHeader title="Cierres de caja" subtitle="Compara el efectivo que debería haber contra el que realmente hay" />

      <div className="mb-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card self-start p-5">
          <h2 className="mb-4 text-sm font-semibold">1. Período a cerrar</h2>
          <Field label="Caja de">
            <IconDropdown
              value={usuarioId}
              onChange={setUsuarioId}
              placeholder="Selecciona…"
              options={usuarios.map((u): IconOption<string> => ({ value: u.id, label: `${u.nombreCompleto} · ${u.rol === 'Admin' ? 'Admin' : 'Vendedor'}` }))}
            />
          </Field>
          <Field label="Desde" hint={usuarioId && !desde ? 'Primer cierre: elige desde cuándo contar.' : 'Arranca donde terminó el último cierre.'}>
            <input type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} className="input" />
          </Field>
          <Field label="Hasta">
            <input type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input" />
          </Field>
          <button onClick={calcular} disabled={!usuarioId || !desde || calculando} className="btn btn-secondary w-full">
            {calculando ? 'Calculando…' : 'Calcular'}
          </button>
          {!resumen && <ErrorBox>{error}</ErrorBox>}
        </div>

        {resumen ? (
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold">2. Resumen del período</h2>
            <ResumenDinero r={resumen} mostrarGanancia />

            <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--border-soft)' }}>
              <h2 className="mb-4 text-sm font-semibold">3. Cuenta el efectivo</h2>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="Efectivo contado (físico)" required>
                  <MoneyInput value={efectivoContado} onChange={setEfectivoContado} large />
                </Field>
                <div className="mb-4 flex flex-col justify-end">
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background: !hayContado ? 'var(--surface-2)' : diferencia === 0 ? 'var(--good-soft)' : 'var(--danger-soft)',
                      color: !hayContado ? 'var(--text-muted)' : diferencia === 0 ? 'var(--good)' : 'var(--danger)',
                    }}
                  >
                    <span className="text-sm font-semibold">{!hayContado ? 'Diferencia' : diferencia === 0 ? 'Cuadra exacto' : diferencia > 0 ? 'Sobra' : 'Falta'}</span>
                    <span className="num text-lg font-semibold">{hayContado ? formatColones(Math.abs(diferencia)) : '—'}</span>
                  </div>
                </div>
              </div>
              <Field label="Nota (opcional)" hint={hayContado && diferencia !== 0 ? 'Si no cuadra, anota la razón.' : undefined}>
                <input value={nota} onChange={(e) => setNota(e.target.value)} className="input" />
              </Field>
              <ErrorBox>{error}</ErrorBox>
              <button onClick={confirmarCierre} disabled={guardando} className="btn btn-primary btn-lg w-full">
                {guardando ? 'Guardando…' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card hidden items-center justify-center p-10 text-center text-sm text-[var(--text-muted)] lg:flex">
            Elige la caja y el período, y presiona “Calcular” para ver cuánto debería haber.
          </div>
        )}
      </div>

      <Section title="Historial">
        <List isEmpty={historial.length === 0} empty="Aún no hay cierres.">
          {historial.map((c) => {
            const abierto = detalle === c.id
            return (
              <div key={c.id}>
                <button onClick={() => setDetalle(abierto ? null : c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)]">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.usuarioNombre}</div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                      {formatFechaHora(c.desde)} → {formatFechaHora(c.hasta)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-sm font-semibold">{formatColones(c.efectivoContado)}</div>
                    <Pill tone={c.diferencia === 0 ? 'good' : 'danger'}>
                      {c.diferencia === 0 ? 'Cuadrado' : c.diferencia > 0 ? `Sobra ${formatColones(c.diferencia)}` : `Falta ${formatColones(Math.abs(c.diferencia))}`}
                    </Pill>
                  </div>
                </button>
                {abierto && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 pb-4 text-sm sm:grid-cols-4" style={{ background: 'var(--surface-2)' }}>
                    <Mini label="Vendido" value={formatColones(c.totalVendido)} />
                    <Mini label="Fiado otorgado" value={formatColones(c.totalFiadoOtorgado)} />
                    <Mini label="Costo material vendido" value={formatColones(c.costoMaterialVendido)} />
                    <Mini label="Ganancia bruta" value={formatColones(c.totalVendido - c.costoMaterialVendido)} />
                    <Mini label="Cobrado en efectivo" value={formatColones(c.efectivoVentas)} />
                    <Mini label="Material pagado de la caja" value={`−${formatColones(c.efectivoCompras)}`} />
                    <Mini label="Entradas / salidas" value={`+${formatColones(c.efectivoEntradas)} / −${formatColones(c.efectivoSalidas)}`} />
                    <Mini label="Efectivo esperado" value={formatColones(c.efectivoEsperado)} />
                    {c.comprasConCapital > 0 && <Mini label="Compras con capital aparte" value={formatColones(c.comprasConCapital)} />}
                    <div className="col-span-full pt-1 text-xs text-[var(--text-muted)]">
                      Cerrado por {c.cerradoPorNombre} · {formatFechaHora(c.fechaCierre)}
                      {c.nota && <> · “{c.nota}”</>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </List>
      </Section>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="num font-medium">{value}</div>
    </div>
  )
}
