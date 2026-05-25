import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, Shield, ClipboardPaste, X,
  AlertTriangle, MapPin, Calendar, Bike, Clock, Send, Loader2,
  CheckCircle, ChevronDown, ChevronUp
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

const customBikeIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background: linear-gradient(135deg, #f5c518, #f59e0b); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(245,197,24,0.4); border: 2px solid #0c1222;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0c1222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M8 14.5v.5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const theftIcon = new L.DivIcon({
  className: 'custom-theft-icon',
  html: `<div style="background: linear-gradient(135deg, #ef4444, #dc2626); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(239,68,68,0.5); border: 2px solid #0c1222; animation: pulse-red 2s infinite;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const monitoredTheftIcon = new L.DivIcon({
  className: 'custom-monitored-icon',
  html: `<div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(249,115,22,0.5); border: 2px solid #0c1222;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const API_BASE = '/bike-segura-bc-backend/api';

/* ===== Security Zones Data ===== */
const securityZones = [
  { name: 'Centro / Av. Atlantica', center: [-26.9975, -48.6352] as [number, number], radius: 1100, level: 'danger', incidents: 0, label: 'PERIGOSO' },
  { name: 'Barra Norte', center: [-26.9800, -48.6200] as [number, number], radius: 900, level: 'warning', incidents: 0, label: 'ATENCAO' },
  { name: 'Barra Sul', center: [-27.0150, -48.6400] as [number, number], radius: 800, level: 'warning', incidents: 0, label: 'ATENCAO' },
  { name: 'Praia Brava', center: [-26.9600, -48.6100] as [number, number], radius: 1000, level: 'caution', incidents: 0, label: 'MODERADO' },
  { name: 'Nacoes', center: [-27.0050, -48.6600] as [number, number], radius: 750, level: 'safe', incidents: 0, label: 'SEGURO' },
  { name: 'Vila Real', center: [-27.0250, -48.6350] as [number, number], radius: 850, level: 'caution', incidents: 0, label: 'MODERADO' },
  { name: 'Pioneiros', center: [-27.0080, -48.6500] as [number, number], radius: 700, level: 'safe', incidents: 0, label: 'SEGURO' },
  { name: 'Jardim Iate Clube', center: [-26.9900, -48.6450] as [number, number], radius: 950, level: 'danger', incidents: 0, label: 'PERIGOSO' },
  { name: 'Rio Pequeno', center: [-27.0350, -48.6250] as [number, number], radius: 800, level: 'safe', incidents: 0, label: 'SEGURO' },
  { name: 'Santa Regina', center: [-27.0180, -48.6650] as [number, number], radius: 900, level: 'caution', incidents: 0, label: 'MODERADO' },
];

const levelColors: Record<string, { fill: string; stroke: string; text: string }> = {
  safe:     { fill: '#10b981', stroke: '#059669', text: 'text-emerald-400' },
  caution:  { fill: '#eab308', stroke: '#ca8a04', text: 'text-yellow-400' },
  warning:  { fill: '#f97316', stroke: '#ea580c', text: 'text-orange-400' },
  danger:   { fill: '#ef4444', stroke: '#dc2626', text: 'text-red-400' },
};

const getBikePosition = (index: number): [number, number] => {
  const offsets = [[-0.008,0.005],[0.006,-0.007],[-0.005,-0.004],[0.009,0.003],[-0.003,0.008],[0.004,0.006],[-0.007,-0.002],[0.002,-0.009]];
  const base: [number, number] = [-26.9975, -48.6352];
  const offset = offsets[index % offsets.length];
  return [base[0] + offset[0], base[1] + offset[1]];
};

const tabNames = ['Rastreamento', 'Seguranca'] as const;
type TabType = typeof tabNames[number];

interface Ocorrencia {
  _id: string;
  tipo: 'manual' | 'monitorado';
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  titulo: string;
  descricao: string;
  dataOcorrencia: string;
  veiculoTipo: string;
  veiculoCor: string;
  veiculoMarca: string;
  status: string;
  createdAt: string;
  confirmacoes: number;
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
    setLoading(true);
    setErro('');
    setResultado(null);
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texto: texto.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setResultado(data);
        onSuccess();
      } else {
        setErro(data.error || 'Erro ao processar');
      }
    } catch (e: any) {
      setErro('Erro de conexao com o servidor');
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md glass-card border border-white/10 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
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
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {/* Exemplo */}
          {!resultado && !erro && (
            <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 text-[10px] font-medium mb-1">Exemplo de mensagem:</p>
              <p className="text-amber-200/70 text-[10px] leading-relaxed">
                "Furto de bike trek azul na Av. Atlantica, em frente ao P12, Barra Norte, ontem as 20h30. Descricao: bike preta com aros vermelhos."
              </p>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={texto}
            onChange={e => { setTexto(e.target.value); setErro(''); }}
            placeholder="Cole aqui a mensagem do WhatsApp..."
            className="w-full h-28 glass-card p-3 text-white text-sm placeholder:text-slate-500 outline-none resize-none rounded-xl border border-white/5 focus:border-amber-400/30 transition-colors"
          />

          {/* Erro */}
          <AnimatePresence>
            {erro && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-[10px] leading-relaxed">{erro}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resultado */}
          <AnimatePresence>
            {resultado && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-emerald-300 text-[10px] font-medium">Ocorrencia registrada com sucesso!</p>
                </div>
                {resultado.dadosExtraidos && (
                  <div className="p-3 rounded-lg glass-card">
                    <p className="text-amber-400 text-[10px] font-bold mb-1.5">Dados extraidos:</p>
                    <div className="space-y-1">
                      {resultado.dadosExtraidos.endereco && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-300">{resultado.dadosExtraidos.endereco}</span>
                        </div>
                      )}
                      {resultado.dadosExtraidos.bairro && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <Shield className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-300">Bairro: {resultado.dadosExtraidos.bairro}</span>
                        </div>
                      )}
                      {resultado.dadosExtraidos.veiculoTipo && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <Bike className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-300">{resultado.dadosExtraidos.veiculoTipo} {resultado.dadosExtraidos.veiculoCor && `- ${resultado.dadosExtraidos.veiculoCor}`}</span>
                        </div>
                      )}
                      {resultado.geocoding && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400">Localizado no mapa</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !texto.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white font-bold text-xs">ANALISANDO...</span>
              </>
            ) : resultado ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-xs">REGISTRADO!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-xs">REGISTRAR OCORRENCIA</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ===== Ocorrencia Popup ===== */
function OcorrenciaPopup({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  const formatarData = (data: string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatarHora = (data: string) => {
    const d = new Date(data);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-2 min-w-[220px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-2 h-2 rounded-full ${ocorrencia.tipo === 'manual' ? 'bg-red-500' : 'bg-orange-500'}`} />
        <span className={`text-[10px] font-bold ${ocorrencia.tipo === 'manual' ? 'text-red-400' : 'text-orange-400'}`}>
          {ocorrencia.tipo === 'manual' ? 'OCORRENCIA REPORTADA' : 'FURTO MONITORADO'}
        </span>
      </div>
      <p className="font-bold text-sm text-[#0c1222] leading-snug mb-1">{ocorrencia.titulo || 'Furto de veiculo'}</p>
      <p className="text-[10px] text-slate-600 leading-relaxed mb-2">{ocorrencia.descricao}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-700">{ocorrencia.endereco}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-700">{formatarData(ocorrencia.dataOcorrencia)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-700">{formatarHora(ocorrencia.dataOcorrencia)}</span>
        </div>
        {(ocorrencia.veiculoTipo || ocorrencia.veiculoCor) && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <Bike className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-700">{ocorrencia.veiculoTipo} {ocorrencia.veiculoCor && `- ${ocorrencia.veiculoCor}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Main Component ===== */
export default function Mapa() {
  const { bikes } = useBikes();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Rastreamento');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [, setOcorrenciasLoading] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const center: [number, number] = [-26.9975, -48.6352];

  // Fetch ocorrencias
  const fetchOcorrencias = useCallback(async () => {
    setOcorrenciasLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ocorrencias?dias=60`);
      if (res.ok) {
        const data = await res.json();
        setOcorrencias(data);
      }
    } catch (e) {}
    setOcorrenciasLoading(false);
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/stats?dias=60`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchOcorrencias();
    fetchStats();
  }, [fetchOcorrencias, fetchStats]);

  const statsZones = {
    total: securityZones.reduce((acc, z) => acc + z.incidents, 0),
    danger: securityZones.filter(z => z.level === 'danger').length,
    safe: securityZones.filter(z => z.level === 'safe').length,
  };

  const bikePositions = useMemo(() => {
    return bikes.map((bike, i) => ({ ...bike, position: getBikePosition(i) }));
  }, [bikes]);

  // Contagem real de ocorrencias por zona
  const ocorrenciasPorZona = useMemo(() => {
    const contagem: Record<string, number> = {};
    ocorrencias.forEach(o => {
      if (o.bairro) {
        contagem[o.bairro] = (contagem[o.bairro] || 0) + 1;
      }
    });
    return contagem;
  }, [ocorrencias]);

  return (
    <div className="h-[100dvh] w-full bg-[#0c1222] relative overflow-hidden flex flex-col">

      {/* Header */}
      <div className="relative z-20 bg-[#0c1222]/90 backdrop-blur-lg border-b border-white/5 shrink-0">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/" className="w-9 h-9 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white">Mapa</h1>
              <p className="text-[10px] text-slate-400 truncate">
                {activeTab === 'Rastreamento' ? `${bikes.length} equipamento(s) monitorado(s)` : `${ocorrencias.length} ocorrencia(s) real(is)`}
              </p>
            </div>
            {user && activeTab === 'Seguranca' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWhatsAppModal(true)}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20"
                title="Nova ocorrencia via WhatsApp"
              >
                <ClipboardPaste className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1">
            {tabNames.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'Rastreamento' ? 'MEUS EQUIPAMENTOS' : 'AREA SEGURA'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative min-h-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', background: '#0c1222' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {activeTab === 'Rastreamento' ? (
            bikePositions.map(bike => (
              <Marker key={bike.id} position={bike.position} icon={customBikeIcon}>
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[180px]">
                    {bike.photo && <img src={bike.photo} alt={bike.name} className="w-full h-24 object-cover rounded-lg mb-2" />}
                    <p className="font-bold text-sm text-[#0c1222]">{bike.name}</p>
                    <p className="text-xs text-slate-600">{bike.type} - {bike.brand}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-emerald-600 text-[10px] font-medium">{bike.lastSeen}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))
          ) : (
            <>
              {/* Security Zones */}
              {securityZones.map(zone => {
                const colors = levelColors[zone.level];
                return (
                  <Circle
                    key={zone.name}
                    center={zone.center}
                    radius={zone.radius}
                    pathOptions={{
                      fillColor: colors.fill,
                      color: colors.stroke,
                      fillOpacity: selectedZone === zone.name ? 0.5 : 0.25,
                      weight: selectedZone === zone.name ? 3 : 2,
                    }}
                    eventHandlers={{ click: () => setSelectedZone(zone.name) }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold text-sm text-[#0c1222]">{zone.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.fill }} />
                          <span className="text-xs font-medium" style={{ color: colors.fill }}>{zone.label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{ocorrenciasPorZona[zone.name] || zone.incidents} incidente(s)</p>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Real Ocorrencias - Manual (red pins) */}
              {ocorrencias.filter(o => o.tipo === 'manual').map(o => (
                <Marker key={o._id} position={[o.lat, o.lng]} icon={theftIcon}>
                  <Popup className="custom-popup">
                    <OcorrenciaPopup ocorrencia={o} />
                  </Popup>
                </Marker>
              ))}

              {/* Real Ocorrencias - Monitorado (orange pins) */}
              {ocorrencias.filter(o => o.tipo === 'monitorado').map(o => (
                <Marker key={o._id} position={[o.lat, o.lng]} icon={monitoredTheftIcon}>
                  <Popup className="custom-popup">
                    <OcorrenciaPopup ocorrencia={o} />
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Floating Legend / Info */}
        <AnimatePresence mode="wait">
          {activeTab === 'Seguranca' ? (
            <motion.div key="legend-seguranca" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-4 right-4 z-[400]">
              {/* Stats Toggle */}
              <div className="glass-card p-3 mb-2">
                <button onClick={() => setStatsOpen(!statsOpen)} className="w-full flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white text-[11px] font-bold">Nivel de Seguranca</span>
                    {stats && <span className="text-[9px] text-slate-400">({stats.total} ocorrencias reais)</span>}
                  </div>
                  {statsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                <AnimatePresence>
                  {statsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-2 mt-2.5">
                        {[
                          { label: 'Seguro', color: 'bg-emerald-500', count: statsZones.safe },
                          { label: 'Moderado', color: 'bg-yellow-500', count: securityZones.filter(z => z.level === 'caution').length },
                          { label: 'Atencao', color: 'bg-orange-500', count: securityZones.filter(z => z.level === 'warning').length },
                          { label: 'Perigoso', color: 'bg-red-500', count: statsZones.danger },
                        ].map(item => (
                          <div key={item.label} className="flex-1 text-center">
                            <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1`} />
                            <p className="text-white text-[9px] font-medium">{item.label}</p>
                            <p className="text-slate-500 text-[9px]">{item.count} area(s)</p>
                          </div>
                        ))}
                      </div>

                      {/* Ocorrencias reais stats */}
                      {stats && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-[9px] text-slate-400">Reportadas: {stats.manual}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[9px] text-slate-400">Monitorados: {stats.monitorado}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => { fetchOcorrencias(); fetchStats(); }}
                              className="text-[9px] text-amber-400 cursor-pointer hover:underline"
                            >
                              Atualizar
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!statsOpen && stats && (
                  <p className="text-slate-500 text-[9px] mt-1 text-center">
                    {stats.total} ocorrencias reais no ultimo mes
                  </p>
                )}
              </div>

              {/* Pin legend */}
              {ocorrencias.length > 0 && (
                <div className="glass-card p-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-700" />
                    <span className="text-[9px] text-slate-300">Reportada</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-700" />
                    <span className="text-[9px] text-slate-300">Monitorado</span>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="legend-rastreamento" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-4 right-4 z-[400]">
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
        {showWhatsAppModal && (
          <WhatsAppModal
            onClose={() => setShowWhatsAppModal(false)}
            onSuccess={() => { fetchOcorrencias(); fetchStats(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
