import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Equipamentos from './pages/Equipamentos'
import Adesivos from './pages/Adesivos'
import Ocorrencias from './pages/Ocorrencias'
import Planos from './pages/Planos'
import PagamentosPage from './pages/PagamentosPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/paineladmin/login" replace />
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
        <Route path="equipamentos" element={<PrivateRoute><Equipamentos /></PrivateRoute>} />
        <Route path="adesivos" element={<PrivateRoute><Adesivos /></PrivateRoute>} />
        <Route path="ocorrencias" element={<PrivateRoute><Ocorrencias /></PrivateRoute>} />
        <Route path="planos" element={<PrivateRoute><Planos /></PrivateRoute>} />
        <Route path="pagamentos" element={<PrivateRoute><PagamentosPage /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  )
}
