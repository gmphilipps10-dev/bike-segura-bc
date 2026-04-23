import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ nome_completo: '', cpf: '', data_nascimento: '', telefone: '', email: '', senha: '' });
  const [foto, setFoto] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!foto) { setError('Foto de perfil obrigatória'); return; }
    setLoading(true);
    try {
        const userData = {
            nome_completo: form.nome_completo,
            cpf: form.cpf,
            data_nascimento: form.data_nascimento,
            telefone: form.telefone,
            email: form.email,
            senha: form.senha,
            foto_perfil: foto
        };
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || JSON.stringify(errorData));
        }
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        navigate('/');
    } catch (err) {
        setError(err.message || 'Erro ao cadastrar');
    } finally {
        setLoading(false);
    }
};

  const update = (k, v) => setForm({ ...form, [k]: v });

  return (
    <form className="form-page" onSubmit={handleSubmit} style={{ paddingTop: 20 }}>
      <img src="/logo.jpg" alt="Bike Segura BC" style={{ width: 140, marginBottom: 20 }} />
      <div className="form-group" style={{ textAlign: 'center' }}>
        <label>Foto de Perfil *</label>
        {foto && <img src={foto} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '8px auto', display: 'block' }} />}
        <input type="file" accept="image/*" onChange={handlePhoto} style={{ color: '#999', fontSize: 14, marginTop: 8 }} />
      </div>
      {['nome_completo','cpf','dataNascimento','telefone','email','senha'].map((k) => (
        <div className="form-group" key={k}>
          <label>{k === 'nome_completo' ? 'Nome Completo *' : k === 'cpf' ? 'CPF *' : k === 'dataNascimento' ? 'Data Nascimento' : k === 'telefone' ? 'Telefone *' : k === 'email' ? 'E-mail *' : 'Senha *'}</label>
          <input className="form-input" type={k === 'senha' ? 'password' : k === 'email' ? 'email' : k === 'dataNascimento' ? 'date' : 'text'} value={form[k]} onChange={(e) => update(k, e.target.value)} required={k !== 'dataNascimento'} placeholder={k === 'cpf' ? '000.000.000-00' : k === 'telefone' ? '(00) 00000-0000' : ''} />
        </div>
      ))}
      {error && <p className="error-msg">{error}</p>}
      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
      <button type="button" className="btn-link" onClick={() => navigate('/login')}>Ja tem conta? Entrar</button>
    </form>
  );
}
