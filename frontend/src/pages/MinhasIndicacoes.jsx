import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoPeople, IoGift } from 'react-icons/io5';

export default function MinhasIndicacoes() {
  const navigate = useNavigate();
  const [indicacoes, setIndicacoes] = useState({ total_indicacoes: 0, desconto_acumulado: 0, indicados: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIndicacoes = async () => {
      try {
        const res = await fetch('/api/auth/minhas-indicacoes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIndicacoes(data);
        }
      } catch (e) {}
      finally { setLoading(false); }
    };
    loadIndicacoes();
  }, []);

  return (
    <div>
      <div className="header-back">
        <button className="back-btn" onClick={() => navigate('/')}><IoArrowBack /></button>
        <h2>Minhas Indicações</h2>
      </div>
      <div className="page-content">
        <div style={{ background: '#1a1a1a', border: '1px solid #FFC107', borderRadius: '12px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <IoGift size={40} color="#FFC107" />
          <h3 style={{ color: '#FFC107', marginTop: '10px', fontSize: '24px' }}>{indicacoes.desconto_acumulado}% de Desconto</h3>
          <p style={{ color: '#999', fontSize: '14px' }}>{indicacoes.total_indicacoes} indicação(ões)</p>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>Cada novo cliente = 10% de desconto<br/>Acumule até 100%</p>
        </div>
        <h3 style={{ color: '#FFC107', fontSize: '16px', marginBottom: '12px' }}>Clientes Indicados</h3>
        {loading ? <p style={{color:'#999',textAlign:'center'}}>Carregando...</p> : indicacoes.indicados.length === 0 ? (
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
            <IoPeople size={40} color="#666" />
            <p style={{ color: '#999', marginTop: '10px' }}>Você ainda não indicou ninguém.</p>
            <button onClick={() => navigate('/')} style={{ background: '#FFC107', color: '#000', border: 'none', borderRadius: '8px', padding: '12px 20px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Indicar Agora</button>
          </div>
        ) : indicacoes.indicados.map((indicado, index) => (
          <div key={indicado.id} style={{ background: '#000', border: '1px solid #FFC107', borderRadius: '12px', padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFC107', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>{index + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: '600' }}>{indicado.nome}</div>
              <div style={{ color: '#999', fontSize: '12px' }}>{indicado.email}</div>
            </div>
            <div style={{ background: '#22C55E', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>+10%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
