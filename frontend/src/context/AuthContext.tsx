import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { LoginResponse } from '../api/types'

interface AuthState {
  usuarioId: string | null
  nombreCompleto: string | null
  roles: string[]
  esAdmin: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const CLAVES = ['orotrack_token', 'orotrack_usuario_id', 'orotrack_nombre', 'orotrack_roles']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState<string | null>(localStorage.getItem('orotrack_usuario_id'))
  const [nombreCompleto, setNombreCompleto] = useState<string | null>(localStorage.getItem('orotrack_nombre'))
  const [roles, setRoles] = useState<string[]>(JSON.parse(localStorage.getItem('orotrack_roles') ?? '[]'))

  async function login(email: string, password: string) {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    localStorage.setItem('orotrack_token', data.token)
    localStorage.setItem('orotrack_usuario_id', data.usuarioId)
    localStorage.setItem('orotrack_nombre', data.nombreCompleto)
    localStorage.setItem('orotrack_roles', JSON.stringify(data.roles))
    setUsuarioId(data.usuarioId)
    setNombreCompleto(data.nombreCompleto)
    setRoles(data.roles)
  }

  function logout() {
    CLAVES.forEach((k) => localStorage.removeItem(k))
    setUsuarioId(null)
    setNombreCompleto(null)
    setRoles([])
  }

  return (
    <AuthContext.Provider
      value={{
        usuarioId,
        nombreCompleto,
        roles,
        esAdmin: roles.includes('Admin'),
        // Sesiones iniciadas antes de guardar el id deben volver a ingresar.
        isAuthenticated: !!nombreCompleto && !!usuarioId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
