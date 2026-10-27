import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar, ICONOS, Icon } from './ui'

interface NavItem {
  to: string
  label: string
  icon: string
  soloAdmin?: boolean
}

interface NavGroup {
  titulo?: string
  items: NavItem[]
}

/** Menú agrupado por lo que la persona quiere hacer: vender, cuidar el oro, cuidar el dinero. */
const GRUPOS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Inicio', icon: ICONOS.inicio },
      { to: '/ventas', label: 'Ventas', icon: ICONOS.ventas },
      { to: '/por-cobrar', label: 'Por cobrar', icon: ICONOS.cobrar },
      { to: '/clientes', label: 'Clientes', icon: ICONOS.clientes },
    ],
  },
  {
    titulo: 'Inventario',
    items: [
      { to: '/lotes', label: 'Lotes', icon: ICONOS.lotes },
      { to: '/movimientos', label: 'Movimientos de oro', icon: ICONOS.movimientos },
      { to: '/tipos-oro', label: 'Tipos de oro', icon: ICONOS.tipos, soloAdmin: true },
    ],
  },
  {
    titulo: 'Dinero',
    items: [
      { to: '/caja', label: 'Caja', icon: ICONOS.caja },
      { to: '/cierres', label: 'Cierres de caja', icon: ICONOS.cierres, soloAdmin: true },
    ],
  },
  {
    titulo: 'Administración',
    items: [{ to: '/usuarios', label: 'Usuarios', icon: ICONOS.usuarios, soloAdmin: true }],
  },
]

/** Accesos fijos de la barra inferior en móvil; el resto va en "Más". */
const BARRA_MOVIL = ['/', '/ventas', '/clientes']

type Tema = 'light' | 'dark' | null

function leerTema(): Tema {
  try {
    const t = localStorage.getItem('orotrack_tema')
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

function aplicarTema(tema: Tema) {
  if (tema) document.documentElement.setAttribute('data-theme', tema)
  else document.documentElement.removeAttribute('data-theme')
}

export default function AppShell() {
  const { nombreCompleto, esAdmin, logout } = useAuth()
  const [masAbierto, setMasAbierto] = useState(false)
  const [tema, setTema] = useState<Tema>(leerTema)
  const location = useLocation()

  useEffect(() => aplicarTema(tema), [tema])

  const grupos = GRUPOS.map((g) => ({ ...g, items: g.items.filter((i) => esAdmin || !i.soloAdmin) })).filter((g) => g.items.length > 0)
  const todos = grupos.flatMap((g) => g.items)

  function alternarTema() {
    const oscuroAhora = tema ? tema === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    const nuevo: Tema = oscuroAhora ? 'light' : 'dark'
    setTema(nuevo)
    try {
      localStorage.setItem('orotrack_tema', nuevo)
    } catch {
      /* sin almacenamiento: el tema dura solo esta sesión */
    }
  }

  const perfil = (
    <div className="flex items-center gap-2.5">
      <Avatar nombre={nombreCompleto ?? '?'} size={34} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{nombreCompleto}</div>
        <div className="text-xs text-[var(--text-muted)]">{esAdmin ? 'Administrador' : 'Vendedor'}</div>
      </div>
      <button onClick={alternarTema} className="btn btn-ghost btn-sm px-2" title="Cambiar tema claro/oscuro" aria-label="Cambiar tema">
        <Icon path={ICONOS.luna} size={16} />
      </button>
      <button onClick={logout} className="btn btn-ghost btn-sm px-2" title="Cerrar sesión" aria-label="Cerrar sesión">
        <Icon path={ICONOS.salir} size={16} />
      </button>
    </div>
  )

  return (
    <div className="min-h-dvh md:flex">
      {/* Barra lateral (escritorio) */}
      <aside
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-3 py-5 md:flex"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--surface)' }}
      >
        <Logo />
        <NavLink to="/ventas/nueva" className="btn btn-primary mx-1 mb-5 mt-6">
          <Icon path={ICONOS.mas_venta} size={16} strokeWidth={2.2} /> Nueva venta
        </NavLink>
        <nav className="flex-1 overflow-y-auto">
          {grupos.map((g, i) => (
            <div key={i} className="mb-4">
              {g.titulo && <div className="mb-1 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{g.titulo}</div>}
              {g.items.map((item) => (
                <SideLink key={item.to} item={item} />
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t px-1 pt-4" style={{ borderColor: 'var(--border-soft)' }}>
          {perfil}
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{ borderColor: 'var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(10px)' }}
      >
        <Logo />
        <Avatar nombre={nombreCompleto ?? '?'} size={30} />
      </header>

      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        <Outlet />
      </main>

      {/* Barra inferior (móvil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--surface)' }}
      >
        {todos
          .filter((i) => BARRA_MOVIL.includes(i.to))
          .slice(0, 2)
          .map((item) => (
            <TabLink key={item.to} item={item} />
          ))}
        <NavLink to="/ventas/nueva" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] font-medium text-[var(--text-muted)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            <Icon path={ICONOS.mas_venta} size={18} strokeWidth={2.4} />
          </span>
        </NavLink>
        {todos
          .filter((i) => i.to === '/clientes')
          .map((item) => (
            <TabLink key={item.to} item={item} />
          ))}
        <button
          onClick={() => setMasAbierto(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] font-medium"
          style={{ color: todos.some((i) => !BARRA_MOVIL.includes(i.to) && activo(location.pathname, i.to)) ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <Icon path={ICONOS.mas} size={22} strokeWidth={3} />
          Más
        </button>
      </nav>

      {/* Hoja "Más" (móvil) */}
      {masAbierto && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden" onClick={() => setMasAbierto(false)}>
          <div
            className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => {
              e.stopPropagation()
              // Al tocar un enlace del menú, la hoja se cierra.
              if ((e.target as HTMLElement).closest('a')) setMasAbierto(false)
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            {grupos.map((g, i) => {
              const items = g.items.filter((it) => !BARRA_MOVIL.includes(it.to))
              if (items.length === 0) return null
              return (
                <div key={i} className="mb-4">
                  {g.titulo && <div className="mb-1 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{g.titulo}</div>}
                  {items.map((item) => (
                    <SideLink key={item.to} item={item} />
                  ))}
                </div>
              )
            })}
            <div className="border-t px-2 pt-4" style={{ borderColor: 'var(--border-soft)' }}>
              {perfil}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function activo(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

function Logo() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
        Au
      </span>
      <span className="font-semibold tracking-tight">OroTrack</span>
    </div>
  )
}

function SideLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/ventas'}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
      style={({ isActive }) => (isActive ? { background: 'var(--accent-soft)', color: 'var(--text)' } : { color: 'var(--text-muted)' })}
    >
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? 'var(--accent)' : undefined }}>
            <Icon path={item.icon} />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

function TabLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/ventas'}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] font-medium"
      style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-muted)' })}
    >
      <Icon path={item.icon} size={20} />
      {item.label}
    </NavLink>
  )
}
