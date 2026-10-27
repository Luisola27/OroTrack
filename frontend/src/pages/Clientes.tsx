import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Cliente } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Avatar, ErrorBox, Field, List, Modal, PageHeader } from '../components/ui'
import { formatColones, mensajeError } from '../lib/format'

/** Todos pueden ver y crear clientes; solo el Admin los edita o desactiva. */
export default function Clientes() {
  const { esAdmin } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [buscar, setBuscar] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const [editando, setEditando] = useState<Cliente | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [identificacion, setIdentificacion] = useState('')
  const [activo, setActivo] = useState(true)
  const [errorNombre, setErrorNombre] = useState<string | undefined>()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function cargar() {
    api.get<Cliente[]>('/clientes', { params: { incluirInactivos: esAdmin } }).then((r) => setClientes(r.data))
  }

  useEffect(cargar, [esAdmin])

  function abrir(c: Cliente | null) {
    setEditando(c)
    setAbierto(true)
    setNombre(c?.nombre ?? '')
    setTelefono(c?.telefono ?? '')
    setDireccion(c?.direccion ?? '')
    setIdentificacion(c?.identificacion ?? '')
    setActivo(c?.activo ?? true)
    setErrorNombre(undefined)
    setErrorGeneral(null)
  }

  async function guardar() {
    setErrorGeneral(null)
    if (!nombre.trim()) {
      setErrorNombre('El nombre es obligatorio.')
      return
    }
    setEnviando(true)
    const body = { nombre, telefono: telefono || null, direccion: direccion || null, identificacion: identificacion || null }
    try {
      if (editando) await api.put(`/clientes/${editando.id}`, { ...body, activo })
      else await api.post('/clientes', body)
      setAbierto(false)
      cargar()
    } catch (err) {
      setErrorGeneral(mensajeError(err, 'No se pudo guardar.'))
    } finally {
      setEnviando(false)
    }
  }

  const q = buscar.trim().toLowerCase()
  const visibles = clientes
    .filter((c) => mostrarInactivos || c.activo)
    .filter((c) => !q || c.nombre.toLowerCase().includes(q) || (c.identificacion ?? '').toLowerCase().includes(q) || (c.telefono ?? '').includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const conSaldo = clientes.filter((c) => c.activo && c.saldoPendiente > 0).length

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={
          <>
            {clientes.filter((c) => c.activo).length} activo(s)
            {conSaldo > 0 && (
              <>
                {' '}· <Link to="/por-cobrar" className="link">{conSaldo} con saldo pendiente</Link>
              </>
            )}
          </>
        }
        actions={
          <button onClick={() => abrir(null)} className="btn btn-primary">
            + Nuevo cliente
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, cédula o teléfono…" className="input max-w-sm flex-1" />
        {esAdmin && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
            Mostrar inactivos
          </label>
        )}
      </div>

      <List isEmpty={visibles.length === 0} empty="Sin resultados.">
        {visibles.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3" style={{ opacity: c.activo ? 1 : 0.55 }}>
            <Avatar nombre={c.nombre} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {c.nombre}
                {!c.activo && <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">(inactivo)</span>}
              </div>
              <div className="truncate text-xs text-[var(--text-muted)]">
                {[c.telefono, c.identificacion, c.direccion].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
              </div>
            </div>
            {c.saldoPendiente > 0 && <span className="num shrink-0 text-sm font-medium text-[var(--danger)]">debe {formatColones(c.saldoPendiente)}</span>}
            {esAdmin && (
              <button onClick={() => abrir(c)} className="btn btn-ghost btn-sm shrink-0">
                Editar
              </button>
            )}
          </div>
        ))}
      </List>

      <Modal open={abierto} onClose={() => setAbierto(false)} title={editando ? `Editar ${editando.nombre}` : 'Nuevo cliente'}>
        <Field label="Nombre" required error={errorNombre}>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrorNombre(undefined)
            }}
            aria-invalid={!!errorNombre}
            className="input"
          />
        </Field>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Field label="Teléfono">
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className="input" />
          </Field>
          <Field label="Identificación">
            <input value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Dirección">
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input" />
        </Field>
        {editando && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
        )}
        <ErrorBox>{errorGeneral}</ErrorBox>
        <button onClick={guardar} disabled={enviando} className="btn btn-primary btn-lg w-full">
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </Modal>
    </div>
  )
}
