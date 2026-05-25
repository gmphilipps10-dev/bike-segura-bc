import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, ClipboardPaste, X,
  AlertTriangle, MapPin, Calendar, Bike, Send, Loader2,
  CheckCircle, ChevronDown, ChevronUp, TrendingUp,
  Navigation, Eye, Bike as BikeIcon, CircleDot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

/* ===== Fix Leaflet default icons ===== */
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const pinSvg = (color1: string, color2: string, iconSvg: string) => `
  <div style="position:relative;width:40px;height:48px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C11.2 0 4.2 7 4.2 15.6c0 11.7 15.8 30.6 15.8 30.6S35.8 27.3 35.8 15.6C35.8 7 28.8 0 20 0z" fill="url(#g)"/>
      <ellipse cx="20" cy="15.6" rx="12" ry="12" fill="#0c1222"/>
      <defs><linearGradient id="g" x1="20" y1="0" x2="20" y2="46.2" gradientUnits="userSpaceOnUse">
        <stop stop-color="${color1}"/><stop offset="1" stop-color="${color2}"/>
      </linearGradient></defs>
    </svg>
    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      ${iconSvg}
    </div>
  </div>`;

const theftPin = new L.DivIcon({
  className: '',
  html: pinSvg('#ef4444', '#dc2626', `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`),
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
});

const monitoredPin = new L.DivIcon({
  className: '',
  html: pinSvg('#f97316', '#ea580c', `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`),
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
});

const customBikeIcon = new L.DivIcon({
  className: '',
  html: `<div style="position:relative;width:40px;height:48px;filter:drop-shadow(0 3px 6px rgba(245,197,24,0.4));">
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none"><path d="M20 0C11.2 0 4.2 7 4.2 15.6c0 11.7 15.8 30.6 15.8 30.6S35.8 27.3 35.8 15.6C35.8 7 28.8 0 20 0z" fill="url(#gb)"/><ellipse cx="20" cy="15.6" rx="12" ry="12" fill="#0c1222"/><defs><linearGradient id="gb" x1="20" y1="0" x2="20" y2="46.2" gradientUnits="userSpaceOnUse"><stop stop-color="#f5c518"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs></svg>
    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M8 14.5v.5"/></svg>
    </div>
  </div>`,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
});

const API_BASE = '/bike-segura-bc-backend/api';

/* ===== Áreas seguras de BC (sem dados de incidente — apenas referência) ===== */
const safeAreas = [
  { name: 'Centro', center: [-26.9975, -48.6352] as [number, number], radius: 900 },
  { name: 'Barra Norte', center: [-26.9850, -48.6250] as [number, number], radius: 700 },
  { name: 'Barra Sul', center: [-27.0100, -48.6400] as [number, number], radius: 600 },
  { name: 'Praia Brava', center: [-26.9650, -48.6150] as [number, number], radius: 800 },
  { name: 'Nacoes', center: [-27.0050, -48.6600] as [number, number], radius: 600 },
  { name: 'Pioneiros', center: [-27.0080, -48.6500] as [number, number], radius: 550 },
  { name: 'Rio Pequeno', center: [-27.0350, -48.6250] as [number, number], radius: 650 },
];

const tabNames = ['Rastreamento', 'AreaSegura'] as const;
type TabType = typeof tabNames[number];

interface Ocorrencia {
  _id: string; tipo: 'manual' | 'monitorado';
  endereco: string; bairro: string; lat: number; lng: number;
  titulo: string; descricao: string; dataOcorrencia: string;
  veiculoTipo: string; veiculoCor: string; veiculoMarca: string;
  status: string; createdAt: string; confirmacoes: number;
}

