import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorBox, Field } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            Au
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Bienvenido a OroTrack</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Ingresa con tu cuenta para continuar</p>
        </div>

        <div className="card p-6">
          <Field label="Correo">
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoFocus />
          </Field>
          <Field label="Contraseña">
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          </Field>
          <ErrorBox>{error}</ErrorBox>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </form>
    </div>
  )
}
