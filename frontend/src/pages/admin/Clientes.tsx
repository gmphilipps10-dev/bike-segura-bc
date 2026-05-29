import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, Phone, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = '/bike-segura-bc-backend/api';

interface Cliente {
  _id: string;
  name: string;
  email: string;
  phone: string;
  plano: string;
  createdAt: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setClientes(Array.isArray(data) ? data : []);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [token]);

  const filtrados = busca
    ? clientes.filter(c =>
        c.name?.toLowerCase().includes(busca.toLowerCase()) ||
        c.email?.toLowerCase().includes(busca.toLowerCase()) ||
        c.phone?.includes(busca)
      )
    : clientes;

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
            <Users className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Clientes</h1>
              <p className="text-xs text-slate-400">{clientes.length} cadastrados</p>
            </div>
          </div>
        </motion.header>

        <div className="glass-card flex items-center gap-2 px-3 py-2 mb-4">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input type="text" placeholder="Buscar por nome, email ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600" />
        </div>

        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0">
                    <span className="text-[#0c1222] font-bold text-sm">{c.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{c.name || 'Sem nome'}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-slate-500 text-[10px] flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email || '-'}</span>
                      <span className="text-slate-500 text-[10px] flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone || '-'}</span>
                    </div>
                  </div>
                  <span className="text-slate-600 text-[10px] flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" /> {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
