import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { IoAlertCircle, IoWarning, IoLocation, IoBicycle, IoShieldCheckmark } from 'react-icons/io5';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bikes, setBikes] = useState([]);
  const [alertStep, setAlertStep] = useState('none');
  const [selectedBike, setSelectedBike] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  const loadBikes = () => api.getBikes().then(setBikes).catch(() => {});
  useEffect(() => { loadBikes(); }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const totalBikes = bikes.length;
  const equipamentosAtivos = bikes.filter((b) => b.status === 'Ativa');
  const monitorando = equipamentosAtivos.length;
  const furtadas = bikes.filter((b) => b.status === 'Furtada').length;
  const firstName = user?.nome_completo?.split(' ')[0] || 'Usuario';

  const handleAlerta = () => {
    const ativas = bikes.filter((b) => b.status === 'Ativa');
    if (ativas.length === 0) { setAlertStep('no-bikes'); return; }
    if (ativas.length === 1) { setSelectedBike(ativas[0]); setAlertStep('confirm'); return; }
    setAlertStep('select');
  };

  const buildMsg = (b) => `🚨 ALERTA DE FURTO 🚨\n\nEquipamento: ${b.marca} ${b.modelo}\nCor: ${b.cor}\nNº Série: ${b.numero_serie || 'N/A'}\nCategoria: ${b.categoria || 'N/A'}`;

  const doConfirm = async () => {
    if (!selectedBike) return;
    setAlertLoading(true);
    try {
      await api.alertFurto(selectedBike.id);
      const msg = encodeURIComponent(buildMsg(selectedBike));
      window.open(`https://wa.me/5547992458380?text=${msg}`, '_blank');
      loadBikes();
      setAlertStep('none');
      setSelectedBike(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setAlertLoading(false);
    }
  };

  const abrirDelegacia = () => {
    if (!selectedBike && equipamentosAtivos.length === 1) {
      setSelectedBike(equipamentosAtivos[0]);
    }
    const b = selectedBike || equipamentosAtivos[0];
    if (!b) {
      window.open('https://delegaciavirtual.sc.gov.br/nova-ocorrencia', '_blank');
      return;
    }
    const dados = {
      tipo_objeto: b.categoria || 'Bicicleta',
      marca: b.marca || '',
      modelo: b.modelo || '',
      serie: b.numero_serie || '',
      cor: b.cor || '',
      data: new Date().toISOString()
    };
    const params = new URLSearchParams(dados).toString();
    window.open(`https://delegaciavirtual.sc.gov.br/nova-ocorrencia?${params}`, '_blank');
  };

  return (
    <div>
      <div className="header"><img src="/logo.jpg" alt="Bike Segura BC" /></div>
      {totalBikes > 0 && (
        <div className="monitor-bar"><div className="pulse"></div><span className="monitor-text">
          {monitorando} equipamento{monitorando > 1 ? 's' : ''} monitorado{monitorando > 1 ? 's' : ''}
        </span></div>
      )}
      <div className="greeting-section">
        <h1 className="greeting">Olá, {firstName}!</h1>
        <p className="subtitle">Central de Monitoramento</p>
      </div>

      {/* Cards de equipamentos - dinâmicos */}
      {equipamentosAtivos.length > 0 && (
        <div className="equipamentos-list">
          {equipamentosAtivos.map((bike) => (
            <div key={bike.id} className="equipamento-card">
              <div className="equipamento-header">
                <div className="equipamento-icon">
                  <IoBicycle size={28} color="#FFD700" />
                </div>
                <div className="equipamento-info">
                  <div className="equipamento-nome">{bike.marca} {bike.modelo}</div>
                  <div className="equipamento-categoria">{bike.categoria || 'Bicicleta'}</div>
                </div>
                <div className="equipamento-status">
                  <span className="status-dot"></span> Ativa
                </div>
              </div>
              <button className="btn-rastrear" onClick={() => navigate(`/bike/${bike.id}`)}>
                <IoLocation size={18} />
                RASTREAR AGORA
              </button>
            </div>
          ))}
        </div>
      )}

      {totalBikes > 0 && (
        <button className="alert-furto-btn" onClick={handleAlerta}>
          <IoAlertCircle size={28} />
          <div className="btn-content"><div className="btn-title">EMITIR ALERTA DE FURTO</div></div>
        </button>
      )}

      {/* Delegacia Virtual SC */}
      <button className="delegacia-btn" onClick={abrirDelegacia}>
        <IoShieldCheckmark size={28} />
        <div className="btn-content">
          <div className="btn-title">DELEGACIA VIRTUAL SC</div>
          <div className="btn-subtitle">Registrar boletim de ocorrência</div>
        </div>
      </button>

      {furtadas > 0 && (
        <div className="alert-section">
          <div className="alert-header"><IoWarning size={24} color="#F44336" /><span className="alert-title">Atenção</span></div>
          <p className="alert-text">{furtadas} bicicleta{furtadas > 1 ? 's' : ''} furtada{furtadas > 1 ? 's' : ''}. Acesse a página de bikes para mais detalhes.</p>
          <button className="alert-button" onClick={() => navigate('/bikes')}><IoLocation size={18} /> Ver Bikes</button>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">Acesso Rapido</h3>
        <button className="action-card" onClick={() => navigate('/bikes')}><div className="action-icon"><IoBicycle size={24} /></div><div className="action-content"><div className="action-title">Minhas Bicicletas</div><div className="action-subtitle">Ver e rastrear bikes cadastradas</div></div></button>
        {totalBikes === 0 && (
          <button className="action-card" onClick={() => navigate('/add-bike')}><div className="action-icon">+</div><div className="action-content"><div className="action-title">Cadastrar Bike</div><div className="action-subtitle">Adicione sua primeira bicicleta</div></div></button>
        )}
      </div>


      {installPrompt && (
        <div className="install-banner">
          <img src="/logo.jpg" alt="" />
          <p>Instale o app para acesso rapido</p>
          <div className="btns">
            <button className="btn-install" onClick={() => { installPrompt.prompt(); }}>Instalar</button>
            <button className="btn-dismiss" onClick={() => setInstallPrompt(null)}>Depois</button>
          </div>
        </div>
      )}

      {alertStep !== 'none' && (
        <div className="modal-overlay">
          <div className="modal-box">
            {alertStep === 'no-bikes' && (<>
              <div className="modal-icon">!</div>
              <h3 className="modal-title">Sem bikes ativas</h3>
              <p className="modal-desc">Todas as suas bicicletas ja estao marcadas como furtadas ou nao possuem rastreamento ativo.</p>
              <button className="btn-cancel" onClick={() => setAlertStep('none')}>Fechar</button>
            </>)}
            {alertStep === 'select' && (<>
              <div className="modal-icon">?</div>
              <h3 className="modal-title">Qual bicicleta foi furtada?</h3>
              {bikes.filter((b) => b.status === 'Ativa').map((b) => (
                <button key={b.id} className="modal-bike-item" onClick={() => { setSelectedBike(b); setAlertStep('confirm'); }}>
                  <IoBicycle size={22} color="#FFC107" /><span className="modal-bike-text">{b.marca} {b.modelo}</span>
                </button>
              ))}
              <button className="btn-cancel" onClick={() => { setAlertStep('none'); }}>Cancelar</button>
            </>)}
            {alertStep === 'confirm' && selectedBike && (<>
              <div className="modal-icon" style={{color:'#F44336'}}>!</div>
              <h3 className="modal-title">Confirmar Alerta de Furto</h3>
              <p className="modal-desc">Deseja marcar "{selectedBike.marca} {selectedBike.modelo}" como furtada e enviar alerta?</p>
              <button className="btn-confirm red" onClick={doConfirm} disabled={alertLoading}>{alertLoading ? 'Enviando...' : 'Confirmar Alerta'}</button>
              <button className="btn-cancel" onClick={() => { setAlertStep('none'); setSelectedBike(null); }}>Cancelar</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