/* ===== WhatsApp Modal ===== */
function WhatsAppModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth();
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState('');

  const handleSubmit = async () => {
    if (!texto.trim()) return;
    setLoading(true); setErro(''); setResultado(null);
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texto: texto.trim() })
      });
      const data = await res.json();
      if (res.ok) { setResultado(data); onSuccess(); }
      else { setErro(data.error || 'Erro ao processar'); }
    } catch { setErro('Erro de conexao'); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md glass-card border border-white/10 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <ClipboardPaste className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Nova Ocorrencia</h3>
              <p className="text-slate-400 text-[10px]">Cole a mensagem do WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {!resultado && !erro && (
            <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 text-[10px] font-medium mb-1">Exemplo:</p>
              <p className="text-amber-200/70 text-[10px] leading-relaxed">"Furto de bike trek azul na Av. Atlantica, em frente ao P12, Barra Norte, ontem as 20h30."</p>
            </div>
          )}
          <textarea value={texto} onChange={e => { setTexto(e.target.value); setErro(''); }} placeholder="Cole aqui a mensagem..." className="w-full h-28 glass-card p-3 text-white text-sm placeholder:text-slate-500 outline-none resize-none rounded-xl border border-white/5 focus:border-amber-400/30" />
          <AnimatePresence>
            {erro && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-[10px] leading-relaxed">{erro}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {resultado && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-emerald-300 text-[10px] font-medium">Ocorrencia registrada!</p>
                </div>
                {resultado.dadosExtraidos && (
                  <div className="p-3 rounded-lg glass-card space-y-1">
                    <p className="text-amber-400 text-[10px] font-bold mb-1">Dados extraidos:</p>
                    {resultado.dadosExtraidos.endereco && <div className="flex items-center gap-2 text-[10px]"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-300">{resultado.dadosExtraidos.endereco}</span></div>}
                    {resultado.dadosExtraidos.bairro && <div className="flex items-center gap-2 text-[10px]"><Navigation className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-300">{resultado.dadosExtraidos.bairro}</span></div>}
                    {resultado.dadosExtraidos.veiculoTipo && <div className="flex items-center gap-2 text-[10px]"><Bike className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-300">{resultado.dadosExtraidos.veiculoTipo} {resultado.dadosExtraidos.veiculoCor && `- ${resultado.dadosExtraidos.veiculoCor}`}</span></div>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-4 border-t border-white/5 shrink-0">
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={loading || !texto.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 text-white animate-spin" /><span className="text-white font-bold text-xs">ANALISANDO...</span></>
             : resultado ? <><CheckCircle className="w-4 h-4 text-white" /><span className="text-white font-bold text-xs">REGISTRADO!</span></>
             : <><Send className="w-4 h-4 text-white" /><span className="text-white font-bold text-xs">REGISTRAR OCORRENCIA</span></>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OcorrenciaPopup({ o }: { o: Ocorrencia }) {
  const fd = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const fh = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="p-2.5 min-w-[220px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-2 h-2 rounded-full ${o.tipo === 'manual' ? 'bg-red-500' : 'bg-orange-500'}`} />
        <span className={`text-[9px] font-bold uppercase tracking-wider ${o.tipo === 'manual' ? 'text-red-400' : 'text-orange-400'}`}>{o.tipo === 'manual' ? 'Reportado' : 'Monitorado'}</span>
      </div>
      <p className="font-bold text-[13px] text-[#0c1222] leading-snug mb-1">{o.titulo || 'Furto de veiculo'}</p>
      {o.descricao && <p className="text-[10px] text-slate-600 leading-relaxed mb-2 line-clamp-3">{o.descricao}</p>}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{o.endereco}</span></div>
        <div className="flex items-center gap-1.5 text-[10px]"><Calendar className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{fd(o.dataOcorrencia)} {fh(o.dataOcorrencia)}</span></div>
        {(o.veiculoTipo || o.veiculoCor) && <div className="flex items-center gap-1.5 text-[10px]"><BikeIcon className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{o.veiculoTipo}{o.veiculoCor && ` - ${o.veiculoCor}`}</span></div>}
      </div>
    </div>
  );
}

/* ===== Bairros com centroides aproximados ===== */
const bairroCenters: Record<string, [number, number]> = {
  'Centro': [-26.9975, -48.6352],
  'Barra Norte': [-26.9800, -48.6200],
  'Barra Sul': [-27.0150, -48.6400],
  'Praia Brava': [-26.9600, -48.6100],
  'Nacoes': [-27.0050, -48.6600],
  'Pioneiros': [-27.0080, -48.6500],
  'Vila Real': [-27.0250, -48.6350],
  'Jardim Iate Clube': [-26.9900, -48.6450],
  'Rio Pequeno': [-27.0350, -48.6250],
  'Santa Regina': [-27.0180, -48.6650],
};

export default function Mapa() {
  const { bikes } = useBikes();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Rastreamento');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [, setLoading] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [, setSelectedOcorrencia] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const center: [number, number] = [-26.9975, -48.6352];

  const fetchOcorrencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ocorrencias?dias=60`);
      if (res.ok) { const d = await res.json(); setOcorrencias(d); }
    } catch {}
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/stats?dias=60`);
      if (res.ok) { const d = await res.json(); setStats(d); }
    } catch {}
  }, []);

  useEffect(() => { fetchOcorrencias(); fetchStats(); }, [fetchOcorrencias, fetchStats]);

  // Agrupa ocorrencias por bairro para criar circulos dinamicos
  const ocorrenciasPorBairro = useMemo(() => {
    const map: Record<string, { count: number; lat: number; lng: number; ocorrencias: Ocorrencia[] }> = {};
    ocorrencias.filter(o => o.status === 'ativo').forEach(o => {
      const b = o.bairro || 'Desconhecido';
      if (!map[b]) {
        const bc = bairroCenters[b];
        map[b] = { count: 0, lat: bc ? bc[0] : o.lat, lng: bc ? bc[1] : o.lng, ocorrencias: [] };
      }
      map[b].count++;
      map[b].ocorrencias.push(o);
    });
    return map;
  }, [ocorrencias]);

  const bikePositions = useMemo(() => bikes.map((b, i) => ({ ...b, position: [
    [-0.008,0.005],[0.006,-0.007],[-0.005,-0.004],[0.009,0.003],[-0.003,0.008],[0.004,0.006],[-0.007,-0.002],[0.002,-0.009]
  ][i % 8].map((o, j) => [-26.9975, -48.6352][j] + o) as [number, number] })), [bikes]);

  const getNivelRisco = (count: number) => {
    if (count >= 5) return { level: 'danger', fill: '#ef4444', stroke: '#dc2626', label: 'PERIGO', text: 'text-red-400' };
    if (count >= 3) return { level: 'warning', fill: '#f97316', stroke: '#ea580c', label: 'ATENCAO', text: 'text-orange-400' };
    if (count >= 1) return { level: 'caution', fill: '#eab308', stroke: '#ca8a04', label: 'MODERADO', text: 'text-yellow-400' };
    return { level: 'safe', fill: '#10b981', stroke: '#059669', label: 'SEGURO', text: 'text-emerald-400' };
  };

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[100dvh] w-full bg-[#0c1222] relative overflow-hidden flex flex-col">

      {/* Header */}
      <div className="relative z-20 bg-[#0c1222]/90 backdrop-blur-lg border-b border-white/5 shrink-0">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-3 mb-2.5">
            <Link to="/" className="w-9 h-9 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white">Mapa</h1>
              <p className="text-[10px] text-slate-400 truncate">
                {activeTab === 'Rastreamento' ? `${bikes.length} equipamento(s)` : `${ocorrencias.length} ocorrencia(s) real(is)`}
              </p>
            </div>
            {user && activeTab === 'AreaSegura' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowWhatsApp(true)} className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20" title="Nova ocorrencia">
                <ClipboardPaste className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </div>
          <div className="flex rounded-xl bg-white/5 p-1">
            {tabNames.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${activeTab === tab ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {tab === 'Rastreamento' ? 'MEUS EQUIPAMENTOS' : 'AREA SEGURA'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#0c1222' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />

          {activeTab === 'Rastreamento' ? (
            bikePositions.map(b => (
              <Marker key={b.id} position={b.position} icon={customBikeIcon}>
                <Popup><div className="p-2 min-w-[180px]">{b.photo && <img src={b.photo} alt={b.name} className="w-full h-24 object-cover rounded-lg mb-2" />}<p className="font-bold text-sm text-[#0c1222]">{b.name}</p><p className="text-xs text-slate-600">{b.type} - {b.brand}</p><div className="flex items-center gap-1 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-emerald-600 text-[10px]">{b.lastSeen}</span></div></div></Popup>
              </Marker>
            ))
          ) : (
            <>
              {/* Circulos de risco dinamicos baseados em ocorrencias REAIS */}
              {Object.entries(ocorrenciasPorBairro).map(([bairro, dados]) => {
                const nivel = getNivelRisco(dados.count);
                const radius = 400 + Math.min(dados.count * 80, 600);
                return (
                  <Circle key={bairro} center={[dados.lat, dados.lng]} radius={radius}
                    pathOptions={{ fillColor: nivel.fill, color: nivel.stroke, fillOpacity: 0.2, weight: 2 }}>
                    <Popup>
                      <div className="p-2 min-w-[180px]">
                        <p className="font-bold text-sm text-[#0c1222]">{bairro}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: nivel.fill }} />
                          <span className="text-xs font-medium" style={{ color: nivel.fill }}>{nivel.label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{dados.count} ocorrencia(s) no ultimo mes</p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 space-y-0.5">
                          {dados.ocorrencias.slice(0, 3).map(o => (
                            <p key={o._id} className="text-[9px] text-slate-500 truncate">{o.titulo || o.endereco}</p>
                          ))}
                          {dados.ocorrencias.length > 3 && <p className="text-[9px] text-slate-400">+{dados.ocorrencias.length - 3} mais...</p>}
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Areas sem ocorrencias = SEGURO */}
              {safeAreas.filter(sa => !ocorrenciasPorBairro[sa.name]).map(sa => (
                <Circle key={sa.name} center={sa.center} radius={sa.radius}
                  pathOptions={{ fillColor: '#10b981', color: '#059669', fillOpacity: 0.08, weight: 1.5, dashArray: '5, 8' }}>
                  <Popup>
                    <div className="p-2 min-w-[160px]">
                      <p className="font-bold text-sm text-[#0c1222]">{sa.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">AREA SEGURA</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Sem ocorrencias registradas</p>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Pins de ocorrencias individuais */}
              {ocorrencias.filter(o => o.status === 'ativo').map(o => (
                <Marker key={o._id} position={[o.lat, o.lng]}
                  icon={o.tipo === 'manual' ? theftPin : monitoredPin}
                  eventHandlers={{ click: () => setSelectedOcorrencia(o._id) }}>
                  <Popup><OcorrenciaPopup o={o} /></Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Legend / Info */}
        <AnimatePresence mode="wait">
          {activeTab === 'AreaSegura' ? (
            <motion.div key="legend-seg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-3 right-3 z-[400]">
              {/* Lista toggle */}
              <div className="glass-card p-3 mb-2">
                <button onClick={() => setShowList(!showList)} className="w-full flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white text-[11px] font-bold">Ocorrencias Recentes</span>
                    <span className="text-[9px] text-slate-500">({ocorrencias.length})</span>
                  </div>
                  {showList ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {showList && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 scrollbar-hide">
                        {ocorrencias.slice(0, 8).map(o => (
                          <button key={o._id} onClick={() => setSelectedOcorrencia(o._id)} className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-start gap-2 cursor-pointer">
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${o.tipo === 'manual' ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-white font-medium truncate">{o.titulo || o.endereco}</p>
                              <p className="text-[8px] text-slate-400">{formatarData(o.dataOcorrencia)} - {o.bairro}</p>
                            </div>
                          </button>
                        ))}
                        {ocorrencias.length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">Nenhuma ocorrencia registrada ainda</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Estatisticas */}
              <div className="glass-card p-3">
                <button onClick={() => setStatsOpen(!statsOpen)} className="w-full flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white text-[11px] font-bold">Nivel de Seguranca</span>
                  </div>
                  {statsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {statsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      {/* Ocorrencias por bairro */}
                      <div className="mt-2.5 space-y-1.5">
                        {Object.entries(ocorrenciasPorBairro).sort((a, b) => b[1].count - a[1].count).map(([bairro, d]) => {
                          const n = getNivelRisco(d.count);
                          return (
                            <div key={bairro} className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ background: n.fill }} />
                              <span className="text-[10px] text-slate-300 flex-1">{bairro}</span>
                              <span className={`text-[10px] font-bold ${n.text}`}>{d.count}</span>
                              <span className="text-[8px] text-slate-500 w-16 text-right">{n.label}</span>
                            </div>
                          );
                        })}
                        {Object.keys(ocorrenciasPorBairro).length === 0 && (
                          <p className="text-[10px] text-slate-500 text-center py-1">Sem dados ainda. Adicione ocorrencias pelo botao verde.</p>
                        )}
                      </div>
                      {stats && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-red-400" /><span className="text-[9px] text-slate-400">Report.: {stats.manual}</span></div>
                            <div className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-orange-400" /><span className="text-[9px] text-slate-400">Monit.: {stats.monitorado}</span></div>
                          </div>
                          <button onClick={() => { fetchOcorrencias(); fetchStats(); }} className="text-[9px] text-amber-400 cursor-pointer hover:underline">Atualizar</button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {!statsOpen && (
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-700" /><span className="text-[9px] text-slate-400">Reportado</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-700" /><span className="text-[9px] text-slate-400">Monitorado</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700" /><span className="text-[9px] text-slate-400">Seguro</span></div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="legend-rast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-3 right-3 z-[400]">
              <div className="glass-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 text-[#0c1222]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">Monitoramento em tempo real</p>
                  <p className="text-slate-400 text-[10px]">{bikes.filter(b => b.protected).length} equipamento(s) ativo(s)</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-[10px] font-medium">Online</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWhatsApp && <WhatsAppModal onClose={() => setShowWhatsApp(false)} onSuccess={() => { fetchOcorrencias(); fetchStats(); }} />}
      </AnimatePresence>
    </div>
  );
}
