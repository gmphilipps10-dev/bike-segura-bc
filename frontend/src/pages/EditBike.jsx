import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const TIPOS_BIKE = ['Urbana','MTB','Speed/Road','BMX','Gravel','Dobravel','Infantil'];
const TIPOS_ELET = ['Bike Eletrica','Patinete Eletrico','Monociclo','Ciclomotor/Scooter'];

export default function EditBike() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ marca: '', modelo: '', cor: '', numero_serie: '', tipo: '', caracteristicas: '', link_rastreamento: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.getBike(id).then((b) => {
      setForm({ marca: b.marca||'', modelo: b.modelo||'', cor: b.cor||'', numero_serie: b.numero_serie||'', tipo: b.tipo||'', caracteristicas: b.caracteristicas||'', link_rastreamento: b.link_rastreamento||'' });
      setFetching(false);
    }).catch(() => navigate('/bikes'));
  }, [id]);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSave = async () => {
    if (!form.marca || !form.modelo || !form.cor) { alert('Marca, modelo e cor obrigatorios'); return; }
    setLoading(true);
    try {
      await api.updateBike(id, form);
      navigate(`/bike/${id}`);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="header-back">
        <button className="back-btn" onClick={() => navigate(-1)}>2190</button>
        <h2>Editar Bicicleta</h2>
      </div>
      <div className="page-content">
        <div className="form-group"><label>Marca *</label><input className="form-input" value={form.marca} onChange={(e) => update('marca', e.target.value)} /></div>
        <div className="form-group"><label>Modelo *</label><input className="form-input" value={form.modelo} onChange={(e) => update('modelo', e.target.value)} /></div>
        <div className="form-group"><label>Cor *</label><input className="form-input" value={form.cor} onChange={(e) => update('cor', e.target.value)} /></div>
        <div className="form-group"><label>Numero de Serie</label><input className="form-input" value={form.numero_serie} onChange={(e) => update('numero_serie', e.target.value)} /></div>
        <div className="form-group">
          <label>Categoria</label>
          <div className="type-group-label">Bicicletas</div>
          <div className="type-chips">{TIPOS_BIKE.map((t) => <button key={t} className={`type-chip ${form.tipo===t?'active':''}`} onClick={() => update('tipo',t)}>{t}</button>)}</div>
          <div className="type-group-label">Eletricas e Motorizados</div>
          <div className="type-chips">{TIPOS_ELET.map((t) => <button key={t} className={`type-chip ${form.tipo===t?'active':''}`} onClick={() => update('tipo',t)}>{t}</button>)}</div>
        </div>
        <div className="form-group"><label>Caracteristicas</label><textarea className="form-textarea" value={form.caracteristicas} onChange={(e) => update('caracteristicas', e.target.value)} /></div>
        <div className="form-group"><label>Link de Rastreamento</label><input className="form-input" value={form.link_rastreamento} onChange={(e) => update('link_rastreamento', e.target.value)} /><p className="hint">URL do rastreador GPS</p></div>
        <button className="btn-edit" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'OK  SALVAR ALTERACOES'}</button>
      </div>
    </div>
  );
}
