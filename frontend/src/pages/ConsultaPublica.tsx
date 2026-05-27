import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Shield, ShieldAlert, MapPin, QrCode, Calendar,
  User, Phone, FileText, AlertTriangle, CheckCircle,
  Eye, Clock, ChevronRight, Radio, X, Send, Loader2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

/* ===== Types ===== */
interface PublicBikeData {
  id: string;
  hash: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  serie: string;
  caracteristicas: string;
  photo: string | null;
  status: 'normal' | 'furto' | 'recuperada';
  protected: boolean;
  ownerName: string;
  ownerPhone: string;
  ownerSince: string;
  boRegistered: boolean;
  boNumber: string;
  alertDate: string | null;
  lastSeen: string;
  lastLocation: string;
  scans: number;
}

/* ===== Mock Data — será substituído por API real ===== */
const mockBikes: Record<string, PublicBikeData> = {
  'a7x9k2m8f3ab': {
    id: '1', hash: 'a7x9k2m8f3ab', name: 'Trek Marlin 7', brand: 'Trek', type: 'Mountain Bike',
    color: 'Vermelha', serie: 'WTU123456789C', caracteristicas: 'Pedal Shimano, guidão riser, selim comfort',
    photo: '/bike-1.jpg', status: 'normal', protected: true,
    ownerName: 'Gian M.', ownerPhone: '(47) 9****-****', ownerSince: '2024',
    boRegistered: false, boNumber: '', alertDate: null,
    lastSeen: 'Há 2 horas', lastLocation: 'Centro, Balneário Camboriú', scans: 47
  },
  'b8y0l3n9g4cd': {
    id: '2', hash: 'b8y0l3n9g4cd', name: 'Specialized Tarmac', brand: 'Specialized', type: 'Speed / Road',
    color: 'Preta', serie: 'WSBC123456789K', caracteristicas: 'Grupo Shimano 105, rodas carbono, peso 7.2kg',
    photo: null, status: 'furto', protected: true,
    ownerName: 'Carlos S.', ownerPhone: '(47) 9****-****', ownerSince: '2023',
    boRegistered: true, boNumber: 'BO-2025-004891', alertDate: '15/05/2025',
    lastSeen: '15/05/2025 20:30', lastLocation: 'Av. Brasil, Centro — BC', scans: 12
  },
};

/* ===== Components ===== */

function StatusBadge({ status, protected: prot }: { status: string; protected: boolean }) {
  if (status === 'furto') {
    return (
      <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
        <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400 font-bold text-sm">EQUIPAMENTO FURTADO</p>
          <p className="text-red-300/70 text-xs">Não compre. Denuncie imediatamente.</p>
        </div>
      </div>
    );
  }
  if (status === 'recuperada') {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-3">
        <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <p className="text-emerald-400 font-bold text-sm">RECUPERADA</p>
          <p className="text-emerald-300/70 text-xs">Equipamento recuperado com sucesso.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
      <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
      <div>
        <p className="text-emerald-400 font-bold text-sm">REGISTRO ATIVO</p>
        <p className="text-emerald-300/70 text-xs">
          {prot ? 'Monitorada pelo Bike Segura BC' : 'Cadastro regular'}
        </p>
      </div>
    </div>
  );
}

