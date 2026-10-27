import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Calidad, Contenedor, FuenteDinero, MetodoPago, TipoOro, Usuario } from '../api/types'
import { METODOS_PAGO } from '../api/types'
import { ordenarPorQuilate, ordenarTiposOro } from '../constants/quilates'
import { useAuth } from '../context/AuthContext'
import { QuilateBadge } from '../components/QuilateBadge'
import { EmojiGlyph } from '../components/EmojiGlyph'
import { IconDropdown, type IconOption } from '../components/IconDropdown'
import { ErrorBox, Field, Modal, MoneyInput, Notice, PageHeader, Pill, Progress, Segmented } from '../components/ui'
import { formatColones, formatGramos, mensajeError } from '../lib/format'
import { montoALetras } from '../lib/numeroALetras'

const CALIDADES: Calidad[] = ['Barata', 'Media', 'Cara']

interface Compra {
  gramos: string
  costo: string
  metodo: MetodoPago | ''
  fuente: FuenteDinero
  responsableId: string
}

type ErroresCompra = Partial<Record<'gramos' | 'costo' | 'metodo' | 'tipoOro' | 'responsable', string>>

const compraVacia = (usuarioActualId: string): Compra => ({ gramos: '', costo: '', metodo: '', fuente: 'Caja', responsableId: usuarioActualId })

