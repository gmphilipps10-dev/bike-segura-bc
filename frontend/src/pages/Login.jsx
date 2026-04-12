import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-page" onSubmit={handleSubmit}>
      <img src="/logo.jpg" alt="Bike Segura BC" />
      <div className="form-group">
        <label>E-mail</label>
        <input className="form-input" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Senha</label>
        <input className="form-input" type="password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      </div>
      {error && <p className="error-msg">{error}</p>}
      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      <button type="button" className="btn-link" onClick={() => navigate('/register')}>Nao tem conta? Cadastre-se</button>
    </form>
  );
}
