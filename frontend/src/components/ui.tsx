import { useEffect, type ReactNode } from 'react'
import { iniciales } from '../lib/format'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.5rem] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}

export function Section({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[0.95rem] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Lista en tarjeta con separadores finos. */
export function List({ children, empty, isEmpty }: { children: ReactNode; empty?: ReactNode; isEmpty?: boolean }) {
  return (
    <div className="card divide-y divide-[var(--border-soft)] overflow-hidden">
      {isEmpty ? <p className="p-5 text-sm text-[var(--text-muted)]">{empty}</p> : children}
    </div>
  )
}

export function Stat({ label, value, tone, hint }: { label: string; value: ReactNode; tone?: 'accent' | 'good' | 'danger' | 'warn'; hint?: ReactNode }) {
  const color = tone ? `var(--${tone})` : 'var(--text)'
  return (
    <div className="card p-4">
      <div className="text-[0.78rem] text-[var(--text-muted)]">{label}</div>
      <div className="num mt-1 text-[1.3rem] font-semibold" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-[0.72rem] text-[var(--text-muted)]">{hint}</div>}
    </div>
  )
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  )
}

export function MoneyInput({
  value,
  onChange,
  invalid,
  autoFocus,
  large,
}: {
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  autoFocus?: boolean
  large?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">₡</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        autoFocus={autoFocus}
        aria-invalid={invalid}
        className={`input num pl-7 ${large ? 'py-3 text-lg font-semibold' : ''}`}
      />
    </div>
  )
}

/** Selector segmentado: pocas opciones excluyentes (tipo de pago, fuente del dinero, pestañas). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="flex gap-1 rounded-[11px] p-1" style={{ background: 'var(--surface-2)' }}>
      {options.map((o) => {
        const activo = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={
              activo
                ? { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:rounded-2xl md:p-6"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm -mr-2 -mt-1" aria-label="Cerrar">
            <Icon path="M6 6l12 12M18 6L6 18" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ErrorBox({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="mb-4 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
      {children}
    </p>
  )
}

export function Notice({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'warn' }) {
  const styles = {
    muted: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
    accent: { background: 'var(--accent-soft)', color: 'var(--text)' },
    warn: { background: 'var(--warn-soft)', color: 'var(--text)' },
  }
  return (
    <div className="rounded-lg px-3 py-2.5 text-[0.8rem] leading-relaxed" style={styles[tone]}>
      {children}
    </div>
  )
}

export function Avatar({ nombre, size = 36 }: { nombre: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold"
      style={{ width: size, height: size, background: 'var(--surface-2)', color: 'var(--text-muted)' }}
    >
      {iniciales(nombre)}
    </div>
  )
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'good' | 'warn' | 'danger' | 'accent' }) {
  const bg = tone === 'muted' ? 'var(--surface-2)' : `var(--${tone}-soft)`
  const fg = tone === 'muted' ? 'var(--text-muted)' : `var(--${tone})`
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold" style={{ background: bg, color: fg }}>
      {children}
    </span>
  )
}

/** Barra de progreso fina (peso disponible de un lote). */
export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  const color = pct < 25 ? 'var(--warn)' : 'var(--accent)'
  return (
    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Icon({ path, size = 18, strokeWidth = 1.8 }: { path: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export const ICONOS = {
  inicio: 'M3 10.5L12 3l9 7.5M5 9v11h14V9',
  ventas: 'M4 6h16M4 12h16M4 18h10',
  cobrar: 'M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3',
  clientes: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5M16 3.5a4 4 0 010 7.5M18 14.8c2.3.7 4 2.9 4 6.2',
  lotes: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
  movimientos: 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
  tipos: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z',
  caja: 'M3 7h18v12H3zM3 11h18M7 15h3',
  cierres: 'M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9',
  usuarios: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  mas: 'M5 12h.01M12 12h.01M19 12h.01',
  mas_venta: 'M12 5v14M5 12h14',
  salir: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3',
  sol: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 100-10 5 5 0 000 10z',
  luna: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  flecha: 'M9 6l6 6-6 6',
} as const
