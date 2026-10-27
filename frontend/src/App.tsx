import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import SoloAdmin from './components/SoloAdmin'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NuevaVenta from './pages/NuevaVenta'
import Ventas from './pages/Ventas'
import PorCobrar from './pages/PorCobrar'
import Lotes from './pages/Lotes'
import TiposOro from './pages/TiposOro'
import Movimientos from './pages/Movimientos'
import Clientes from './pages/Clientes'
import Usuarios from './pages/Usuarios'
import Caja from './pages/Caja'
import Cierres from './pages/Cierres'

function Privado({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Privado>
              <AppShell />
            </Privado>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/ventas/nueva" element={<NuevaVenta />} />
          <Route path="/por-cobrar" element={<PorCobrar />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/tipos-oro" element={<SoloAdmin><TiposOro /></SoloAdmin>} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/cierres" element={<SoloAdmin><Cierres /></SoloAdmin>} />
          <Route path="/usuarios" element={<SoloAdmin><Usuarios /></SoloAdmin>} />

          {/* Rutas anteriores, por si quedaron guardadas en favoritos */}
          <Route path="/deudores" element={<Navigate to="/por-cobrar" replace />} />
          <Route path="/contenedores" element={<Navigate to="/lotes" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
