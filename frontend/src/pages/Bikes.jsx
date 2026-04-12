import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { IoAdd } from 'react-icons/io5';

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { api.getBikes().then(setBikes).catch(() => {}); }, []);

  return (
    <div>
      <div className="header-back">
        <h2>Minhas Bicicletas</h2>
      </div>
      <div className="page-content">
        {bikes.map((b) => {
          const thumb = b.fotos?.frente || b.fotos?.lateral_direita || '';
          const isFurtada = b.status === 'Furtada';
          return (
            <div key={b.id} className="bike-item" onClick={() => navigate(`/bike/${b.id}`)}>
              {thumb ? <img src={thumb} className="bike-thumb" alt="" /> : <div className="bike-thumb" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🚲</div>}
              <div className="bike-info">
                <div className="bike-name">{b.marca} {b.modelo}</div>
                <div className="bike-type">{b.tipo} &bull; {b.cor}</div>
              </div>
              <span className={`bike-status ${isFurtada ? 'stolen' : 'active'}`}>{isFurtada ? 'Furtada' : 'Ativa'}</span>
            </div>
          );
        })}
        {bikes.length === 0 && <p style={{textAlign:'center',color:'#999',padding:40}}>Nenhuma bicicleta cadastrada</p>}
        <button className="btn-edit" onClick={() => navigate('/add-bike')} style={{marginTop:16}}><IoAdd size={22} /> Cadastrar Nova Bike</button>
      </div>
    </div>
  );
}
