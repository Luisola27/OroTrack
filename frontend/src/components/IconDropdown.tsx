import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface IconOption<T extends string> {
  value: T
  label: ReactNode
  /** Texto para filtrar cuando el selector tiene búsqueda. */
  searchText?: string
}

interface Props<T extends string> {
  value: T | ''
  onChange: (value: T) => void
  options: IconOption<T>[]
  placeholder: string
  error?: boolean
  searchable?: boolean
  emptyText?: string
}

/** Selector propio (en vez de <select>) para poder mostrar emojis/banderas y, opcionalmente, buscar. */
export function IconDropdown<T extends string>({ value, onChange, options, placeholder, error, searchable, emptyText }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [filtro, setFiltro] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const q = filtro.trim().toLowerCase()
  const visibles = q ? options.filter((o) => (o.searchText ?? '').toLowerCase().includes(q)) : options

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setFiltro('')
        }}
        aria-invalid={error}
        aria-expanded={open}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${selected ? '' : 'text-[var(--text-muted)]'}`}>{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 12px 32px rgb(0 0 0 / 0.12)' }}
        >
          {searchable && (
            <div className="border-b p-2" style={{ borderColor: 'var(--border-soft)' }}>
              <input autoFocus value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar…" className="input py-2" />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {visibles.length === 0 && <p className="px-3 py-2.5 text-sm text-[var(--text-muted)]">{emptyText ?? 'Sin resultados'}</p>}
            {visibles.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className="flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]"
                style={o.value === value ? { background: 'var(--accent-soft)' } : undefined}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
