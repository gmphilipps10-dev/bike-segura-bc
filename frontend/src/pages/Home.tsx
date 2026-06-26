import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike, Plus, ShieldAlert, User, CreditCard, Users, Map, Store, Tag,
  AlertTriangle, Share2, Radio, MapPin, Download
} from 'lucide-react';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import AlertaFurtoModal from '../components/AlertaFurtoModal';
import BottomNav from '../components/BottomNav';
import { useAppInstall } from '../hooks/useAppInstall';

/* ===== Data ===== */
const anunciantes = [
  {
    id: 1,
    nome: 'Pedal Bike',
    tag: 'BIKE',
    desc: 'A maior e mais completa loja de bicicletas de Balneario Camboriu. Bikes, pecas, acessorios e oficina especializada.',
    url: 'https://www.pedalbikebc.com.br',
    endereco: '4a Avenida, 1445, Centro - BC',
    cor: 'from-emerald-500 to-teal-600',
    logo: '/partners/pedal-bike.png',
    fundo: '#28313f',
  },
  {
    id: 2,
    nome: 'Motochefe Sul',
    tag: 'ELETRICA',
    desc: 'Scooters e bicicletas eletricas em Balneario Camboriu. Mobilidade urbana sustentavel com veiculos de ultima geracao.',
    url: 'https://motochefesul.com.br',
    endereco: 'Av. Brasil, 451, Centro - BC',
    cor: 'from-amber-500 to-orange-600',
    logo: '/partners/motochefe-sul.webp',
    fundo: '#171717',
  },
  {
    id: 3,
    nome: 'Joy Scooters',
    tag: 'PATINETE',
    desc: 'Scooters, triciclos e patinetes eletricos em Itapema. Alta qualidade e tecnologia para sua mobilidade.',
    url: 'https://www.joyscooters.com.br',
    endereco: 'Rua 462, 434, Jardim Praia Mar - Itapema',
    cor: 'from-sky-500 to-blue-600',
    logo: '/partners/joy-scooters.png',
    fundo: '#d9c900',
  },
  {
    id: 4,
    nome: 'Bicicletaria Aquários',
    tag: 'BIKE',
    desc: 'Bicicletas, pecas, acessorios e oficina especializada em Balneario Camboriu.',
    url: 'https://www.bicicletariaaquarios.com.br',
    endereco: '5a Avenida, 547, Vila Real - Balneario Camboriu',
    cor: 'from-violet-500 to-purple-600',
    logo: '/partners/bicicletaria-aquarius.png',
    fundo: '#080808',
  },
  {
    id: 5,
    nome: 'Mega Brava',
    tag: 'MOTO ELETRICA',
    desc: 'Veiculos eletricos homologados e legalizados. Motos e scooters eletricas ja emplacadas na Praia Brava.',
    url: 'https://megaeletronbrava.com.br',
    endereco: 'R. Delfim Mario de Padua Peixoto, 1128, Praia Brava - Itajai',
    cor: 'from-rose-500 to-pink-600',
    logo: '/partners/mega-brava.webp',
    fundo: '#f4f4f4',
  },
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

function AnunciantesCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % anunciantes.length), 5000);
    return () => clearInterval(t);
  }, []);

  const a = anunciantes[current];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="home-carousel mb-2 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">Parceiros</span>
        <span className="text-amber-400/60 text-[10px]">{current + 1}/{anunciantes.length}</span>
      </div>

      {/* Card com ALTURA FIXA */}
      <div className="home-carousel-card relative overflow-hidden rounded-xl" style={{ height: '118px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="relative h-full overflow-hidden border border-white/10 bg-slate-900 cursor-pointer active:scale-[0.98] transition-transform"
            data-analytics-button={`Banner anunciante: ${a.nome}`}
            data-analytics-advertiser-id={String(a.id)}
            data-analytics-advertiser-name={a.nome}
            onClick={() => window.open(a.url, '_blank')}
          >
            <div className="absolute inset-0" style={{ backgroundColor: a.fundo }} />
            <img
              src={a.logo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-70"
            />
            <img
              src={a.logo}
              alt={`Logomarca ${a.nome}`}
              className="absolute inset-0 w-full h-full object-contain object-right opacity-95 drop-shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25" />

            <div className="relative z-10 p-3 h-full flex flex-col max-w-[78%]">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <span className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${a.cor} text-white text-[9px] font-bold tracking-wider shadow-lg shadow-black/30`}>{a.tag}</span>
              </div>

              <h3 className="text-white font-bold text-sm leading-tight mb-0.5 truncate shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">{a.nome}</h3>

              <p
                className="text-white/90 text-[11px] leading-snug mb-1 overflow-hidden drop-shadow-[0_1px_2px_rgba(0,0,0,1)]"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {a.desc}
              </p>

              <div className="mt-auto flex items-center gap-1 text-white/75 text-[10px] truncate shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                <MapPin className="w-3 h-3 shrink-0" />
                {a.endereco}
              </div>
            </div>

            <span className="absolute z-20 top-3 right-3 px-2 py-1 rounded-full bg-black/55 border border-white/15 backdrop-blur-sm text-white text-[9px] font-medium shadow-lg shadow-black/30">
              Visitar →
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        {anunciantes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MenuGrid() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="home-menu shrink-0">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path} className="min-w-0">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i + 0.3 }} whileTap={{ scale: 0.95 }} className="home-menu-card glass-card-hover py-3 md:py-4 px-1 flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer h-[88px] md:h-[100px]">
                <div className={`home-menu-icon w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${item.color} p-[2px] group-hover:scale-110 transition-transform duration-300`}>
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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="home-emergency flex flex-col items-center shrink-0 my-2">
      <motion.button onClick={onClick} whileTap={{ scale: 0.92 }} className="home-emergency-button relative w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5 animate-pulse-glow cursor-pointer" style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b)' }}>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="home-referral shrink-0 mb-1">
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
  const navigate = useNavigate();
  const { isMobile, isIOS, isInstalled, promptInstall } = useAppInstall();
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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;

    if (window.matchMedia('(max-width: 767px)').matches) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  const handleInstall = async () => {
    const openedNativePrompt = await promptInstall();
    if (!openedNativePrompt) navigate('/baixar');
  };

  const showInstallButton = isMobile && !isInstalled;

  return (
    <div ref={rootRef} className={`home-shell ${isIOS ? 'home-ios' : ''} h-[100dvh] w-full bg-[#0c1222] relative overflow-hidden flex flex-col`}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/90 to-[#0c1222]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="home-content w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-4 pb-24 flex flex-col flex-1 min-h-0">

          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="home-header flex items-center justify-between shrink-0 mb-3">
            <div>
              <p className="text-slate-400 text-xs leading-none mb-0.5">{greeting},</p>
              <h1 className="text-lg font-bold text-gradient-gold leading-tight">{displayName.toUpperCase()}</h1>
            </div>
            <div className="flex items-center gap-2">
              {showInstallButton && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleInstall}
                  className="home-install-button rounded-xl border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-amber-300 flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold leading-none">INSTALAR APP</span>
                </motion.button>
              )}
              <Link to="/perfil">
                <motion.div whileTap={{ scale: 0.95 }} className="home-avatar w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/20">
                  <span className="text-[#0c1222] font-bold text-sm">{initial}</span>
                </motion.div>
              </Link>
            </div>
          </motion.header>

          {/* Status */}
          <StatusBadge count={bikes.length} />

          {/* Carrossel de Anunciantes */}
          <AnunciantesCarousel />

          {/* Menu */}
          <MenuGrid />

          {/* Flexible spacer */}
          <div className="home-spacer flex-1 min-h-1" />

          {/* Botão Alerta */}
          <EmergencyButton onClick={() => setAlertaOpen(true)} />

          {/* Indique e Ganhe */}
          <ReferralCTA />

          {/* Versiculo Biblico */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="home-verse shrink-0 text-center my-3"
          >
            <p
              className="text-white/80 text-xs md:text-sm leading-relaxed tracking-wide"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
            >
              &ldquo;Eu sou o caminho, a verdade e a vida!&rdquo; Jo&atilde;o 14:6
            </p>
          </motion.div>

        </div>
      </div>

      <AlertaFurtoModal isOpen={alertaOpen} onClose={() => setAlertaOpen(false)} />
      <BottomNav />
    </div>
  );
}
