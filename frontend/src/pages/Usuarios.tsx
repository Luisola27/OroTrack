import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Rol, Usuario } from '../api/types'
import { Avatar, ErrorBox, Field, List, Modal, PageHeader, Pill, Segmented } from '../components/ui'
import { mensajeError } from '../lib/format'

interface Errores {
  nombre?: string
  email?: string
  password?: string
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('Vendedor')
  const [activo, setActivo] = useState(true)
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function cargar() {
    api.get<Usuario[]>('/usuarios').then((r) => setUsuarios(r.data))
  }

  useEffect(cargar, [])

  function abrir(u: Usuario | null) {
    setEditando(u)
    setAbierto(true)
    setNombre(u?.nombreCompleto ?? '')
    setEmail(u?.email ?? '')
    setPassword('')
    setRol(u?.rol ?? 'Vendedor')
    setActivo(u?.activo ?? true)
    setErrores({})
    setErrorGeneral(null)
  }

  async function guardar() {
    setErrorGeneral(null)
    const e: Errores = {}
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!editando && !email.trim()) e.email = 'El correo es obligatorio.'
    if (!editando && password.trim().length < 6) e.password = 'Mínimo 6 caracteres.'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    try {
      if (editando) await api.put(`/usuarios/${editando.id}`, { nombreCompleto: nombre, rol, activo })
      else await api.post('/usuarios', { nombreCompleto: nombre, email, password, rol })
      setAbierto(false)
      cargar()
    } catch (err) {
      setErrorGeneral(mensajeError(err, 'No se pudo guardar.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Quién puede entrar al sistema y con qué permisos"
        actions={
          <button onClick={() => abrir(null)} className="btn btn-primary">
            + Nuevo usuario
          </button>
        }
      />

      <List isEmpty={usuarios.length === 0} empty="Sin usuarios.">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3" style={{ opacity: u.activo ? 1 : 0.55 }}>
            <Avatar nombre={u.nombreCompleto} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {u.nombreCompleto}
                {!u.activo && <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">(inactivo)</span>}
              </div>
              <div className="truncate text-xs text-[var(--text-muted)]">{u.email}</div>
            </div>
            <Pill tone={u.rol === 'Admin' ? 'accent' : 'muted'}>{u.rol === 'Admin' ? 'Administrador' : u.rol ?? 'Sin rol'}</Pill>
            <button onClick={() => abrir(u)} className="btn btn-ghost btn-sm">
              Editar
            </button>
          </div>
        ))}
      </List>

      <Modal open={abierto} onClose={() => setAbierto(false)} title={editando ? `Editar ${editando.nombreCompleto}` : 'Nuevo usuario'}>
        <Field label="Nombre completo" required error={errores.nombre}>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrores((p) => ({ ...p, nombre: undefined }))
            }}
            aria-invalid={!!errores.nombre}
            className="input"
          />
        </Field>

        {!editando && (
          <>
            <Field label="Correo" required error={errores.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrores((p) => ({ ...p, email: undefined }))
                }}
                aria-invalid={!!errores.email}
                className="input"
              />
            </Field>
            <Field label="Contraseña" required error={errores.password} hint="Mínimo 6 caracteres.">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrores((p) => ({ ...p, password: undefined }))
                }}
                aria-invalid={!!errores.password}
                className="input"
              />
            </Field>
          </>
        )}

        <Field
          label="Rol"
          required
          hint={rol === 'Admin' ? 'Acceso total: lotes, caja de todos, cierres y usuarios.' : 'Vende, registra abonos, ve clientes, lotes y su propia caja.'}
        >
          <Segmented
            value={rol}
            onChange={setRol}
            options={[
              { value: 'Vendedor', label: 'Vendedor' },
              { value: 'Admin', label: 'Administrador' },
            ]}
          />
        </Field>

        {editando && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo (puede iniciar sesión)
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
