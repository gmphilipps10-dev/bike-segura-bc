import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { IoArrowBack, IoCamera, IoClose } from 'react-icons/io5';

const PHOTO_SLOTS = [
  { key: 'frente', label: 'Frente' },
  { key: 'tras', label: 'Traseira' },
  { key: 'lateral_direita', label: 'Lat. Direita' },
  { key: 'lateral_esquerda', label: 'Lat. Esquerda' },
  { key: 'numero_quadro', label: 'N. Quadro' },
];
const TIPOS_BIKE = ['Urbana','MTB','Speed/Road','BMX','Gravel','Dobravel','Infantil'];
const TIPOS_ELET = ['Bike Eletrica','Patinete Eletrico','Monociclo','Ciclomotor/Scooter'];
const TIPOS_RASTREAMENTO = [
    { key: 'tag', label: 'TAG (QR Code/Placa)' },
    { key: 'gps', label: 'Rastreador GPS' },
    { key: 'tag_gps', label: 'TAG + GPS (Completo)' }
];
export default function AddBike() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ marca: '', modelo: '', cor: '', numero_serie: '', tipo: 'Urbana', caracteristicas: '', link_rastreamento: '', tipo_rastreamento: 'tag' });
  const [fotos, setFotos] = useState({});
  const [notaFiscal, setNotaFiscal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm({ ...form, [k]: v });

  const pickPhoto = (key) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setFotos((p) => ({ ...p, [key]: reader.result }));
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const pickNota = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*,application/pdf';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setNotaFiscal(reader.result);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!form.marca || !form.modelo || !form.cor || !form.numero_serie) { setError('Preencha marca, modelo, cor e numero de serie'); return; }
    setLoading(true); setError('');
    try {
      await api.createBike({ ...form, fotos, nota_fiscal: notaFiscal || null });
      navigate('/bikes');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="header-back">
        <button className="back-btn" onClick={() => navigate(-1)}>2190</button>
        <h2>Cadastrar Bicicleta</h2>
      </div>
      <div className="page-content">
        <div className="form-group"><label>Marca *</label><input className="form-input" value={form.marca} onChange={(e) => update('marca', e.target.value)} placeholder="Ex: Caloi, Specialized" /></div>
        <div className="form-group"><label>Modelo *</label><input className="form-input" value={form.modelo} onChange={(e) => update('modelo', e.target.value)} placeholder="Ex: Elite, Tarmac" /></div>
        <div className="form-group"><label>Cor *</label><input className="form-input" value={form.cor} onChange={(e) => update('cor', e.target.value)} placeholder="Ex: Preta, Vermelha" /></div>
        <div className="form-group"><label>Numero de Serie *</label><input className="form-input" value={form.numero_serie} onChange={(e) => update('numero_serie', e.target.value)} placeholder="Numero gravado no quadro" /></div>

        <div className="form-group">
          <label>Categoria</label>
          <div className="type-group-label">Bicicletas</div>
          <div className="type-chips">{TIPOS_BIKE.map((t) => <button key={t} className={`type-chip ${form.tipo===t?'active':''}`} onClick={() => update('tipo',t)}>{t}</button>)}</div>
          <div className="type-group-label">Eletricas e Motorizados</div>
          <div className="type-chips">{TIPOS_ELET.map((t) => <button key={t} className={`type-chip ${form.tipo===t?'active':''}`} onClick={() => update('tipo',t)}>{t}</button>)}</div>
        </div>

        <div className="form-group"><label>Caracteristicas / Observacoes</label><textarea className="form-textarea" value={form.caracteristicas} onChange={(e) => update('caracteristicas', e.target.value)} placeholder="Acessorios, modificacoes..." /></div>
        <div className="form-group"><label>Link de Rastreamento</label><input className="form-input" value={form.link_rastreamento} onChange={(e) => update('link_rastreamento', e.target.value)} placeholder="https://..." /><p className="hint">URL do rastreador GPS</p></div>

        <div className="form-group">
          <label>Fotos da Bicicleta</label>
          <div className="photo-grid">
            {PHOTO_SLOTS.map((s) => (
              <div key={s.key} className="photo-slot" onClick={() => !fotos[s.key] && pickPhoto(s.key)}>
                {fotos[s.key] ? (<><img src={fotos[s.key]} alt={s.label} /><button className="photo-remove" onClick={(e) => { e.stopPropagation(); setFotos((p) => { const n={...p}; delete n[s.key]; return n; }); }}>x</button></>) : (<><IoCamera className="add-icon" size={24} /><span className="label">{s.label}</span></>)}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Nota Fiscal</label>
          {notaFiscal ? <div style={{position:'relative'}}><img src={notaFiscal} alt="NF" style={{width:'100%',borderRadius:8,maxHeight:200,objectFit:'contain',background:'#111'}} /><button className="photo-remove" onClick={() => setNotaFiscal('')}>x</button></div> : <button className="btn-edit" onClick={pickNota} style={{background:'#333',color:'#fff'}}>Selecionar Nota Fiscal</button>}
        </div>

        {error && <p className="error-msg">{error}</p>}
        <button className="btn-edit" onClick={handleSubmit} disabled={loading}>{loading ? 'Cadastrando...' : 'OK  CADASTRAR BICICLETA'}</button>
      </div>
    </div>
  );
}
