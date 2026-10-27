import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SoloAdmin({ children }: { children: ReactNode }) {
  const { esAdmin } = useAuth()
  if (!esAdmin) {
    return (
      <div className="card mx-auto mt-10 max-w-sm p-6 text-center">
        <p className="font-semibold">Esta sección es solo para administradores</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Pídele a un administrador que haga este cambio por ti.</p>
      </div>
    )
  }
  return <>{children}</>
}
