import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { IoAlertCircle, IoWarning, IoLocation, IoBicycle, IoShieldCheckmark, IoAddCircle, IoLogoWhatsapp } from 'react-icons/io5';

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
  const monitorando = bikes.filter((b) => b.status === 'Ativa').length;
  const furtadas = bikes.filter((b) => b.status === 'Furtada').length;
  const firstName = user?.nome_completo?.split(' ')[0] || 'Usuario';

  const handleAlerta = () => {
    const ativas = bikes.filter((b) => b.status === 'Ativa');
    if (ativas.length === 0) { setAlertStep('no-bikes'); return; }
    if (ativas.length === 1) { setSelectedBike(ativas[0]); setAlertStep('confirm'); return; }
    setAlertStep('select');
  };

  const buildMsg = (b) => `🚨 ALERTA DE FURTO 🚨\n\nBike: ${b.marca} ${b.modelo}\nCor: ${b.cor}\nSerie: ${b.numero_serie}\n\nUltima localizacao:\n${b.link_rastreamento || 'Nao cadastrado'}\n\nBike cadastrada no sistema Bike Segura BC.\nSolicito apoio para verificacao.`;

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

  return (
    <div>
      <div className="header"><img src="/logo.jpg" alt="Bike Segura BC" /></div>
      {totalBikes > 0 && (
        <div className="monitor-bar"><div className="pulse"></div><span className="monitor-text">{monitorando} bike{monitorando !== 1 ? 's' : ''} sendo monitorada{monitorando !== 1 ? 's' : ''}</span></div>
      )}
      <div className="greeting-section">
        <h1 className="greeting">Ola, {firstName}!</h1>
        <p className="subtitle">Central de Monitoramento</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><span className="stat-icon">🚲</span><div className="stat-number" style={{color:'#FFC107'}}>{totalBikes}</div><div className="stat-label">Total</div></div>
        <div className="stat-card"><span className="stat-icon">🛡</span><div className="stat-number" style={{color:'#4CAF50'}}>{monitorando}</div><div className="stat-label">Monitorando</div></div>
        {furtadas > 0 && <div className="stat-card danger"><span className="stat-icon">⚠</span><div className="stat-number" style={{color:'#F44336'}}>{furtadas}</div><div className="stat-label">Furtadas</div></div>}
      </div>

      {totalBikes > 0 && (
        <button className="alert-furto-btn" onClick={handleAlerta}>
          <IoAlertCircle size={28} />
          <div className="btn-content"><div className="btn-title">ALERTAR FURTO</div><div className="btn-sub">Alerta via WhatsApp + Rastreamento</div></div>
          <IoLogoWhatsapp size={24} />
        </button>
      )}

      {furtadas > 0 && (
        <div className="alert-section">
          <div className="alert-header"><IoWarning size={24} color="#F44336" /><span className="alert-title">RASTREAMENTO ATIVO</span></div>
          <p className="alert-text">{furtadas} bicicleta{furtadas > 1 ? 's' : ''} furtada{furtadas > 1 ? 's' : ''}. Acesse a localizacao para rastrear.</p>
          <button className="alert-button" onClick={() => navigate('/bikes')}><IoLocation size={20} /> Ver Localizacao</button>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">Acesso Rapido</h3>
        <button className="action-card" onClick={() => navigate('/bikes')}><div className="action-icon" style={{background:'#FFC107'}}><IoBicycle size={24} color="#000" /></div><div className="action-content"><div className="action-title">Minhas Bicicletas</div><div className="action-subtitle">Ver e rastrear bikes cadastradas</div></div></button>
        <button className="action-card" onClick={() => window.open('https://delegaciavirtual.sc.gov.br/','_blank')}><div className="action-icon" style={{background:'#2196F3'}}><IoShieldCheckmark size={24} color="#fff" /></div><div className="action-content"><div className="action-title">Delegacia Virtual SC</div><div className="action-subtitle">Registrar boletim de ocorrencia</div></div></button>
        {totalBikes === 0 && (
          <button className="action-card" onClick={() => navigate('/add-bike')}><div className="action-icon" style={{background:'#4CAF50'}}><IoAddCircle size={24} color="#fff" /></div><div className="action-content"><div className="action-title">Cadastrar Primeira Bike</div><div className="action-subtitle">Proteja sua bicicleta agora</div></div></button>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">Dicas de Seguranca</h3>
        <div className="tip-card"><span className="tip-icon">📍</span><span className="tip-text">Cadastre o link do rastreador para acesso rapido</span></div>
        <div className="tip-card"><span className="tip-icon">📷</span><span className="tip-text">Tire fotos de todos os angulos da sua bike</span></div>
        <div className="tip-card"><span className="tip-icon">🔑</span><span className="tip-text">Anote o numero de serie em local seguro</span></div>
      </div>

      {installPrompt && (
        <div className="install-banner">
          <img src="/logo.jpg" alt="" />
          <p>Instale o app para acesso rapido</p>
          <div className="btns">
            <button className="btn-install" onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}>Instalar App</button>
            <button className="btn-dismiss" onClick={() => setInstallPrompt(null)}>Agora nao</button>
          </div>
        </div>
      )}

      {alertStep !== 'none' && (
        <div className="modal-overlay">
          <div className="modal-box">
            {alertStep === 'no-bikes' && (<>
              <div className="modal-icon">ℹ</div>
              <h3 className="modal-title">Sem bikes ativas</h3>
              <p className="modal-desc">Todas as suas bicicletas ja estao marcadas como furtadas. Marque como recuperada primeiro.</p>
              <button className="btn-cancel" onClick={() => setAlertStep('none')}>Entendi</button>
            </>)}
            {alertStep === 'select' && (<>
              <div className="modal-icon">⚠</div>
              <h3 className="modal-title">Qual bicicleta foi furtada?</h3>
              {bikes.filter((b) => b.status === 'Ativa').map((b) => (
                <button key={b.id} className="modal-bike-item" onClick={() => { setSelectedBike(b); setAlertStep('confirm'); }}>
                  <IoBicycle size={22} color="#FFC107" /><span className="modal-bike-text">{b.marca} {b.modelo}</span><span>&rsaquo;</span>
                </button>
              ))}
              <button className="btn-cancel" onClick={() => { setAlertStep('none'); setSelectedBike(null); }}>Cancelar</button>
            </>)}
            {alertStep === 'confirm' && selectedBike && (<>
              <div className="modal-icon" style={{color:'#F44336'}}>🚨</div>
              <h3 className="modal-title">Confirmar Alerta de Furto</h3>
              <p className="modal-desc">Deseja marcar "{selectedBike.marca} {selectedBike.modelo}" como furtada e enviar alerta via WhatsApp?</p>
              <button className="btn-confirm red" onClick={doConfirm} disabled={alertLoading}><IoLogoWhatsapp size={20} /> {alertLoading ? 'Enviando...' : 'CONFIRMAR E ENVIAR ALERTA'}</button>
              <button className="btn-cancel" onClick={() => { setAlertStep('none'); setSelectedBike(null); }}>Cancelar</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
