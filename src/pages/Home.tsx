import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bike, Plus, ShieldAlert, User, CreditCard, Users, Map, Store, Tag,
  AlertTriangle, Share2, ChevronRight, Radio,
  Newspaper, TrendingUp, ShieldCheck, Bike as BikeIcon
} from 'lucide-react';
import AlertaFurtoModal from '../components/AlertaFurtoModal';

/* ===== Data ===== */
const newsItems = [
  {
    id: 1,
    tag: 'BRASIL',
    title: 'Furtos de bicicleta explodem no Rio, impulsionados por bike elétrica',
    desc: 'Casos mais que dobraram: subiu de 331 para 724 registros — aumento de 119%',
    source: 'CBN Globo',
    date: 'Abr 2025'
  },
  {
    id: 2,
    tag: 'SEGURANÇA',
    title: 'Nova tecnologia de rastreamento reduz roubos de bikes em 45%',
    desc: 'Dispositivos GPS inteligentes e alertas em tempo real transformam a recuperação',
    source: 'TechCycling',
    date: 'Mai 2025'
  },
  {
    id: 3,
    tag: 'DICA',
    title: '5 formas de proteger sua bike enquanto pedala pela cidade',
    desc: 'Especialistas recomendam combinação de tecnologia e hábitos preventivos',
    source: 'BikeMag',
    date: 'Mai 2025'
  }
];

const menuItems = [
  { icon: Bike, label: 'Meus\nEquipamentos', color: 'from-amber-400 to-yellow-500', path: '/equipamentos' },
  { icon: Plus, label: 'Cadastrar\nNovo', color: 'from-emerald-400 to-teal-500', path: '/cadastrar' },
  { icon: ShieldAlert, label: 'Delegacia\nBOLETIM DE OCORRÊNCIA', color: 'from-red-400 to-rose-500', path: '/delegacia' },
  { icon: User, label: 'Meu\nPerfil', color: 'from-violet-400 to-purple-500', path: '/perfil' },
  { icon: CreditCard, label: 'Planos', color: 'from-rose-400 to-pink-500', path: '/planos' },
  { icon: Users, label: 'Minhas\nIndicações', color: 'from-cyan-400 to-teal-500', path: '/indicacoes' },
  { icon: Map, label: 'Mapa', color: 'from-lime-400 to-green-500', path: '/mapa' },
  { icon: Store, label: 'Lojas\nParceiras', color: 'from-orange-400 to-amber-500', path: '/lojas' },
  { icon: Tag, label: 'Anuncie\nAqui', color: 'from-sky-400 to-blue-500', path: '/anuncie' },
];

import BottomNav from '../components/BottomNav';

/* ===== Components ===== */

function AppStats() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
      <div className="glass-card p-3.5 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">100%</p>
            <p className="text-[10px] text-slate-400 leading-tight">Bikes protegidas</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">94%</p>
            <p className="text-[10px] text-slate-400 leading-tight">Taxa de recuperação</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
            <BikeIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">2.4k</p>
            <p className="text-[10px] text-slate-400 leading-tight">Bikes recuperadas</p>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-500 mt-2 tracking-wide">Estatísticas da plataforma Bike Segura BC</p>
    </motion.div>
  );
}

function StatusBadge({ count }: { count: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-5">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Radio className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0c1222] animate-pulse" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{count} {count === 1 ? 'equipamento monitorado' : 'equipamentos monitorados'}</p>
        <p className="text-xs text-emerald-400/80">Em tempo real</p>
      </div>
    </motion.div>
  );
}

function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % newsItems.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">Últimas Notícias</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent pointer-events-none z-10" style={{ borderLeft: '3px solid rgba(245, 197, 24, 0.5)' }} />
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="glass-card p-5 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider">{newsItems[current].tag}</span>
            </div>
            <h3 className="text-white font-semibold text-sm leading-snug mb-2">{newsItems[current].title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">{newsItems[current].desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">{newsItems[current].source} • {newsItems[current].date}</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {newsItems.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-amber-400' : 'w-1.5 bg-slate-600'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MenuGrid() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path} className="h-[110px]">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i + 0.35 }} whileTap={{ scale: 0.95 }} className="glass-card-hover p-3 flex flex-col items-center justify-center gap-2 text-center group cursor-pointer h-full">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} p-[1px] group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-xl bg-[#111827] flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px] text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-medium leading-tight whitespace-pre-line min-h-[28px] flex items-center justify-center">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function EmergencyButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} className="flex flex-col items-center mb-8">
      <motion.button onClick={onClick} whileTap={{ scale: 0.92 }} className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 animate-pulse-glow cursor-pointer" style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b)' }}>
        <span className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute -inset-2 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
        <AlertTriangle className="w-7 h-7 text-white mb-0.5" strokeWidth={2.5} />
        <span className="text-white text-[10px] font-bold leading-tight text-center px-2">EMITIR ALERTA<br/>DE FURTO</span>
      </motion.button>
      <p className="text-red-400/60 text-[10px] mt-3 font-medium tracking-wide uppercase">Toque em caso de emergência</p>
    </motion.div>
  );
}

function ReferralCTA() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-24">
      <Link to="/indicacoes">
        <motion.button whileTap={{ scale: 0.98 }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
          <Share2 className="w-5 h-5 text-[#0c1222]" />
          <span className="text-[#0c1222] font-bold text-sm tracking-wide">INDIQUE E GANHE R$</span>
        </motion.button>
      </Link>
    </motion.div>
  );
}

/* ===== Page ===== */
export default function Home() {
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  const [alertaOpen, setAlertaOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/90 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-60 -right-20 w-80 h-80 bg-amber-500/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-gradient-gold">GIAN</h1>
          </div>
          <Link to="/perfil">
            <motion.div whileTap={{ scale: 0.95 }} className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20">
              <span className="text-[#0c1222] font-bold text-base">G</span>
            </motion.div>
          </Link>
        </motion.header>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative mb-6 rounded-3xl overflow-hidden">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
            <img src="/hero-bike.jpg" alt="Bike premium" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1222]/60 via-transparent to-transparent" />
          </div>
        </motion.div>

        <AppStats />
        <StatusBadge count={0} />
        <NewsCarousel />
        <MenuGrid />
        <EmergencyButton onClick={() => setAlertaOpen(true)} />
        <ReferralCTA />
      </div>

      <AlertaFurtoModal isOpen={alertaOpen} onClose={() => setAlertaOpen(false)} />

      <BottomNav />
    </div>
  );
}