function DataRow({ icon: Icon, label, value, highlight = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function ReportModal({ hash, onClose }: { hash: string; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'sending' | 'sent'>('form');
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');

  const handleSend = () => {
    if (!local.trim()) return;
    setStep('sending');
    // Simulação — trocar por API real
    setTimeout(() => setStep('sent'), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md glass-card border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#0c1222]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Avistar Equipamento</h3>
              <p className="text-slate-400 text-[10px]">Ajude o dono a recuperar</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-4">
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Onde você viu? <span className="text-amber-400">*</span></label>
                <div className="glass-card flex items-center gap-3 px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    type="text" placeholder="Ex: Av. Brasil, 1500 — Centro"
                    value={local} onChange={e => setLocal(e.target.value)}
                    className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Observação (opcional)</label>
                <textarea
                  rows={3} placeholder="Cor da roupa da pessoa, direção que foi, etc."
                  value={obs} onChange={e => setObs(e.target.value)}
                  className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none resize-none"
                />
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                Sua localização aproximada será enviada junto. Seus dados pessoais <span className="text-amber-400">não</span> serão compartilhados com o proprietário.
              </p>
            </div>
          )}

          {step === 'sending' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-white text-sm">Enviando aviso...</p>
            </div>
          )}

          {step === 'sent' && (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Aviso enviado!</p>
                <p className="text-slate-400 text-xs mt-1">O proprietário foi notificado com sua informação. Obrigado por ajudar!</p>
              </div>
            </div>
          )}
        </div>

        {step === 'form' && (
          <div className="p-4 border-t border-white/5">
            <motion.button
              whileTap={{ scale: 0.98 }} onClick={handleSend} disabled={!local.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#0c1222]" />
              <span className="text-[#0c1222] font-bold text-sm">ENVIAR AVISO</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ===== Page ===== */
export default function ConsultaPublica() {
  const { hash } = useParams<{ hash: string }>();
  const [bike, setBike] = useState<PublicBikeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [scanPulse, setScanPulse] = useState(true);

  // Simulate API call
  useEffect(() => {
    const timer = setTimeout(() => {
      const found = hash ? mockBikes[hash.toLowerCase()] : null;
      if (found) {
        setBike(found);
      } else {
        // Fallback: try to find by partial match or show demo
        setNotFound(true);
      }
      setLoading(false);
      setScanPulse(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hash]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bike Segura BC - Consulta', url }); return; } catch {}
    }
    navigator.clipboard.writeText(url);
  }, []);

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1222] relative flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center"
          >
            <QrCode className="w-8 h-8 text-[#0c1222]" />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">Consultando registro...</p>
            <p className="text-slate-500 text-xs mt-1">Bike Segura BC</p>
          </div>
          {scanPulse && (
            <>
              <span className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-ping" style={{ animationDuration: '2s' }} />
              <span className="absolute -inset-2 rounded-3xl border border-amber-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== NOT FOUND =====
  if (notFound || !bike) {
    return (
      <div className="min-h-screen bg-[#0c1222] relative">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        </div>
        <div className="relative z-10 max-w-md mx-auto px-4 pt-10 pb-8 flex flex-col items-center text-center min-h-screen">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mx-auto mb-4">
              <Bike className="w-10 h-10 text-[#0c1222]" />
            </div>
            <h1 className="text-2xl font-bold text-gradient-gold">BIKE SEGURA BC</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-white font-bold text-lg mb-2">Registro não encontrado</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Este QR Code ou hash não corresponde a nenhum equipamento cadastrado no sistema. Pode ser:
            </p>
            <ul className="text-slate-400 text-xs leading-relaxed text-left space-y-1.5 mb-4">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Um código inválido ou digitado incorretamente</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>O cadastro foi removido pelo proprietário</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>O QR Code pode ser falso — <span className="text-red-400 font-semibold">cuidado com receptação</span></span>
              </li>
            </ul>
            <div className="glass-card bg-red-500/5 border border-red-500/20 p-3 mb-4">
              <p className="text-red-400 text-xs font-semibold">
                Se você está negociando esta bike, desconfie. Exija nota fiscal e verifique o número de série no quadro.
              </p>
            </div>
            <Link to="/login">
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] font-bold text-sm cursor-pointer">
                CADASTRAR MINHA BIKE
              </button>
            </Link>
          </motion.div>

          <p className="text-slate-600 text-[10px] mt-6">bikesegurabc.com.br</p>
        </div>
      </div>
    );
  }

  // ===== BIKE FOUND =====
  return (
    <div className="min-h-screen bg-[#0c1222] relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-2xl mx-auto px-4 md:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <Link to="/login" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Bike className="w-5 h-5 text-[#0c1222]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">BIKE SEGURA BC</h1>
              <p className="text-slate-500 text-[10px]">Consulta Pública</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-medium">Sistema Ativo</span>
          </div>
        </motion.header>

        {/* Status Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
          <StatusBadge status={bike.status} protected={bike.protected} />
        </motion.div>

        {/* Bike Photo */}
        {bike.photo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="aspect-[16/10] relative">
                <img src={bike.photo} alt={bike.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-white font-bold text-lg">{bike.name}</h2>
                  <p className="text-slate-400 text-xs">{bike.brand} — {bike.type}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bike Data */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 mb-4">
          <h3 className="text-amber-400 font-bold text-xs tracking-wider mb-3">DADOS DO EQUIPAMENTO</h3>
          <DataRow icon={QrCode} label="Número de Série" value={bike.serie} highlight={bike.status === 'furto'} />
          <DataRow icon={Bike} label="Marca / Modelo" value={`${bike.brand} ${bike.name}`} />
          <DataRow icon={FileText} label="Categoria" value={bike.type} />
          <DataRow icon={MapPin} label="Cor" value={bike.color} />
          {bike.caracteristicas && (
            <DataRow icon={Eye} label="Características" value={bike.caracteristicas} />
          )}
        </motion.div>

        {/* Owner Data (partial) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-4 mb-4">
          <h3 className="text-amber-400 font-bold text-xs tracking-wider mb-3">PROPRIETÁRIO</h3>
          <DataRow icon={User} label="Nome" value={bike.ownerName} />
          <DataRow icon={Phone} label="Contato" value={bike.ownerPhone} />
          <DataRow icon={Calendar} label="Proprietário desde" value={bike.ownerSince} />
          {bike.boRegistered && (
            <DataRow icon={FileText} label="BO Registrado" value={bike.boNumber} highlight />
          )}
        </motion.div>

        {/* Theft Alert Info */}
        {bike.status === 'furto' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card border border-red-500/30 p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-red-400 font-bold text-sm">ALERTA DE FURTO</h3>
            </div>
            <div className="space-y-2">
              {bike.alertDate && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-red-300">Data: {bike.alertDate}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-300">Última localização: {bike.lastLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Radio className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-300">Visto por último: {bike.lastSeen}</span>
              </div>
            </div>
            {bike.boRegistered && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-300 text-[10px] font-semibold">
                  BO nº {bike.boNumber} registrado na Delegacia Virtual SC
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3 mb-6">
          {bike.status === 'furto' ? (
            <>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowReport(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Eye className="w-5 h-5 text-[#0c1222]" />
                <span className="text-[#0c1222] font-bold text-sm tracking-wide">AVISTEI ESTA BIKE</span>
              </motion.button>
              <a
                href="https://wa.me/5547992458380?text=Denuncia%20de%20bike%20furtada%20-%20Hash:%20" + bike.hash
                target="_blank" rel="noopener noreferrer"
                className="w-full py-3 rounded-xl glass-card border border-red-500/30 flex items-center justify-center gap-2 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                DENUNCIAR ANONIMAMENTE
              </a>
            </>
          ) : (
            <div className="glass-card p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-bold text-sm">Equipamento Regular</p>
              <p className="text-slate-500 text-xs mt-1">Este equipamento não possui alerta de furto ativo</p>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 text-[10px] text-slate-600 mb-6"
        >
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {bike.scans} consultas
          </span>
          <span>•</span>
          <span>ID: {bike.hash.slice(0, 8).toUpperCase()}</span>
          <span>•</span>
          <button onClick={handleShare} className="text-amber-400 hover:underline cursor-pointer">Compartilhar</button>
        </motion.div>

        {/* Footer */}
        <div className="text-center">
          <Link to="/login" className="text-amber-400 text-xs hover:underline">
            Proteja sua bike — Cadastre-se no Bike Segura BC
          </Link>
          <p className="text-slate-700 text-[10px] mt-2">bikesegurabc.com.br</p>
        </div>

      </div>

      <AnimatePresence>
        {showReport && <ReportModal hash={bike.hash} onClose={() => setShowReport(false)} />}
      </AnimatePresence>
    </div>
  );
}
