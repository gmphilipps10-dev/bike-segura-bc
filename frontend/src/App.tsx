import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BikeProvider } from './context/BikeContext';
import TrialGuard from './components/TrialGuard';
import TrialBanner from './components/TrialBanner';
import Login from './pages/Login';
import Home from './pages/Home';
import MeusEquipamentos from './pages/MeusEquipamentos';
import CadastrarNovo from './pages/CadastrarNovo';
import DelegaciaVirtual from './pages/DelegaciaVirtual';
import Mapa from './pages/Mapa';
import MeuPerfil from './pages/MeuPerfil';
import Planos from './pages/Planos';
import PagamentoPlano from './pages/PagamentoPlano';
import Ciclovias from './pages/Ciclovias';
import Indicacoes from './pages/Indicacoes';
import IndicarLanding from './pages/IndicarLanding';
import ConsultaPublica from './pages/ConsultaPublica';
import LojasParceiras from './pages/LojasParceiras';
import AnuncieAqui from './pages/AnuncieAqui';
import AjudaSuporte from './pages/AjudaSuporte';
import TermosPoliticas from './pages/TermosPoliticas';
import InstalarPWA from './pages/InstalarPWA';
import Baixar from './pages/Baixar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // SPA redirect handler: le a rota salva pelo 404.html e navega para ela
  useEffect(() => {
    const redirect = sessionStorage.getItem('__spa_redirect__');
    if (redirect) {
      sessionStorage.removeItem('__spa_redirect__');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <TrialBanner isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<TrialGuard isLoggedIn={isLoggedIn}><Home /></TrialGuard>} />
        <Route path="/equipamentos" element={<PrivateRoute><MeusEquipamentos /></PrivateRoute>} />
        <Route path="/cadastrar" element={<PrivateRoute><CadastrarNovo /></PrivateRoute>} />
        <Route path="/delegacia" element={<TrialGuard isLoggedIn={isLoggedIn}><DelegaciaVirtual /></TrialGuard>} />
        <Route path="/mapa" element={<TrialGuard isLoggedIn={isLoggedIn}><Mapa /></TrialGuard>} />
        <Route path="/perfil" element={<PrivateRoute><MeuPerfil /></PrivateRoute>} />
        <Route path="/planos" element={<TrialGuard isLoggedIn={isLoggedIn}><Planos /></TrialGuard>} />
        <Route path="/pagamento" element={<PrivateRoute><PagamentoPlano /></PrivateRoute>} />
        <Route path="/indicacoes" element={<PrivateRoute><Indicacoes /></PrivateRoute>} />
        <Route path="/indicar/:codigo" element={<IndicarLanding />} />
        <Route path="/qr/:hash" element={<ConsultaPublica />} />
        <Route path="/consulta/:hash" element={<ConsultaPublica />} />
        <Route path="/s/:stickerNumber" element={<ConsultaPublica />} />
        <Route path="/ciclovias" element={<Ciclovias />} />
        <Route path="/lojas" element={<TrialGuard isLoggedIn={isLoggedIn}><LojasParceiras /></TrialGuard>} />
        <Route path="/anuncie" element={<TrialGuard isLoggedIn={isLoggedIn}><AnuncieAqui /></TrialGuard>} />
        <Route path="/ajuda" element={<TrialGuard isLoggedIn={isLoggedIn}><AjudaSuporte /></TrialGuard>} />
        <Route path="/termos" element={<TrialGuard isLoggedIn={isLoggedIn}><TermosPoliticas /></TrialGuard>} />
        <Route path="/instalar" element={<InstalarPWA />} />
        <Route path="/baixar" element={<Baixar />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BikeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </BikeProvider>
    </AuthProvider>
  );
}

export default App;
