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

/* ===== Simple reliable pin icons using CSS ===== */
const makePinIcon = (color1: string, color2: string, symbol: string) =>
  new L.DivIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:44px;">
      <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,${color1},${color2});transform:rotate(-45deg);position:absolute;top:0;left:0;box-shadow:0 2px 8px ${color1}80;border:2px solid #0c1222;display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:white;font-size:14px;font-weight:bold;">${symbol}</span>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color2};position:absolute;bottom:2px;left:12px;"></div>
    </div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40]
  });

const theftPin = makePinIcon('#ef4444', '#dc2626', '&#9888;');
const monitoredPin = makePinIcon('#f97316', '#ea580c', '&#10005;');
const bikePin = new L.DivIcon({
  className: '',
  html: `<div style="position:relative;width:36px;height:44px;">
    <div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#f5c518,#f59e0b);transform:rotate(-45deg);position:absolute;top:0;left:0;box-shadow:0 2px 8px rgba(245,197,24,0.5);border:2px solid #0c1222;display:flex;align-items:center;justify-content:center;">
      <svg style="transform:rotate(45deg);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c1222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M8 14.5v.5"/></svg>
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #f59e0b;position:absolute;bottom:2px;left:12px;"></div>
  </div>`,
  iconSize: [36, 44],
  iconAnchor: [18, 40],
  popupAnchor: [0, -40]
});

const API_BASE = '/bike-segura-bc-backend/api';

/* ===== BAIRROS REAIS de Balneario Camboriu ===== */
const bairroCenters: Record<string, [number, number]> = {
  'Centro': [-26.9980, -48.6340],
  'Barra Norte': [-26.9850, -48.6230],
  'Barra Sul': [-27.0120, -48.6380],
  'Praia Brava': [-26.9650, -48.6150],
  'Nacoes': [-27.0050, -48.6550],
  'Pioneiros': [-27.0000, -48.6450],
  'Vila Real': [-27.0220, -48.6380],
  'Jardim Iate Clube': [-26.9900, -48.6420],
  'Santa Regina': [-27.0180, -48.6600],
  'Condominio': [-27.0300, -48.6500],
};

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
              <p className="text-amber-200/70 text-[10px] leading-relaxed">"Furto de bike trek azul na Av. Brasil, esquina com Rua 2400, Centro, ontem as 20h30."</p>
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
                    {resultado.geocoding && <div className="flex items-center gap-2 text-[10px]"><MapPin className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-emerald-400">Localizado em Balneario Camboriu</span></div>}
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
  const fd = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
        <div className="flex items-center gap-1.5 text-[10px]"><Calendar className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{fd(o.dataOcorrencia)} as {fh(o.dataOcorrencia)}</span></div>
        {(o.veiculoTipo || o.veiculoCor) && <div className="flex items-center gap-1.5 text-[10px]"><BikeIcon className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{o.veiculoTipo}{o.veiculoCor && ` - ${o.veiculoCor}`}</span></div>}
      </div>
      <p className="text-[8px] text-slate-400 mt-1.5 pt-1 border-t border-slate-200">Registrado em {new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
    </div>
  );
}

