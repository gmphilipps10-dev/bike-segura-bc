const API = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export const api = {
  login: async (email, senha) => {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Erro ao fazer login'); }
    return r.json();
  },
  register: async (data) => {
    const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Erro ao cadastrar'); }
    return r.json();
  },
  getMe: async (token) => {
    const r = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` } });
    if (!r.ok) throw new Error('Nao autenticado');
    return r.json();
  },
  updateProfile: async (data) => {
    const r = await fetch(`${API}/auth/profile`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Erro'); }
    return r.json();
  },
  updateFotoPerfil: async (foto) => {
    const r = await fetch(`${API}/auth/foto-perfil`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ foto_perfil: foto }) });
    if (!r.ok) throw new Error('Erro ao atualizar foto');
    return r.json();
  },
  getBikes: async () => {
    const r = await fetch(`${API}/bikes`, { headers: getHeaders() });
    if (!r.ok) throw new Error('Erro ao carregar bikes');
    return r.json();
  },
  getBike: async (id) => {
    const r = await fetch(`${API}/bikes/${id}`, { headers: getHeaders() });
    if (!r.ok) throw new Error('Bike nao encontrada');
    return r.json();
  },
  createBike: async (data) => {
    const r = await fetch(`${API}/bikes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Erro ao cadastrar bike'); }
    return r.json();
  },
  updateBike: async (id, data) => {
    const r = await fetch(`${API}/bikes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Erro ao atualizar'); }
    return r.json();
  },
  deleteBike: async (id) => {
    const r = await fetch(`${API}/bikes/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!r.ok) throw new Error('Erro ao excluir');
    return r.json();
  },
  alertFurto: async (id) => {
    const r = await fetch(`${API}/bikes/${id}/alert-furto`, { method: 'POST', headers: getHeaders() });
    if (!r.ok) throw new Error('Erro ao acionar alerta');
    return r.json();
  },
  recuperar: async (id) => {
    const r = await fetch(`${API}/bikes/${id}/recuperar`, { method: 'POST', headers: getHeaders() });
    if (!r.ok) throw new Error('Erro ao recuperar bike');
    return r.json();
  },
};
