import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Bike, QrCode, TrendingUp, DollarSign,
  AlertTriangle, Shield, Activity, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = '/bike-segura-bc-backend/api';

interface Stats {
  totalClientes: number;
  totalEquipamentos: number;
  equipamentosProtegidos: number;
  adesivosDisponiveis: number;
  adesivosUsados: number;
  alertasFurto: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0, totalEquipamentos: 0, equipamentosProtegidos: 0,
    adesivosDisponiveis: 0, adesivosUsados: 0, alertasFurto: 0
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, bikesRes, qrRes] = await Promise.all([
          fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/preprinted`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        let totalClientes = 0;
        let totalEquipamentos = 0;
        let equipamentosProtegidos = 0;
        let alertasFurto = 0;
        let adesivosDisponiveis = 0;
        let adesivosUsados = 0;

        if (usersRes.ok) {
          const users = await usersRes.json();
          totalClientes = Array.isArray(users) ? users.length : 0;
        }
        if (bikesRes.ok) {
          const bikes = await bikesRes.json();
          if (Array.isArray(bikes)) {
            totalEquipamentos = bikes.length;
            equipamentosProtegidos = bikes.filter((b: any) => b.protected).length;
            alertasFurto = bikes.filter((b: any) => b.status === 'furto').length;
          }
        }
        if (qrRes.ok) {
          const qr = await qrRes.json();
          adesivosDisponiveis = qr.disponiveis || 0;
          adesivosUsados = qr.vinculados || 0;
        }

        setStats({ totalClientes, totalEquipamentos, equipamentosProtegidos, adesivosDisponiveis, adesivosUsados, alertasFurto });
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, [token]);

  const cards = [
    { title: 'Clientes', value: stats.totalClientes, icon: Users, color: 'from-blue-400 to-blue-600', link: '/admin/clientes' },
    { title: 'Equipamentos', value: stats.totalEquipamentos, icon: Bike, color: 'from-amber-400 to-yellow-600', link: '/admin/equipamentos' },
    { title: 'Protegidos', value: stats.equipamentosProtegidos, icon: Shield, color: 'from-emerald-400 to-teal-600', link: '/admin/equipamentos' },
    { title: 'Alertas Furto', value: stats.alertasFurto, icon: AlertTriangle, color: 'from-red-400 to-red-600', link: '/admin/equipamentos' },
    { title: 'Adesivos Livres', value: stats.adesivosDisponiveis, icon: QrCode, color: 'from-purple-400 to-purple-600', link: '/admin/adesivos' },
    { title: 'Adesivos Usados', value: stats.adesivosUsados, icon: BarChart3, color: 'from-indigo-400 to-indigo-600', link: '/admin/adesivos' },
  ];

  return (
    <div className="min-h-screen bg-[#0c1222] relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo-oficial.jpg" alt="" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-xl font-bold text-white">PAINEL ADMINISTRATIVO</h1>
              <p className="text-xs text-slate-400">Bike Segura BC - Visao geral da plataforma</p>
            </div>
          </div>
        </motion.header>

        {/* Cards */}
        {loading ? (
          <p className="text-slate-500 text-center py-12">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {cards.map((card, i) => (
              <Link key={card.title} to={card.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 hover:border-white/10 transition-all cursor-pointer h-full"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                  <p className="text-slate-500 text-xs">{card.title}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {/* Menu Rápido */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h2 className="text-amber-400 font-bold text-sm tracking-wider mb-4">ACESSO RAPIDO</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: 'Clientes', desc: 'Lista completa', icon: Users, link: '/admin/clientes' },
              { title: 'Equipamentos', desc: 'Bikes cadastradas', icon: Bike, link: '/admin/equipamentos' },
              { title: 'Adesivos QR', desc: 'Estoque e impressao', icon: QrCode, link: '/admin/adesivos' },
              { title: 'Relatorios', desc: 'Estatisticas', icon: Activity, link: '/admin/relatorios' },
            ].map((item, i) => (
              <Link key={item.title} to={item.link}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="glass-card p-4 hover:bg-white/[0.06] transition-all cursor-pointer text-center"
                >
                  <item.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-slate-500 text-[10px]">{item.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h2 className="text-amber-400 font-bold text-sm tracking-wider mb-4">STATUS DO SISTEMA</h2>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">Sistema operacional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">Consulta publica QR ativa</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
