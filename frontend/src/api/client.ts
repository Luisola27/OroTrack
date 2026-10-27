import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7041/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orotrack_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Un 401 en el login es "contraseña incorrecta", no una sesión vencida: no redirigir.
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      ['orotrack_token', 'orotrack_usuario_id', 'orotrack_nombre', 'orotrack_roles'].forEach((k) => localStorage.removeItem(k))
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