export default function Mapa() {
  const { bikes } = useBikes();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Rastreamento');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [, setLoading] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showList, setShowList] = useState(false);

  const center: [number, number] = [-26.9958, -48.6356];

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

  // Agrupa ocorrencias por bairro para circulos dinamicos
  const ocorrenciasPorBairro = useMemo(() => {
    const map: Record<string, { count: number; lat: number; lng: number; ocorrencias: Ocorrencia[] }> = {};
    ocorrencias.filter(o => o.status === 'ativo').forEach(o => {
      const b = o.bairro || 'Centro';
      // So considera bairros de BC
      const bairroKey = Object.keys(bairroCenters).find(k => b.toLowerCase().includes(k.toLowerCase())) || b;
      const bc = bairroCenters[bairroKey] || [o.lat, o.lng];
      if (!map[bairroKey]) map[bairroKey] = { count: 0, lat: bc[0], lng: bc[1], ocorrencias: [] };
      map[bairroKey].count++;
      map[bairroKey].ocorrencias.push(o);
    });
    return map;
  }, [ocorrencias]);

  const bikePositions = useMemo(() => bikes.map((b, i) => ({
    ...b,
    position: [[-0.008,0.005],[0.006,-0.007],[-0.005,-0.004],[0.009,0.003],[-0.003,0.008],[0.004,0.006],[-0.007,-0.002],[0.002,-0.009]][i % 8].map((o, j) => center[j] + o) as [number, number]
  })), [bikes, center]);

  const getNivelRisco = (count: number) => {
    if (count >= 5) return { fill: '#ef4444', stroke: '#dc2626', label: 'PERIGO', text: 'text-red-400' };
    if (count >= 3) return { fill: '#f97316', stroke: '#ea580c', label: 'ATENCAO', text: 'text-orange-400' };
    if (count >= 1) return { fill: '#eab308', stroke: '#ca8a04', label: 'MODERADO', text: 'text-yellow-400' };
    return { fill: '#10b981', stroke: '#059669', label: 'SEGURO', text: 'text-emerald-400' };
  };

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Verifica se coordenada esta dentro de BC (limites aproximados)
  const isDentroBC = (lat: number, lng: number) => {
    return lat >= -27.06 && lat <= -26.95 && lng >= -48.68 && lng <= -48.58;
  };

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
              <h1 className="text-base font-bold text-white">Mapa da Seguranca</h1>
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
              <Marker key={b.id} position={b.position} icon={bikePin}>
                <Popup><div className="p-2 min-w-[180px]">{b.photo && <img src={b.photo} alt={b.name} className="w-full h-24 object-cover rounded-lg mb-2" />}<p className="font-bold text-sm text-[#0c1222]">{b.name}</p><p className="text-xs text-slate-600">{b.type} - {b.brand}</p><div className="flex items-center gap-1 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-emerald-600 text-[10px]">{b.lastSeen}</span></div></div></Popup>
              </Marker>
            ))
          ) : (
            <>
              {/* Circulos de risco dinamicos baseados em ocorrencias REAIS - apenas dentro de BC */}
              {Object.entries(ocorrenciasPorBairro)
                .filter(([, d]) => isDentroBC(d.lat, d.lng))
                .map(([bairro, dados]) => {
                  const nivel = getNivelRisco(dados.count);
                  const radius = 350 + Math.min(dados.count * 60, 400);
                  return (
                    <Circle key={bairro} center={[dados.lat, dados.lng]} radius={radius}
                      pathOptions={{ fillColor: nivel.fill, color: nivel.stroke, fillOpacity: 0.18, weight: 2 }}>
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

              {/* Pins de ocorrencias individuais - apenas dentro de BC */}
              {ocorrencias.filter(o => o.status === 'ativo' && isDentroBC(o.lat, o.lng)).map(o => (
                <Marker key={o._id} position={[o.lat, o.lng]} icon={o.tipo === 'manual' ? theftPin : monitoredPin}>
                  <Popup><OcorrenciaPopup o={o} /></Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Legend */}
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
                          <div key={o._id} className="w-full text-left p-2 rounded-lg bg-white/5 flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${o.tipo === 'manual' ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <div className="min-w-0">
                              <p className="text-[10px] text-white font-medium truncate">{o.titulo || o.endereco}</p>
                              <p className="text-[8px] text-slate-400">{formatarData(o.dataOcorrencia)} - {o.bairro}</p>
                            </div>
                          </div>
                        ))}
                        {ocorrencias.length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">Nenhuma ocorrencia registrada ainda. Clique no botao verde para adicionar.</p>}
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
                      <div className="mt-2.5 space-y-1.5">
                        {Object.entries(ocorrenciasPorBairro).sort((a, b) => b[1].count - a[1].count).map(([bairro, d]) => {
                          const n = getNivelRisco(d.count);
                          return (
                            <div key={bairro} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: n.fill }} />
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

      <AnimatePresence>
        {showWhatsApp && <WhatsAppModal onClose={() => setShowWhatsApp(false)} onSuccess={() => { fetchOcorrencias(); fetchStats(); }} />}
      </AnimatePresence>
    </div>
  );
}
