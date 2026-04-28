import React, { useState, useEffect } from 'react';
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
    const [bikes, setBikes] = useState([]);
    const [selectedBike, setSelectedBike] = useState(null);
    const [loadingBikes, setLoadingBikes] = useState(true);
    useEffect(() => {
        const fetchBikes = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoadingBikes(false);
                return;
            }
            
            try {
                const response = await fetch('/api/bikes', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setBikes(data || []);
                }
            } catch (error) {
                console.error('Erro ao buscar bikes:', error);
            } finally {
                setLoadingBikes(false);
            }
        };
        
        fetchBikes();
    }, []);

    const handleAssinar = async (plano, periodicidade) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para assinar um plano.');
        return;
    }
        if (!selectedBike) {
    alert('Selecione uma bike primeiro.');
    return;
}

    try {
        const response = await fetch('/api/billing/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
    bike_id: selectedBike.id,
    billing_cycle: periodicidade === 'mensal' ? 'MONTHLY' : 'ANNUAL',
    billing_type: 'UNDEFINED'
})
        });

        const data = await response.json();

        if (response.ok && data.success) {
    alert('Assinatura criada com sucesso! ID: ' + data.data.subscription_id);
} else {
            alert(data.detail || 'Erro ao criar assinatura. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
};

    return (
        <div>
            <div className="header-back">
                <button className="back-btn" onClick={() => navigate(-1)}><IoArrowBack /></button>
                <h2>Planos Bike Segura BC</h2>
            </div>
            {loadingBikes ? (
    <p style={{textAlign: 'center', color: '#fff'}}>Carregando suas bikes...</p>
) : bikes.length === 0 ? (
    <div style={{textAlign: 'center', padding: '20px', color: '#fff'}}>
        <p>Você não tem bikes cadastradas.</p>
        <button 
            onClick={() => navigate('/cadastrar')}
            style={{
                padding: '10px 20px',
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '10px'
            }}
        >
            Cadastrar Bike
        </button>
    </div>
) : (
    <div style={{marginBottom: '20px'}}>
        <h3 style={{color: '#FFD700', marginBottom: '10px'}}>Selecione a bike para proteger:</h3>
        {bikes.map(bike => (
            <div 
                key={bike.id}
                onClick={() => setSelectedBike(bike)}
                style={{
                    padding: '15px',
                    margin: '10px 0',
                    border: selectedBike?.id === bike.id ? '2px solid #FFD700' : '1px solid #555',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: selectedBike?.id === bike.id ? '#333' : 'transparent',
                    color: '#fff'
                }}
            >
                <p><strong>{bike.modelo || 'Bike'}</strong> - {bike.marca}</p>
                <p style={{fontSize: '12px', color: '#aaa'}}>Cor: {bike.cor} | Série: {bike.numero_serie}</p>
            </div>
        ))}
    </div>
)}
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
