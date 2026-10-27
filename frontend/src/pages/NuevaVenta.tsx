import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Cliente, Contenedor, MetodoPago, TipoPago } from '../api/types'
import { METODOS_PAGO } from '../api/types'
import { ordenarPorQuilate } from '../constants/quilates'
import { EmojiGlyph } from '../components/EmojiGlyph'
import { IconDropdown, type IconOption } from '../components/IconDropdown'
import { ErrorBox, Field, Modal, MoneyInput, PageHeader, Segmented } from '../components/ui'
import { formatColones, formatGramos, mensajeError } from '../lib/format'
import { montoALetras } from '../lib/numeroALetras'

interface Errores {
  cliente?: string
  contenedor?: string
  gramos?: string
  monto?: string
  metodo?: string
}

const MONTOS_RAPIDOS = [5000, 10000, 20000]

const UNIDADES_GRAMOS = [
  { label: '½ 8', gramos: 1.75 },
  { label: '8', gramos: 3.5 },
  { label: 'M', gramos: 14 },
  { label: 'Z', gramos: 28 },
]

function sumarValor(actual: number, agregar: number): string {
  return parseFloat((actual + agregar).toFixed(3)).toString()
}

export default function NuevaVenta() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contenedores, setContenedores] = useState<Contenedor[]>([])

  const [clienteId, setClienteId] = useState<number | null>(null)
  const [contenedorId, setContenedorId] = useState<number | null>(null)
  const [gramos, setGramos] = useState('')
  const [monto, setMonto] = useState('')
  const [tipoPago, setTipoPago] = useState<TipoPago>('Contado')
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  const [nuevoCliente, setNuevoCliente] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [errorNombreNuevo, setErrorNombreNuevo] = useState<string | undefined>()

  useEffect(() => {
    api.get<Cliente[]>('/clientes').then((r) => setClientes(r.data))
    api.get<Contenedor[]>('/contenedores').then((r) => setContenedores(r.data.filter((c) => c.activo)))
  }, [])

  function limpiarError(campo: keyof Errores) {
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function crearCliente() {
    if (!nombreNuevo.trim()) {
      setErrorNombreNuevo('El nombre es obligatorio.')
      return
    }
    const { data } = await api.post<Cliente>('/clientes', { nombre: nombreNuevo, telefono: telefonoNuevo || null })
    setClientes((prev) => [...prev, data])
    setClienteId(data.id)
    setNuevoCliente(false)
    setNombreNuevo('')
    setTelefonoNuevo('')
    setErrorNombreNuevo(undefined)
    limpiarError('cliente')
  }

  const contenedor = contenedores.find((c) => c.id === contenedorId)
  const gramosNum = Number(gramos) || 0
  const montoNum = Number(monto) || 0
  const precioImplicito = gramosNum > 0 ? montoNum / gramosNum : 0
  const pasos = [!!clienteId, !!contenedorId, gramosNum > 0 && montoNum > 0, tipoPago === 'Fiado' || !!metodoPago]
  const pasosCompletos = pasos.filter(Boolean).length

  function validar(): boolean {
    const e: Errores = {}
    if (!clienteId) e.cliente = 'Selecciona un cliente.'
    if (!contenedorId) e.contenedor = 'Selecciona un lote.'
    if (!gramos.trim()) e.gramos = 'Ingresa los gramos a vender.'
    else if (gramosNum <= 0) e.gramos = 'Los gramos deben ser mayores a cero.'
    else if (contenedor && gramosNum > contenedor.pesoDisponibleGramos)
      e.gramos = `Solo hay ${formatGramos(contenedor.pesoDisponibleGramos)} disponibles en este lote.`
    if (!monto.trim()) e.monto = 'Ingresa el monto a cobrar.'
    else if (montoNum <= 0) e.monto = 'Debe ser mayor a cero.'
    if (tipoPago === 'Contado' && !metodoPago) e.metodo = 'Selecciona cómo se pagó.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function confirmar() {
    setError(null)
    if (!validar()) return
    setEnviando(true)
    try {
      await api.post('/ventas', {
        clienteId,
        contenedorId,
        gramos: gramosNum,
        precioGramo: precioImplicito,
        tipoPago,
        metodo: tipoPago === 'Contado' ? metodoPago : null,
      })
      navigate('/ventas')
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar la venta.'))
    } finally {
      setEnviando(false)
    }
  }

  const cliente = clientes.find((c) => c.id === clienteId)

  return (
    <div>
      <PageHeader title="Nueva venta" subtitle="Se registra a tu nombre y el cobro entra a tu caja" />

      <div className="mb-6 flex gap-1.5">
        {pasos.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i < pasosCompletos ? 'var(--accent)' : 'var(--border)' }} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card p-5 md:p-6">
          <Field label="Cliente" required error={errores.cliente}>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <IconDropdown
                  searchable
                  value={clienteId ? String(clienteId) : ''}
                  onChange={(v) => {
                    setClienteId(Number(v))
                    limpiarError('cliente')
                  }}
                  placeholder="Buscar o seleccionar cliente…"
                  error={!!errores.cliente}
                  emptyText="Ningún cliente coincide. Créalo con “Nuevo”."
                  options={clientes.map(
                    (c): IconOption<string> => ({
                      value: String(c.id),
                      searchText: `${c.nombre} ${c.identificacion ?? ''} ${c.telefono ?? ''}`,
                      label: (
                        <span className="flex w-full justify-between gap-2">
                          <span className="truncate">{c.nombre}</span>
                          {c.saldoPendiente > 0 && <span className="num shrink-0 text-xs text-[var(--danger)]">debe {formatColones(c.saldoPendiente)}</span>}
                        </span>
                      ),
                    }),
                  )}
                />
              </div>
              <button type="button" onClick={() => setNuevoCliente(true)} className="btn btn-secondary">
                + Nuevo
              </button>
            </div>
          </Field>

          <Field
            label="Lote de origen"
            required
            error={errores.contenedor}
            hint={contenedor && `Costo del lote: ${formatColones(contenedor.costoPorGramo, 2)}/g — solo de referencia, puedes vender a lo que negocies.`}
          >
            <IconDropdown
              value={contenedorId ? String(contenedorId) : ''}
              onChange={(v) => {
                setContenedorId(Number(v))
                setGramos('')
                limpiarError('contenedor')
              }}
              placeholder="Selecciona un lote…"
              error={!!errores.contenedor}
              emptyText="No hay lotes con material disponible."
              options={ordenarPorQuilate(contenedores.filter((c) => c.pesoDisponibleGramos > 0)).map(
                (c): IconOption<string> => ({
                  value: String(c.id),
                  label: (
                    <span className="flex w-full justify-between gap-2">
                      <span>
                        <EmojiGlyph value={c.tipoOro.emoji} /> {c.tipoOro.nombre}
                        {c.calidad ? ` (${c.calidad})` : ''}
                      </span>
                      <span className="num shrink-0 text-xs text-[var(--text-muted)]">{formatGramos(c.pesoDisponibleGramos)} disp.</span>
                    </span>
                  ),
                }),
              )}
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Gramos a vender" required error={errores.gramos}>
              <div className="relative">
                <input
                  value={gramos}
                  onChange={(e) => {
                    setGramos(e.target.value)
                    limpiarError('gramos')
                  }}
                  inputMode="decimal"
                  placeholder="0"
                  aria-invalid={!!errores.gramos}
                  className="input num py-3 pr-16 text-lg font-semibold"
                />
                {gramosNum > 0 && (
                  <button type="button" onClick={() => setGramos('')} className="btn btn-ghost btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">
                    Limpiar
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {UNIDADES_GRAMOS.map((u) => (
                  <button
                    key={u.label}
                    type="button"
                    onClick={() => {
                      setGramos(sumarValor(gramosNum, u.gramos))
                      limpiarError('gramos')
                    }}
                    className="chip"
                    title={`+${u.gramos} g`}
                  >
                    <b className="text-[var(--text)]">{u.label}</b> +{u.gramos}g
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Monto a cobrar" required error={errores.monto} hint={montoNum > 0 ? montoALetras(montoNum) : undefined}>
              <div className="relative">
                <MoneyInput value={monto} onChange={(v) => { setMonto(v); limpiarError('monto') }} invalid={!!errores.monto} large />
                {montoNum > 0 && (
                  <button type="button" onClick={() => setMonto('')} className="btn btn-ghost btn-sm absolute right-1.5 top-1/2 -translate-y-1/2">
                    Limpiar
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MONTOS_RAPIDOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMonto(sumarValor(montoNum, m))
                      limpiarError('monto')
                    }}
                    className="chip"
                  >
                    +{m / 1000} mil
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Tipo de pago" required>
            <Segmented
              value={tipoPago}
              onChange={(t) => {
                setTipoPago(t)
                limpiarError('metodo')
              }}
              options={[
                { value: 'Contado', label: 'Contado' },
                { value: 'Fiado', label: 'Fiado' },
              ]}
            />
          </Field>

          {tipoPago === 'Contado' && (
            <Field label="¿Cómo pagó?" required error={errores.metodo} className="mb-0">
              <IconDropdown
                value={metodoPago}
                onChange={(v) => {
                  setMetodoPago(v)
                  limpiarError('metodo')
                }}
                placeholder="Selecciona…"
                error={!!errores.metodo}
                options={METODOS_PAGO.map((m): IconOption<MetodoPago> => ({ value: m.value, label: m.label }))}
              />
            </Field>
          )}
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold">Resumen</h2>
            <Row label="Cliente" value={cliente?.nombre ?? '—'} />
            <Row label="Lote" value={contenedor ? `${contenedor.tipoOro.nombre}${contenedor.calidad ? ` (${contenedor.calidad})` : ''}` : '—'} />
            <Row label="Gramos" value={formatGramos(gramosNum)} />
            <Row label="≈ Precio por gramo" value={precioImplicito > 0 ? formatColones(precioImplicito, 2) : '—'} />
            <Row label="Pago" value={tipoPago === 'Fiado' ? 'Fiado' : METODOS_PAGO.find((m) => m.value === metodoPago)?.label ?? 'Contado'} />
            <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="text-xs text-[var(--text-muted)]">Total a cobrar</div>
              <div className="num text-2xl font-semibold">{formatColones(montoNum, 2)}</div>
              {montoNum > 0 && <p className="mt-1 text-xs text-[var(--text-muted)]">{montoALetras(montoNum)}</p>}
            </div>

            <div className="mt-5">
              <ErrorBox>{error}</ErrorBox>
              <button onClick={confirmar} disabled={enviando} className="btn btn-primary btn-lg w-full">
                {enviando ? 'Confirmando…' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={nuevoCliente}
        onClose={() => {
          setNuevoCliente(false)
          setErrorNombreNuevo(undefined)
        }}
        title="Nuevo cliente"
      >
        <Field label="Nombre" required error={errorNombreNuevo}>
          <input
            autoFocus
            value={nombreNuevo}
            onChange={(e) => {
              setNombreNuevo(e.target.value)
              setErrorNombreNuevo(undefined)
            }}
            aria-invalid={!!errorNombreNuevo}
            className="input"
          />
        </Field>
        <Field label="Teléfono (opcional)">
          <input value={telefonoNuevo} onChange={(e) => setTelefonoNuevo(e.target.value)} inputMode="tel" className="input" />
        </Field>
        <button onClick={crearCliente} className="btn btn-primary btn-lg w-full">
          Guardar cliente
        </button>
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="num truncate text-right font-medium">{value}</span>
    </div>
  )
}
