import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bike, Search, Shield, ShieldAlert, MapPin, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = '/bike-segura-bc-backend/api';

interface Equip {
  _id: string;
  name: string;
  brand: string;
  type: string;
  serie: string;
  color: string;
  status: string;
  protected: boolean;
  hash?: string;
  stickerNumber?: string;
  photo?: string | null;
  createdAt: string;
}

export default function EquipamentosAdmin() {
  const [equips, setEquips] = useState<Equip[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'normal' | 'furto'>('todos');
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch(`${API_BASE}/bikes/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEquips(Array.isArray(data) ? data : []);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [token]);

  let filtrados = equips;
  if (busca) {
    filtrados = filtrados.filter(e =>
      e.name?.toLowerCase().includes(busca.toLowerCase()) ||
      e.serie?.toLowerCase().includes(busca.toLowerCase()) ||
      e.brand?.toLowerCase().includes(busca.toLowerCase())
    );
  }
  if (filtroStatus !== 'todos') {
    filtrados = filtrados.filter(e => e.status === filtroStatus);
  }

  const totalNormal = equips.filter(e => e.status === 'normal').length;
  const totalFurto = equips.filter(e => e.status === 'furto').length;

  return (
    <div className="min-h-screen bg-[#0c1222] relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-6 pb-8">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Bike className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Equipamentos</h1>
              <p className="text-xs text-slate-400">{equips.length} cadastrados - {totalNormal} OK / {totalFurto} furtados</p>
            </div>
          </div>
        </motion.header>

        <div className="glass-card flex items-center gap-2 px-3 py-2 mb-3">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input type="text" placeholder="Buscar por nome, marca ou serie..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600" />
        </div>

        <div className="flex gap-2 mb-4">
          {(['todos', 'normal', 'furto'] as const).map(f => (
            <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${filtroStatus === f ? 'bg-amber-400 text-[#0c1222]' : 'glass-card text-slate-400'}`}>
              {f === 'todos' ? 'TODOS' : f === 'normal' ? 'ATIVOS' : 'FURTADOS'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Bike className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum equipamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((eq, i) => (
              <motion.div key={eq._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.01, 0.3) }} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  {eq.photo ? (
                    <img src={eq.photo} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-500/20 flex items-center justify-center shrink-0">
                      <Bike className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{eq.name || eq.brand}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${eq.status === 'furto' ? 'bg-red-500/20 text-red-400' : eq.protected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {eq.status === 'furto' ? 'FURTADO' : eq.protected ? 'PROTEGIDO' : 'REGULAR'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px]">{eq.type} - {eq.color}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-slate-600 text-[9px] font-mono">{eq.serie}</span>
                      {eq.stickerNumber && <span className="text-amber-400 text-[9px] font-mono flex items-center gap-1"><QrCode className="w-2.5 h-2.5" />{eq.stickerNumber}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
