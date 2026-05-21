import { HashRouter, Routes, Route } from 'react-router-dom';
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
import LojasParceiras from './pages/LojasParceiras';
import AnuncieAqui from './pages/AnuncieAqui';

function App() {
  return (
    <BikeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/equipamentos" element={<MeusEquipamentos />} />
          <Route path="/cadastrar" element={<CadastrarNovo />} />
          <Route path="/delegacia" element={<DelegaciaVirtual />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/perfil" element={<MeuPerfil />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/indicacoes" element={<Indicacoes />} />
          <Route path="/lojas" element={<LojasParceiras />} />
          <Route path="/anuncie" element={<AnuncieAqui />} />
        </Routes>
      </HashRouter>
    </BikeProvider>
  );
}

export default App;
