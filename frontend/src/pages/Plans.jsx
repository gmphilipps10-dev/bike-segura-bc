import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmarkCircle, IoArrowBack } from 'react-icons/io5';

const PLANOS = [
    {
        key: 'tag',
        nome: 'TAG',
        rastreamento: 'QR Code/Placa',
        mensal: 9.99,
        anual: 119.88,
        features: ['Placa QR com identificação', 'Acesso ao app Bike Segura BC', 'Suporte via WhatsApp', 'Alerta de furto']
    },
    {
        key: 'gps',
        nome: 'GPS',
        rastreamento: 'Rastreador GPS',
        mensal: 19.99,
        anual: 239.88,
        features: ['Rastreador GPS em tempo real', 'Acesso ao app Bike Segura BC', 'Suporte prioritário', 'Alerta de furto instantâneo', 'Histórico de rotas']
    },
    {
        key: 'tag_gps',
        nome: 'Completo',
        rastreamento: 'TAG + GPS',
        mensal: 24.99,
        anual: 299.88,
        features: ['Placa QR + Rastreador GPS', 'Acesso completo ao app', 'Suporte VIP 24h', 'Alerta de furto instantâneo', 'Histórico de rotas', 'Recuperação assistida']
    }
];

export default function Plans() {
    const navigate = useNavigate();

    const handleAssinar = (plano, periodicidade) => {
    const valor = periodicidade === 'mensal' ? plano.mensal : plano.anual;
    // Aqui vamos redirecionar para o Mercado Pago
    alert(`Redirecionando para pagamento...\nPlano: ${plano.nome}\nPeriodicidade: ${periodicidade}\nValor: R$ ${valor.toFixed(2)}`);
};

    return (
        <div>
            <div className="header-back">
                <button className="back-btn" onClick={() => navigate(-1)}><IoArrowBack /></button>
                <h2>Planos Bike Segura BC</h2>
            </div>
            <div className="page-content">
                <p style={{textAlign: 'center', marginBottom: '20px', color: '#aaa'}}>
                    Escolha o plano ideal para proteger sua bike
                </p>
                
                {PLANOS.map((plano) => (
                    <div key={plano.key} className="plan-card" style={{
                        background: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <h3 style={{color: '#FFD700', margin: 0}}>{plano.nome}</h3>
                            <span style={{color: '#aaa', fontSize: '12px'}}>{plano.rastreamento}</span>
                        </div>
                        
                        <ul style={{listStyle: 'none', padding: 0, margin: '15px 0'}}>
                            {plano.features.map((f, i) => (
                                <li key={i} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#ccc', fontSize: '14px'}}>
                                    <IoCheckmarkCircle color="#FFD700" /> {f}
                                </li>
                            ))}
                        </ul>
                        
                        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                            <button 
                                onClick={() => handleAssinar(plano, 'mensal')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#333',
                                    color: '#fff',
                                    border: '1px solid #FFD700',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Mensal<br/>
                                <strong style={{color: '#FFD700'}}>R$ {plano.mensal.toFixed(2)}</strong>
                            </button>
                            <button 
                                onClick={() => handleAssinar(plano, 'anual')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#FFD700',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Anual<br/>
                                <strong>R$ {plano.anual.toFixed(2)}</strong>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
