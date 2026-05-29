import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Users, Bike, QrCode, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = '/bike-segura-bc-backend/api';

export default function Relatorios() {
  const [stats, setStats] = useState({
    clientesHoje: 0, clientesMes: 0, clientesTotal: 0,
    equipHoje: 0, equipMes: 0, equipTotal: 0,
    adesivosDisp: 0, adesivosUsados: 0,
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetch = async () => {
      try {
        const [usersRes, bikesRes, qrRes] = await Promise.all([
          fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/preprinted`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        let users: any[] = [];
        let bikes: any[] = [];
        let qrData: any = {};

        if (usersRes.ok) { users = await usersRes.json(); users = Array.isArray(users) ? users : []; }
        if (bikesRes.ok) { bikes = await bikesRes.json(); bikes = Array.isArray(bikes) ? bikes : []; }
        if (qrRes.ok) { qrData = await qrRes.json(); }

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        setStats({
          clientesHoje: users.filter((u: any) => u.createdAt && new Date(u.createdAt) >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())).length,
          clientesMes: users.filter((u: any) => u.createdAt && new Date(u.createdAt) >= inicioMes).length,
          clientesTotal: users.length,
          equipHoje: 0,
          equipMes: 0,
          equipTotal: bikes.length,
          adesivosDisp: qrData.disponiveis || 0,
          adesivosUsados: qrData.vinculados || 0,
        });
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [token]);

  const sections = [
    { title: 'Clientes', icon: Users, items: [
      { label: 'Hoje', value: stats.clientesHoje },
      { label: 'Este mes', value: stats.clientesMes },
      { label: 'Total', value: stats.clientesTotal },
    ]},
    { title: 'Equipamentos', icon: Bike, items: [
      { label: 'Total cadastrados', value: stats.equipTotal },
    ]},
    { title: 'Adesivos QR', icon: QrCode, items: [
      { label: 'Disponiveis', value: stats.adesivosDisp },
      { label: 'Em uso', value: stats.adesivosUsados },
      { label: 'Total', value: stats.adesivosDisp + stats.adesivosUsados },
    ]},
  ];

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
            <Activity className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">Relatorios</h1>
          </div>
        </motion.header>

        {loading ? (
          <p className="text-slate-500 text-center py-8">Carregando...</p>
        ) : (
          <div className="space-y-4">
            {sections.map((sec, i) => (
              <motion.div key={sec.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <sec.icon className="w-5 h-5 text-amber-400" />
                  <h2 className="text-amber-400 font-bold text-sm">{sec.title.toUpperCase()}</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {sec.items.map(item => (
                    <div key={item.label} className="glass-card p-3 text-center">
                      <p className="text-2xl font-bold text-white">{item.value}</p>
                      <p className="text-slate-500 text-[10px]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
