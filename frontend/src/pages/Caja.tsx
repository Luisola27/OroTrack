import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { CajaEstado, CajaMovimiento, MetodoPago, TipoMovimientoCaja } from '../api/types'
import { METODOS_PAGO, TIPOS_MOVIMIENTO_CAJA, etiquetaMetodo } from '../api/types'
import { useAuth } from '../context/AuthContext'
import ResumenDinero from '../components/ResumenDinero'
import { IconDropdown, type IconOption } from '../components/IconDropdown'
import { ErrorBox, Field, List, Modal, MoneyInput, Notice, PageHeader, Pill, Section, Segmented } from '../components/ui'
import { formatColones, formatFecha, formatFechaHora, mensajeError } from '../lib/format'

/**
 * Caja = el dinero que cada persona tiene en su poder desde su último cierre.
 * El vendedor ve solo la suya; el admin ve la de todos y registra entradas, retiros y gastos.
 */
export default function Caja() {
  const { esAdmin, usuarioId } = useAuth()
  const [cajas, setCajas] = useState<CajaEstado[]>([])
  const [seleccionId, setSeleccionId] = useState<string | null>(usuarioId)
  const [estado, setEstado] = useState<CajaEstado | null>(null)
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([])
  const [registrando, setRegistrando] = useState(false)

  const cargar = useCallback(() => {
    if (esAdmin) api.get<CajaEstado[]>('/caja/general').then((r) => setCajas(r.data))
    if (!seleccionId) return
    api.get<CajaEstado>('/caja/estado', { params: { usuarioId: seleccionId } }).then((r) => {
      setEstado(r.data)
      api
        .get<CajaMovimiento[]>('/caja/movimientos', { params: { usuarioId: seleccionId, desde: r.data.ultimoCierre ?? undefined } })
        .then((m) => setMovimientos(m.data))
    })
  }, [esAdmin, seleccionId])

  useEffect(cargar, [cargar])

  const totalEnCajas = cajas.reduce((acc, c) => acc + c.resumen.efectivoEsperado, 0)
  const esMia = estado?.usuarioId === usuarioId

  return (
    <div>
      <PageHeader
        title={esAdmin ? 'Caja' : 'Mi caja'}
        subtitle={
          esAdmin ? (
            <>
              Efectivo que debería tener cada persona desde su último cierre · total <span className="num font-medium">{formatColones(totalEnCajas)}</span>
            </>
          ) : (
            'El efectivo que deberías tener desde tu último cierre'
          )
        }
        actions={
          esAdmin && (
            <button onClick={() => setRegistrando(true)} className="btn btn-secondary">
              Entrada / retiro / gasto
            </button>
          )
        }
      />

      {esAdmin && cajas.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cajas.map((c) => {
            const activa = c.usuarioId === seleccionId
            return (
              <button
                key={c.usuarioId}
                onClick={() => setSeleccionId(c.usuarioId)}
                className="card p-4 text-left transition-colors"
                style={activa ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : undefined}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {c.usuarioNombre}
                    {c.usuarioId === usuarioId && <span className="text-[var(--text-muted)]"> (yo)</span>}
                  </span>
                  <Pill>{c.rol === 'Admin' ? 'Admin' : 'Vendedor'}</Pill>
                </div>
                <div className="num text-xl font-semibold" style={{ color: c.resumen.efectivoEsperado < 0 ? 'var(--danger)' : undefined }}>
                  {formatColones(c.resumen.efectivoEsperado)}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {c.ultimoCierre ? `desde el cierre del ${formatFecha(c.ultimoCierre)}` : 'sin cierres todavía'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {estado && (
        <>
          <Section
            title={esAdmin ? `Caja de ${estado.usuarioNombre}` : 'Resumen'}
            action={
              esAdmin && (
                <Link to={`/cierres?usuario=${estado.usuarioId}`} className="btn btn-primary btn-sm">
                  Hacer cierre
                </Link>
              )
            }
          >
            <div className="card p-5">
              <p className="mb-4 text-xs text-[var(--text-muted)]">
                Período: {estado.ultimoCierre ? `desde ${formatFechaHora(estado.ultimoCierre)}` : 'desde el inicio'} hasta ahora
              </p>
              <ResumenDinero r={estado.resumen} mostrarGanancia={esAdmin} />
            </div>
          </Section>

          <Section title="Movimientos de dinero del período">
            <List isEmpty={movimientos.length === 0} empty={esMia ? 'Aún no tienes movimientos desde tu último cierre.' : 'Sin movimientos desde el último cierre.'}>
              {movimientos.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {m.tipo}
                      {!m.afectaCaja && <Pill>capital aparte</Pill>}
                    </div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                      {[m.descripcion, m.metodo && etiquetaMetodo(m.metodo), m.nota, formatFechaHora(m.fecha)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div
                    className="num shrink-0 text-sm font-semibold"
                    style={{ color: !m.afectaCaja ? 'var(--text-muted)' : m.monto < 0 ? 'var(--danger)' : 'var(--good)' }}
                  >
                    {m.monto > 0 ? '+' : '−'}
                    {formatColones(Math.abs(m.monto))}
                  </div>
                </div>
              ))}
            </List>
          </Section>
        </>
      )}

      {esAdmin && (
        <RegistrarMovimiento
          key={registrando ? `abierto-${seleccionId}` : 'cerrado'}
          abierto={registrando}
          onClose={() => setRegistrando(false)}
          cajas={cajas}
          responsableInicial={seleccionId ?? ''}
          onGuardado={cargar}
        />
      )}
    </div>
  )
}

function RegistrarMovimiento({
  abierto,
  onClose,
  cajas,
  responsableInicial,
  onGuardado,
}: {
  abierto: boolean
  onClose: () => void
  cajas: CajaEstado[]
  responsableInicial: string
  onGuardado: () => void
}) {
  const [tipo, setTipo] = useState<TipoMovimientoCaja>('Retiro')
  const [responsable, setResponsable] = useState(responsableInicial)
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo')
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function guardar() {
    const montoNum = Number(monto) || 0
    if (!responsable) return setError('Selecciona de quién es la caja.')
    if (montoNum <= 0) return setError('Ingresa un monto mayor a cero.')
    if (tipo === 'Gasto' && !nota.trim()) return setError('Escribe en qué se gastó.')
    setEnviando(true)
    setError(null)
    try {
      await api.post('/caja/movimientos', { responsableUsuarioId: responsable, tipo, metodo, monto: montoNum, nota: nota || null })
      onGuardado()
      onClose()
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el movimiento.'))
    } finally {
      setEnviando(false)
    }
  }

  const info = TIPOS_MOVIMIENTO_CAJA.find((t) => t.value === tipo)!

  return (
    <Modal open={abierto} onClose={onClose} title="Movimiento de caja" subtitle="Dinero que entra o sale sin ser una venta ni una compra de material">
      <Field label="Tipo" hint={info.ayuda}>
        <Segmented value={tipo} onChange={setTipo} options={TIPOS_MOVIMIENTO_CAJA.map((t) => ({ value: t.value, label: t.label }))} />
      </Field>
      <Field label="Caja de" required>
        <IconDropdown
          value={responsable}
          onChange={setResponsable}
          placeholder="Selecciona…"
          options={cajas.map((c): IconOption<string> => ({ value: c.usuarioId, label: c.usuarioNombre }))}
        />
      </Field>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Field label="Monto" required>
          <MoneyInput value={monto} onChange={setMonto} />
        </Field>
        <Field label="Método">
          <IconDropdown
            value={metodo}
            onChange={setMetodo}
            placeholder="Selecciona…"
            options={METODOS_PAGO.map((m): IconOption<MetodoPago> => ({ value: m.value, label: m.label }))}
          />
        </Field>
      </div>
      <Field label={tipo === 'Gasto' ? '¿En qué se gastó?' : 'Nota (opcional)'} required={tipo === 'Gasto'}>
        <input value={nota} onChange={(e) => setNota(e.target.value)} className="input" />
      </Field>
      <div className="mb-4">
        <Notice tone={tipo === 'Aporte' ? 'accent' : 'warn'}>
          {tipo === 'Aporte' ? 'Sube' : 'Baja'} el dinero esperado en el próximo cierre de esta caja.
        </Notice>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <button onClick={guardar} disabled={enviando} className="btn btn-primary btn-lg w-full">
        {enviando ? 'Guardando…' : 'Registrar'}
      </button>
    </Modal>
  )
}
