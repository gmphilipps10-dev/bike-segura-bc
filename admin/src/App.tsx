import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Equipamentos from './pages/Equipamentos'
import Adesivos from './pages/Adesivos'
import Planos from './pages/Planos'
import Pagamentos from './pages/Pagamentos'
import Relatorios from './pages/Relatorios'
import Sinistros from './pages/Sinistros'
import Analytics from './pages/Analytics'
import LojasParceiras from './pages/LojasParceiras'
import Instalacoes from './pages/Instalacoes'
import GlobalSearch from './components/GlobalSearch'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <><GlobalSearch />{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
      <Route path="/equipamentos" element={<PrivateRoute><Equipamentos /></PrivateRoute>} />
      <Route path="/adesivos" element={<PrivateRoute><Adesivos /></PrivateRoute>} />
      <Route path="/planos" element={<PrivateRoute><Planos /></PrivateRoute>} />
      <Route path="/pagamentos" element={<PrivateRoute><Pagamentos /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/lojas-parceiras" element={<PrivateRoute><LojasParceiras /></PrivateRoute>} />
      <Route path="/instalacoes" element={<PrivateRoute><Instalacoes /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
      <Route path="/sinistros" element={<PrivateRoute><Sinistros /></PrivateRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
