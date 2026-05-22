import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bike, Plus, ShieldAlert, User, CreditCard, Users, Map, Store, Tag,
  AlertTriangle, ChevronRight, Radio
} from 'lucide-react';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import AlertaFurtoModal from '../components/AlertaFurtoModal';
import BottomNav from '../components/BottomNav';

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
  { icon: ShieldAlert, label: 'Delegacia Virtual\nBOLETIM DE OCORRÊNCIA', color: 'from-red-400 to-rose-500', path: '/delegacia' },
  { icon: User, label: 'Meu\nPerfil', color: 'from-violet-400 to-purple-500', path: '/perfil' },
  { icon: CreditCard, label: 'Planos', color: 'from-rose-400 to-pink-500', path: '/planos' },
  { icon: Users, label: 'Minhas\nIndicações', color: 'from-cyan-400 to-teal-500', path: '/indicacoes' },
  { icon: Map, label: 'Mapa', color: 'from-lime-400 to-green-500', path: '/mapa' },
  { icon: Store, label: 'Lojas\nParceiras', color: 'from-orange-400 to-amber-500', path: '/lojas' },
  { icon: Tag, label: 'Anuncie\nAqui', color: 'from-sky-400 to-blue-500', path: '/anuncie' },
];

/* ===== Components ===== */

function StatusBadge({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 mb-3"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Radio className="w-5 h-5 text-emerald-400" />
        </div>
        {/* Expanding signal waves */}
        <span className="absolute inset-0 rounded-xl border border-emerald-400/40 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute -inset-1.5 rounded-2xl border border-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <span className="absolute -inset-3 rounded-3xl border border-emerald-400/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-3">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent pointer-events-none z-10" style={{ borderLeft: '3px solid rgba(245, 197, 24, 0.5)' }} />
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="glass-card p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider">{newsItems[current].tag}</span>
            </div>
            <h3 className="text-white font-semibold text-sm leading-snug mb-1">{newsItems[current].title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-2">{newsItems[current].desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">{newsItems[current].source} • {newsItems[current].date}</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-center gap-1.5 mt-2">
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <div className="grid grid-cols-3 gap-2">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i + 0.3 }} whileTap={{ scale: 0.95 }} className="glass-card-hover p-2 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer h-[90px]">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} p-[1px] group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-lg bg-[#111827] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="text-[9px] text-slate-300 font-medium leading-tight whitespace-pre-line">{item.label}</span>
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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="flex flex-col items-center mt-2 mb-2">
      <motion.button onClick={onClick} whileTap={{ scale: 0.92 }} className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5 animate-pulse-glow cursor-pointer" style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b)' }}>
        <span className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute -inset-1.5 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
        <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
        <span className="text-white text-[8px] font-bold leading-tight text-center px-1">EMITIR<br/>ALERTA</span>
      </motion.button>
      <p className="text-red-400/60 text-[9px] mt-1 font-medium tracking-wide">Toque em caso de emergência</p>
    </motion.div>
  );
}

/* ===== Page ===== */
export default function Home() {
  const { bikes } = useBikes();
  const { user } = useAuth();
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  const [alertaOpen, setAlertaOpen] = useState(false);

  const displayName = user?.name?.split(' ')[0] || 'Usuário';
  const initial = user?.name?.charAt(0) || 'U';

  return (
    <div className="h-screen bg-[#0c1222] relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/90 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-60 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto px-4 pt-3 pb-0 overflow-hidden">

        {/* Header com bike pequena no meio */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-2 shrink-0">
          <div>
            <p className="text-slate-400 text-xs">{greeting},</p>
            <h1 className="text-lg font-bold text-gradient-gold leading-tight">{displayName.toUpperCase()}</h1>
          </div>

          {/* Bike pequena centralizada */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400/30 shadow-lg shadow-amber-500/10 shrink-0 mx-2">
            <img src="/hero-bike.jpg" alt="Bike" className="w-full h-full object-cover" />
          </motion.div>

          <Link to="/perfil">
            <motion.div whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20 shrink-0">
              <span className="text-[#0c1222] font-bold text-sm">{initial}</span>
            </motion.div>
          </Link>
        </motion.header>

        {/* Status */}
        <StatusBadge count={bikes.length} />

        {/* Carrossel */}
        <NewsCarousel />

        {/* Menu */}
        <MenuGrid />

        {/* Botão Alerta */}
        <EmergencyButton onClick={() => setAlertaOpen(true)} />

      </div>

      <AlertaFurtoModal isOpen={alertaOpen} onClose={() => setAlertaOpen(false)} />

      <BottomNav />
    </div>
  );
}
