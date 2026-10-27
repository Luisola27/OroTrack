import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { TipoOro } from '../api/types'
import { EmojiGlyph } from '../components/EmojiGlyph'
import { ErrorBox, Field, List, Modal, PageHeader } from '../components/ui'
import { ordenarTiposOro } from '../constants/quilates'
import { mensajeError } from '../lib/format'

interface Errores {
  nombre?: string
  emoji?: string
}

export default function TiposOro() {
  const [tipos, setTipos] = useState<TipoOro[]>([])
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<TipoOro | null>(null)

  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('')
  const [quilateReferencia, setQuilateReferencia] = useState('')
  const [permiteCalidad, setPermiteCalidad] = useState(false)
  const [activo, setActivo] = useState(true)
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function cargar() {
    api.get<TipoOro[]>('/tiposoro', { params: { incluirInactivos: true } }).then((r) => setTipos(r.data))
  }

  useEffect(cargar, [])

  function abrir(t: TipoOro | null) {
    setEditando(t)
    setAbierto(true)
    setNombre(t?.nombre ?? '')
    setEmoji(t?.emoji ?? '')
    setQuilateReferencia(t?.quilateReferencia ? String(t.quilateReferencia) : '')
    setPermiteCalidad(t?.permiteCalidad ?? false)
    setActivo(t?.activo ?? true)
    setErrores({})
    setErrorGeneral(null)
  }

  async function guardar() {
    setErrorGeneral(null)
    const e: Errores = {}
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!emoji.trim()) e.emoji = 'Elige un emoji para identificarlo.'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    const body = { nombre, emoji, quilateReferencia: quilateReferencia.trim() ? Number(quilateReferencia) : null, permiteCalidad }
    try {
      if (editando) await api.put(`/tiposoro/${editando.id}`, { ...body, activo })
      else await api.post('/tiposoro', body)
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
        title="Tipos de oro"
        subtitle="El catálogo que se usa al crear lotes"
        actions={
          <button onClick={() => abrir(null)} className="btn btn-primary">
            + Nuevo tipo
          </button>
        }
      />

      <List isEmpty={tipos.length === 0} empty="Aún no hay tipos de oro.">
        {ordenarTiposOro(tipos).map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={{ opacity: t.activo ? 1 : 0.55 }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: 'var(--surface-2)' }}>
              <EmojiGlyph value={t.emoji} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.nombre}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {t.quilateReferencia ? `${t.quilateReferencia}k de referencia` : 'Sin quilate de referencia'}
                {t.permiteCalidad && ' · maneja calidades'}
                {!t.activo && ' · inactivo'}
              </div>
            </div>
            <button onClick={() => abrir(t)} className="btn btn-ghost btn-sm">
              Editar
            </button>
          </div>
        ))}
      </List>

      <Modal open={abierto} onClose={() => setAbierto(false)} title={editando ? `Editar ${editando.nombre}` : 'Nuevo tipo de oro'}>
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Field label="Nombre" required error={errores.nombre}>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setErrores((p) => ({ ...p, nombre: undefined }))
              }}
              placeholder="Oro Líquido"
              aria-invalid={!!errores.nombre}
              className="input"
            />
          </Field>
          <Field label="Emoji" required error={errores.emoji}>
            <input
              value={emoji}
              onChange={(e) => {
                setEmoji(e.target.value)
                setErrores((p) => ({ ...p, emoji: undefined }))
              }}
              placeholder="🍯"
              aria-invalid={!!errores.emoji}
              className="input text-center text-xl"
            />
          </Field>
        </div>
        <p className="-mt-2 mb-4 text-xs text-[var(--text-muted)]">Para el emoji usa el teclado de emojis (Windows: tecla Windows + punto).</p>

        <Field label="Quilate de referencia (opcional)" hint="Solo sirve para ordenar el catálogo; déjalo vacío si no aplica (ej. Oro Líquido).">
          <input value={quilateReferencia} onChange={(e) => setQuilateReferencia(e.target.value)} inputMode="numeric" placeholder="18" className="input num" />
        </Field>

        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={permiteCalidad} onChange={(e) => setPermiteCalidad(e.target.checked)} />
          Maneja calidades (barata / media / cara)
        </label>
        {editando && (
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo (aparece al crear lotes nuevos)
          </label>
        )}

        <ErrorBox>{errorGeneral}</ErrorBox>
        <button onClick={guardar} disabled={enviando} className="btn btn-primary btn-lg mt-2 w-full">
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </Modal>
    </div>
  )
}
