import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bike, Plus, ShieldAlert, User, CreditCard, Users, Map, Store, Tag,
  AlertTriangle, Share2, Radio
} from 'lucide-react';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import AlertaFurtoModal from '../components/AlertaFurtoModal';
import BottomNav from '../components/BottomNav';

/* ===== Data ===== */
const newsItems = [
  { id: 1, tag: 'BRASIL', title: 'Furtos de bicicleta explodem no Rio, impulsionados por bike elétrica', desc: 'Casos mais que dobraram: subiu de 331 para 724 registros — aumento de 119%', source: 'CBN Globo', date: 'Abr 2025' },
  { id: 2, tag: 'SEGURANÇA', title: 'Nova tecnologia de rastreamento reduz roubos de bikes em 45%', desc: 'Dispositivos GPS inteligentes e alertas em tempo real transformam a recuperação', source: 'TechCycling', date: 'Mai 2025' },
  { id: 3, tag: 'DICA', title: '5 formas de proteger sua bike enquanto pedala pela cidade', desc: 'Especialistas recomendam combinação de tecnologia e hábitos preventivos', source: 'BikeMag', date: 'Mai 2025' }
];

const menuItems = [
  { icon: Bike, label: 'Meus\nEquipamentos', color: 'from-amber-400 to-yellow-500', path: '/equipamentos' },
  { icon: Plus, label: 'Cadastrar\nNovo', color: 'from-emerald-400 to-teal-500', path: '/cadastrar' },
  { icon: ShieldAlert, label: 'Delegacia', sub: 'BOLETIM DE OCORRÊNCIA', color: 'from-red-400 to-rose-500', path: '/delegacia' },
  { icon: User, label: 'Meu\nPerfil', color: 'from-violet-400 to-purple-500', path: '/perfil' },
  { icon: CreditCard, label: 'Planos', color: 'from-rose-400 to-pink-500', path: '/planos' },
  { icon: Users, label: 'Minhas\nIndicações', color: 'from-cyan-400 to-teal-500', path: '/indicacoes' },
  { icon: Map, label: 'Mapa da\nSeguranca', color: 'from-lime-400 to-green-500', path: '/mapa' },
  { icon: Store, label: 'Lojas\nParceiras', color: 'from-orange-400 to-amber-500', path: '/lojas' },
  { icon: Tag, label: 'Anuncie\nAqui', color: 'from-sky-400 to-blue-500', path: '/anuncie' },
];

/* ===== Components ===== */

function StatusBadge({ count }: { count: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2 shrink-0">
      <div className="relative">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Radio className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="absolute inset-0 rounded-lg border border-emerald-400/40 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute -inset-0.5 rounded-xl border border-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{count} {count === 1 ? 'Equipamento Monitorado' : 'Equipamentos Monitorados'}</p>
        <p className="text-[10px] text-emerald-400/80">Em tempo real</p>
      </div>
    </motion.div>
  );
}

function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => { const t = setInterval(() => setCurrent(p => (p + 1) % newsItems.length), 4000); return () => clearInterval(t); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-3 shrink-0">
      <div className="relative overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="glass-card p-4 relative overflow-hidden">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider">{newsItems[current].tag}</span>
            <h3 className="text-white font-semibold text-sm leading-snug mt-2 mb-1.5">{newsItems[current].title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{newsItems[current].desc}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {newsItems.map((_, i) => <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600'}`} />)}
        </div>
      </div>
    </motion.div>
  );
}

function MenuGrid() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="shrink-0">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path} className="min-w-0">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i + 0.3 }} whileTap={{ scale: 0.95 }} className="glass-card-hover py-3 md:py-4 px-1 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer h-[88px] md:h-[100px]">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${item.color} p-[2px] group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full rounded-[10px] bg-[#111827] flex items-center justify-center"><Icon className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                </div>
                <span className="text-[10px] md:text-xs text-slate-300 font-medium leading-tight whitespace-pre-line">{item.label}</span>
                {'sub' in item && (item as any).sub && <span className="text-[6px] md:text-[7px] text-red-400/80 font-bold tracking-wider leading-none -mt-0.5">{(item as any).sub}</span>}
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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="flex flex-col items-center shrink-0 my-2">
      <motion.button onClick={onClick} whileTap={{ scale: 0.92 }} className="relative w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5 animate-pulse-glow cursor-pointer" style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b)' }}>
        <span className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
        <span className="text-white text-[8px] font-bold leading-tight text-center px-1">EMITIR<br/>ALERTA</span>
      </motion.button>
      <p className="text-red-400/60 text-[9px] mt-1.5 font-medium tracking-wide uppercase">Toque em caso de emergência</p>
    </motion.div>
  );
}

function ReferralCTA() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="shrink-0 mb-1">
      <Link to="/indicacoes">
        <motion.button whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
          <Share2 className="w-4 h-4 text-[#0c1222]" />
          <span className="text-[#0c1222] font-bold text-xs tracking-wide">INDIQUE E GANHE R$</span>
        </motion.button>
      </Link>
    </motion.div>
  );
}

/* ===== Page ===== */
export default function Home() {
  const { bikes } = useBikes();
  const { user } = useAuth();
  const [greeting] = useState(() => { const h = new Date().getHours(); if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'; });
  const [alertaOpen, setAlertaOpen] = useState(false);
  const displayName = user?.name?.split(' ')[0] || 'Usuário';
  const initial = user?.name?.charAt(0) || 'U';
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = (m: MediaQueryListEvent | MediaQueryList) => {
      if (m.matches) {
        el.style.height = 'auto';
        el.style.minHeight = '100vh';
        el.style.overflowY = 'auto';
      } else {
        el.style.height = '100dvh';
        el.style.minHeight = '';
        el.style.overflowY = 'hidden';
      }
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div ref={rootRef} className="h-screen w-full bg-[#0c1222] relative overflow-hidden flex flex-col">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/90 to-[#0c1222]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-4 flex flex-col flex-1 min-h-0" style={{ paddingBottom: '6rem' }}>

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between shrink-0 mb-3">
            <div>
              <p className="text-slate-400 text-xs leading-none mb-0.5">{greeting},</p>
              <h1 className="text-lg font-bold text-gradient-gold leading-tight">{displayName.toUpperCase()}</h1>
            </div>
            <Link to="/perfil">
              <motion.div whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20">
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

          {/* Flexible spacer */}
          <div className="flex-1 min-h-4" />

          {/* Botão Alerta */}
          <EmergencyButton onClick={() => setAlertaOpen(true)} />

          {/* Indique e Ganhe */}
          <ReferralCTA />

        </div>
      </div>

      <AlertaFurtoModal isOpen={alertaOpen} onClose={() => setAlertaOpen(false)} />
      <BottomNav />
    </div>
  );
}
