import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoCardOutline } from 'react-icons/io5';
export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const maskCPF = (cpf) => cpf ? cpf.replace(/(\d{3})\.?(\d{3})\.?(\d{3})\-?(\d{2})/, '$1.***.***-$4') : '';

  const handlePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { default: apiMod } = await import('../utils/api');
          const updated = await apiMod.api.updateFotoPerfil(reader.result);
          updateUser(updated);
        } catch (err) { alert(err.message); }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <div>
      <div className="header-back"><h2>Meu Perfil</h2></div>
      <div className="profile-header">
        <img src={user.foto_perfil || '/icon-192.png'} alt="" className="profile-photo" onClick={handlePhoto} />
        <div className="profile-name">{user.nome_completo}</div>
        <div className="profile-email">{user.email}</div>
        <p style={{color:'#666',fontSize:12,marginTop:4}}>Toque na foto para alterar</p>
      </div>
      <div>
        <div className="profile-field"><span className="profile-field-label">CPF</span><span className="profile-field-value">{maskCPF(user.cpf)}</span></div>
        <div className="profile-field"><span className="profile-field-label">Telefone</span><span className="profile-field-value">{user.telefone}</span></div>
        <div className="profile-field"><span className="profile-field-label">Email</span><span className="profile-field-value">{user.email}</span></div>
      </div>
      <div className="profile-section" style={{marginTop: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333'}}>
    <h3 style={{color: '#FFD700', marginBottom: '10px', fontSize: '16px'}}>💳 Plano de Assinatura</h3>
    <p style={{color: '#aaa', fontSize: '13px', marginBottom: '15px'}}>
        Proteja sua bike com nossos planos de rastreamento
    </p>
    <button 
        className="btn-edit" 
        onClick={() => navigate('/plans')}
        style={{
            width: '100%',
            padding: '12px',
            background: '#FFD700',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        }}
    >
        <IoCardOutline /> Ver Planos
    </button>
</div>
      <button className="btn-logout" onClick={handleLogout}>Sair da Conta</button>
    </div>
  );
}
