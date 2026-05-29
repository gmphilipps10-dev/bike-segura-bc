import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BikeProvider } from './context/BikeContext';
import Login from './pages/Login';
import Home from './pages/Home';
import MeusEquipamentos from './pages/MeusEquipamentos';
import CadastrarNovo from './pages/CadastrarNovo';
import DelegaciaVirtual from './pages/DelegaciaVirtual';
import Mapa from './pages/Mapa';
import MeuPerfil from './pages/MeuPerfil';
import Planos from './pages/Planos';
import Indicacoes from './pages/Indicacoes';
import IndicarLanding from './pages/IndicarLanding';
import ConsultaPublica from './pages/ConsultaPublica';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClientes from './pages/admin/Clientes';
import AdminEquipamentos from './pages/admin/EquipamentosAdmin';
import AdminAdesivos from './pages/AdminAdesivos';
import AdminRelatorios from './pages/admin/Relatorios';
import LojasParceiras from './pages/LojasParceiras';
import AnuncieAqui from './pages/AnuncieAqui';
import AjudaSuporte from './pages/AjudaSuporte';
import TermosPoliticas from './pages/TermosPoliticas';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/equipamentos" element={<PrivateRoute><MeusEquipamentos /></PrivateRoute>} />
      <Route path="/cadastrar" element={<PrivateRoute><CadastrarNovo /></PrivateRoute>} />
      <Route path="/delegacia" element={<PrivateRoute><DelegaciaVirtual /></PrivateRoute>} />
      <Route path="/mapa" element={<PrivateRoute><Mapa /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><MeuPerfil /></PrivateRoute>} />
      <Route path="/planos" element={<PrivateRoute><Planos /></PrivateRoute>} />
      <Route path="/indicacoes" element={<PrivateRoute><Indicacoes /></PrivateRoute>} />
      <Route path="/indicar/:codigo" element={<IndicarLanding />} />
      <Route path="/qr/:hash" element={<ConsultaPublica />} />
      <Route path="/consulta/:hash" element={<ConsultaPublica />} />
      <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/clientes" element={<PrivateRoute><AdminClientes /></PrivateRoute>} />
      <Route path="/admin/equipamentos" element={<PrivateRoute><AdminEquipamentos /></PrivateRoute>} />
      <Route path="/admin/adesivos" element={<PrivateRoute><AdminAdesivos /></PrivateRoute>} />
      <Route path="/admin/relatorios" element={<PrivateRoute><AdminRelatorios /></PrivateRoute>} />
      <Route path="/lojas" element={<PrivateRoute><LojasParceiras /></PrivateRoute>} />
      <Route path="/anuncie" element={<PrivateRoute><AnuncieAqui /></PrivateRoute>} />
      <Route path="/ajuda" element={<PrivateRoute><AjudaSuporte /></PrivateRoute>} />
      <Route path="/termos" element={<PrivateRoute><TermosPoliticas /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BikeProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </BikeProvider>
    </AuthProvider>
  );
}

export default App;