export default function Lotes() {
  const { esAdmin, usuarioId } = useAuth()
  const [contenedores, setContenedores] = useState<Contenedor[]>([])
  const [tiposOro, setTiposOro] = useState<TipoOro[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [mostrarVacios, setMostrarVacios] = useState(false)

  // null = cerrado, 'nuevo' = lote nuevo, Contenedor = comprar más material para ese lote
  const [modal, setModal] = useState<'nuevo' | Contenedor | null>(null)
  const [compra, setCompra] = useState<Compra>(compraVacia(''))
  const [tipoOroId, setTipoOroId] = useState('')
  const [calidad, setCalidad] = useState<Calidad | ''>('')
  const [proveedor, setProveedor] = useState('')
  const [nota, setNota] = useState('')
  const [errores, setErrores] = useState<ErroresCompra>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const tipoOroSeleccionado = tiposOro.find((t) => String(t.id) === tipoOroId)

  function cargar() {
    api.get<Contenedor[]>('/contenedores').then((r) => setContenedores(r.data))
  }

  useEffect(() => {
    cargar()
    if (esAdmin) {
      api.get<TipoOro[]>('/tiposoro').then((r) => setTiposOro(r.data))
      api.get<Usuario[]>('/usuarios').then((r) => setUsuarios(r.data.filter((u) => u.activo)))
    }
  }, [esAdmin])

  function abrir(m: 'nuevo' | Contenedor) {
    setModal(m)
    setCompra(compraVacia(usuarioId ?? ''))
    setTipoOroId('')
    setCalidad('')
    setProveedor('')
    setNota('')
    setErrores({})
    setErrorGeneral(null)
  }

  function cambiar<K extends keyof Compra>(campo: K, valor: Compra[K]) {
    setCompra((c) => ({ ...c, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo === 'responsableId' ? 'responsable' : campo]: undefined }))
  }

  function validar(): boolean {
    const e: ErroresCompra = {}
    if (modal === 'nuevo' && !tipoOroId) e.tipoOro = 'Selecciona el tipo de oro.'
    if (!compra.gramos.trim()) e.gramos = 'Ingresa los gramos.'
    else if (Number(compra.gramos) <= 0) e.gramos = 'Debe ser mayor a cero.'
    if (!compra.costo.trim()) e.costo = 'Ingresa cuánto se pagó.'
    else if (Number(compra.costo) <= 0) e.costo = 'Debe ser mayor a cero.'
    if (!compra.metodo) e.metodo = 'Selecciona cómo se pagó.'
    if (compra.fuente === 'Caja' && !compra.responsableId) e.responsable = 'Selecciona de qué caja salió el dinero.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function guardar() {
    if (!modal) return
    setErrorGeneral(null)
    if (!validar()) return
    setEnviando(true)
    const dinero = {
      costoTotal: Number(compra.costo),
      metodo: compra.metodo,
      fuente: compra.fuente,
      responsableCajaId: compra.fuente === 'Caja' ? compra.responsableId : null,
    }
    try {
      if (modal === 'nuevo') {
        await api.post('/contenedores', {
          ...dinero,
          tipoOroId: Number(tipoOroId),
          calidad: tipoOroSeleccionado?.permiteCalidad ? calidad || null : null,
          pesoInicialGramos: Number(compra.gramos),
          proveedor: proveedor || null,
        })
      } else {
        await api.post(`/contenedores/${modal.id}/reabastecer`, { ...dinero, gramos: Number(compra.gramos), nota: nota || null })
      }
      setModal(null)
      cargar()
    } catch (err) {
      setErrorGeneral(mensajeError(err, 'No se pudo guardar la compra.'))
    } finally {
      setEnviando(false)
    }
  }

  const visibles = ordenarPorQuilate(contenedores.filter((c) => mostrarVacios || c.pesoDisponibleGramos > 0))
  const vacios = contenedores.filter((c) => c.pesoDisponibleGramos <= 0).length
  const totalDisponible = contenedores.reduce((acc, c) => acc + Math.max(0, c.pesoDisponibleGramos), 0)
  const valorInventario = contenedores.reduce((acc, c) => acc + Math.max(0, c.pesoDisponibleGramos) * c.costoPorGramo, 0)
  const costoNum = Number(compra.costo) || 0
  const gramosNum = Number(compra.gramos) || 0
  const responsable = usuarios.find((u) => u.id === compra.responsableId)

  return (
    <div>
      <PageHeader
        title="Lotes"
        subtitle={
          <>
            <span className="num">{formatGramos(totalDisponible)}</span> disponibles
            {esAdmin && (
              <>
                {' '}· inventario a costo <span className="num">{formatColones(valorInventario)}</span>
              </>
            )}
          </>
        }
        actions={
          esAdmin && (
            <button onClick={() => abrir('nuevo')} className="btn btn-primary">
              + Nuevo lote
            </button>
          )
        }
      />

      {contenedores.length === 0 && (
        <div className="card p-5 text-sm text-[var(--text-muted)]">
          Todavía no hay lotes. {esAdmin ? 'Crea el primero con “Nuevo lote”.' : 'Pídele a un administrador que registre el primero.'}
        </div>
      )}

      {contenedores.length > 0 && visibles.length === 0 && (
        <div className="card mb-4 p-5 text-sm text-[var(--text-muted)]">Todos los lotes están en 0 g.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((c) => {
          const pct = c.pesoTotalGramos > 0 ? c.pesoDisponibleGramos / c.pesoTotalGramos : 0
          return (
            <div key={c.id} className="card flex flex-col p-4">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="font-medium">
                  <QuilateBadge tipoOro={c.tipoOro} />
                </div>
                {c.calidad && <Pill tone="accent">{c.calidad}</Pill>}
              </div>
              <div className="num mb-1 text-2xl font-semibold">{formatGramos(c.pesoDisponibleGramos)}</div>
              <div className="mb-3 text-xs text-[var(--text-muted)]">
                de {formatGramos(c.pesoTotalGramos)} comprados{esAdmin && <> · costo {formatColones(c.costoPorGramo, 2)}/g</>}
              </div>
              <Progress value={pct} />
              {esAdmin && (
                <button onClick={() => abrir(c)} className="btn btn-secondary btn-sm mt-4 w-full">
                  Comprar material
                </button>
              )}
            </div>
          )
        })}
      </div>

      {vacios > 0 && (
        <button onClick={() => setMostrarVacios((v) => !v)} className="link mt-4 text-sm">
          {mostrarVacios ? 'Ocultar lotes vacíos' : `Mostrar ${vacios} lote(s) vacío(s)`}
        </button>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === 'nuevo' || modal === null ? (
            'Nuevo lote'
          ) : (
            <>
              Comprar material · <EmojiGlyph value={modal.tipoOro.emoji} /> {modal.tipoOro.nombre}
            </>
          )
        }
        subtitle={modal !== 'nuevo' && modal !== null ? `Quedan ${formatGramos(modal.pesoDisponibleGramos)} en este lote` : 'Registra el material y lo que se pagó por él'}
      >
        {modal === 'nuevo' && (
          <>
            <Field label="Tipo de oro" required error={errores.tipoOro}>
              {tiposOro.length === 0 ? (
                <Notice>
                  No hay tipos de oro creados. <Link to="/tipos-oro" className="link">Créalos aquí</Link>
                </Notice>
              ) : (
                <IconDropdown
                  value={tipoOroId}
                  onChange={(v) => {
                    setTipoOroId(v)
                    setCalidad('')
                    setErrores((e) => ({ ...e, tipoOro: undefined }))
                  }}
                  placeholder="Selecciona…"
                  error={!!errores.tipoOro}
                  options={ordenarTiposOro(tiposOro).map(
                    (t): IconOption<string> => ({
                      value: String(t.id),
                      label: (
                        <>
                          <EmojiGlyph value={t.emoji} /> {t.nombre}
                        </>
                      ),
                    }),
                  )}
                />
              )}
            </Field>
            {tipoOroSeleccionado?.permiteCalidad && (
              <Field label="Calidad (opcional)">
                <IconDropdown
                  value={calidad}
                  onChange={(v) => setCalidad(v)}
                  placeholder="Sin especificar"
                  options={CALIDADES.map((c): IconOption<Calidad> => ({ value: c, label: c }))}
                />
              </Field>
            )}
          </>
        )}

        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label={modal === 'nuevo' ? 'Peso inicial (g)' : 'Gramos que entran'} required error={errores.gramos}>
            <input
              value={compra.gramos}
              onChange={(e) => cambiar('gramos', e.target.value)}
              inputMode="decimal"
              placeholder="0"
              aria-invalid={!!errores.gramos}
              className="input num"
            />
          </Field>
          <Field label="Total pagado" required error={errores.costo}>
            <MoneyInput value={compra.costo} onChange={(v) => cambiar('costo', v)} invalid={!!errores.costo} />
          </Field>
        </div>
        {costoNum > 0 && (
          <p className="-mt-2 mb-4 text-xs text-[var(--text-muted)]">
            {montoALetras(costoNum)}
            {gramosNum > 0 && <> · {formatColones(costoNum / gramosNum, 2)}/g</>}
          </p>
        )}

        <Field label="¿Con qué dinero se compró?" required>
          <Segmented
            value={compra.fuente}
            onChange={(v) => cambiar('fuente', v)}
            options={[
              { value: 'Caja', label: 'Plata de las ventas' },
              { value: 'Capital', label: 'Capital aparte' },
            ]}
          />
        </Field>

        {compra.fuente === 'Caja' && (
          <Field label="¿De la caja de quién salió?" required error={errores.responsable}>
            <IconDropdown
              value={compra.responsableId}
              onChange={(v) => cambiar('responsableId', v)}
              placeholder="Selecciona…"
              error={!!errores.responsable}
              options={usuarios.map((u): IconOption<string> => ({ value: u.id, label: `${u.nombreCompleto}${u.id === usuarioId ? ' (yo)' : ''}` }))}
            />
          </Field>
        )}

        <Field label="¿Cómo se pagó?" required error={errores.metodo}>
          <IconDropdown
            value={compra.metodo}
            onChange={(v) => cambiar('metodo', v)}
            placeholder="Selecciona…"
            error={!!errores.metodo}
            options={METODOS_PAGO.map((m): IconOption<MetodoPago> => ({ value: m.value, label: m.label }))}
          />
        </Field>

        <div className="mb-4">
          {compra.fuente === 'Caja' ? (
            <Notice tone="warn">
              Se descuenta de la caja de <b>{responsable?.nombreCompleto ?? '…'}</b>
              {costoNum > 0 && <> (<span className="num">{formatColones(costoNum)}</span>)</>}. En su próximo cierre, el dinero esperado
              {compra.metodo === 'Efectivo' || !compra.metodo ? ' en efectivo' : ` por ${METODOS_PAGO.find((m) => m.value === compra.metodo)?.label}`} baja en ese monto.
            </Notice>
          ) : (
            <Notice>El dinero vino de fuera del negocio: no afecta ninguna caja ni cierre. Queda registrado como inversión.</Notice>
          )}
        </div>

        {modal === 'nuevo' ? (
          <Field label="Proveedor (opcional)">
            <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="input" />
          </Field>
        ) : (
          <Field label="Nota (opcional)">
            <input value={nota} onChange={(e) => setNota(e.target.value)} className="input" />
          </Field>
        )}

        <ErrorBox>{errorGeneral}</ErrorBox>
        <button onClick={guardar} disabled={enviando} className="btn btn-primary btn-lg w-full">
          {enviando ? 'Guardando…' : modal === 'nuevo' ? 'Crear lote' : 'Registrar compra'}
        </button>
      </Modal>
    </div>
  )
}
