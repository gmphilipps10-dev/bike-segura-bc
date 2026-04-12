import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { IoArrowBack, IoTrash, IoCreate, IoLocation, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

const PHOTO_LABELS = { frente: 'Frente', tras: 'Traseira', lateral_direita: 'Lat. Direita', lateral_esquerda: 'Lat. Esquerda', numero_quadro: 'N. Quadro' };

export default function BikeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => { api.getBike(id).then(setBike).catch(() => navigate('/bikes')); }, [id]);

  if (!bike) return <div className="loading-screen"><div className="spinner"></div></div>;

  const isFurtada = bike.status === 'Furtada';
  const fotos = bike.fotos && typeof bike.fotos === 'object' ? bike.fotos : {};
  const fotoList = Object.entries(fotos).filter(([,v]) => v);

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta bicicleta?')) {
      api.deleteBike(id).then(() => navigate('/bikes')).catch((e) => alert(e.message));
    }
  };

  const handleRecuperar = async () => {
    setRecLoading(true);
    try {
      const updated = await api.recuperar(id);
      setBike(updated);
      setShowRecuperar(false);
    } catch (e) { alert(e.message); }
    finally { setRecLoading(false); }
  };

  const handleTracking = () => {
    if (bike.link_rastreamento) window.open(bike.link_rastreamento, '_blank');
    else alert('Nenhum link de rastreamento cadastrado.');
  };

  return (
    <div>
      <div className="detail-header">
        <button className="icon-btn" onClick={() => navigate('/bikes')} style={{color:'#FFC107'}}><IoArrowBack size={24} /></button>
        <span style={{color:'#fff',fontWeight:'bold',fontSize:18}}>Detalhes</span>
        <div className="detail-actions">
          <button className="icon-btn" onClick={() => navigate(`/edit-bike/${id}`)} style={{color:'#FFC107'}}><IoCreate size={22} /></button>
          <button className="icon-btn" onClick={handleDelete} style={{color:'#F44336'}}><IoTrash size={22} /></button>
        </div>
      </div>

      <div className={`status-banner ${isFurtada ? 'stolen' : 'active'}`}>
        {isFurtada ? <IoAlertCircle size={20} color="#F44336" /> : <IoCheckmarkCircle size={20} color="#4CAF50" />}
        <span className="status-text" style={{color: isFurtada ? '#F44336' : '#4CAF50'}}>{isFurtada ? 'Furtada (rastreamento ativo)' : 'Ativa (monitorando)'}</span>
      </div>

      {isFurtada && (
        <div style={{padding:'0 16px 16px'}}>
          <button className="alert-button" onClick={handleTracking} style={{marginBottom:8}}><IoLocation size={20} /> Ver Localizacao</button>
          <button className="btn-recover" onClick={() => setShowRecuperar(true)}><IoCheckmarkCircle size={22} /> MARCAR COMO RECUPERADA</button>
        </div>
      )}

      {!isFurtada && bike.link_rastreamento && (
        <div style={{padding:'0 16px 8px'}}>
          <button className="alert-button" onClick={handleTracking} style={{background:'#4CAF50'}}><IoLocation size={20} /> Ver Localizacao</button>
        </div>
      )}

      {fotoList.length > 0 && (
        <div className="section">
          <h3 className="section-title">Fotos</h3>
          <div className="photo-grid">
            {fotoList.map(([key, val]) => (
              <div key={key} className="photo-slot"><img src={val} alt={PHOTO_LABELS[key]} /><div className="label">{PHOTO_LABELS[key]}</div></div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">Detalhes</h3>
        <div className="info-row"><div className="info-label">Marca / Modelo</div><div className="info-value">{bike.marca} {bike.modelo}</div></div>
        <div className="info-row"><div className="info-label">Cor</div><div className="info-value">{bike.cor}</div></div>
        <div className="info-row"><div className="info-label">Categoria</div><div className="info-value">{bike.tipo}</div></div>
        <div className="info-row"><div className="info-label">Numero de Serie</div><div className="info-value">{bike.numero_serie}</div></div>
        {bike.caracteristicas && <div className="info-row"><div className="info-label">Caracteristicas</div><div className="info-value">{bike.caracteristicas}</div></div>}
        <button className="btn-edit" onClick={() => navigate(`/edit-bike/${id}`)}>EDITAR  EDITAR CADASTRO</button>
      </div>

      {showRecuperar && (
        <div className="modal-overlay">
          <div className="modal-box green">
            <div className="modal-icon" style={{color:'#4CAF50'}}>OK </div>
            <h3 className="modal-title">Recuperar Bicicleta</h3>
            <p className="modal-desc">Confirma que "{bike.marca} {bike.modelo}" foi recuperada?</p>
            <button className="btn-confirm green" onClick={handleRecuperar} disabled={recLoading}>{recLoading ? 'Atualizando...' : 'CONFIRMAR RECUPERACAO'}</button>
            <button className="btn-cancel" onClick={() => setShowRecuperar(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
