import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, ClipboardPaste, X,
  AlertTriangle, MapPin, Calendar, Send, Loader2,
  CheckCircle, ChevronDown, ChevronUp, TrendingUp,
  Navigation, Eye, Bike as BikeIcon, Bike, ShieldCheck, CircleDot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});

const theftIcon = new L.Icon({
  iconUrl: '/pin-red.png',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -40]
});

const monitoredIcon = new L.Icon({
  iconUrl: '/pin-orange.png',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -40]
});

const bikeIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f5c518,#f59e0b);border:2.5px solid #0c1222;box-shadow:0 2px 6px rgba(245,197,24,0.5);display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0c1222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M8 14.5v.5"/></svg></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16]
});

const API_BASE = '/bike-segura-bc-backend/api';

const BAIRROS: Record<string, [number, number]> = {
  'Centro': [-26.9980, -48.6340],
  'Barra Norte': [-26.9850, -48.6220],
  'Barra Sul': [-27.0120, -48.6380],
  'Praia Brava': [-26.9650, -48.6150],
  'Nacoes': [-27.0050, -48.6550],
  'Pioneiros': [-27.0000, -48.6450],
  'Vila Real': [-27.0220, -48.6380],
  'Jardim Iate Clube': [-26.9900, -48.6420],
  'Santa Regina': [-27.0180, -48.6600],
  'Tabuleiro': [-27.0100, -48.6300],
  'Sao Judas Tadeu': [-27.0250, -48.6500],
  'Laranjeiras': [-27.0050, -48.6150],
};

const tabNames = ['Rastreamento', 'AreaSegura', 'Ciclovias'] as const;
type TabType = typeof tabNames[number];

interface CicloviaData {
  id: string; nome: string; tipo: 'ciclovia' | 'ciclofaixa';
  cor: string; corBg: string; coordenadas: [number, number][]; distancia: string;
}

function calcDist(coords: [number, number][]): string {
  let total = 0; const R = 6371;
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lon1] = coords[i - 1], [lat2, lon2] = coords[i];
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total < 1 ? `${(total * 1000).toFixed(0)} m` : `${total.toFixed(1)} km`;
}

const CICLOVIA_1: [number, number][] = [
  [-27.000311,-48.643728],
  [-27.000266,-48.643687],
  [-27.000257,-48.643646],
  [-27.000264,-48.643599],
  [-27.000549,-48.642645],
  [-27.000583,-48.642558],
  [-27.000635,-48.642452],
  [-27.000659,-48.642392],
  [-27.0018,-48.638455],
  [-27.001838,-48.638324],
  [-27.001876,-48.638187],
  [-27.001905,-48.638092],
  [-27.001918,-48.638048],
  [-27.001925,-48.638016],
  [-27.001934,-48.63799],
  [-27.002946,-48.634552],
  [-27.002949,-48.634538],
  [-27.002935,-48.634515],
  [-27.002881,-48.634448],
  [-27.003118,-48.633953],
  [-27.004098,-48.630726],
  [-27.004184,-48.630497],
  [-27.004239,-48.630326],
  [-27.004764,-48.628426],
  [-27.005197,-48.626863],
  [-27.005213,-48.626704],
  [-27.005286,-48.626603],
  [-27.005343,-48.626427],
  [-27.005614,-48.625467],
  [-27.00599,-48.624178],
  [-27.006043,-48.623994],
  [-27.006072,-48.623894],
  [-27.006258,-48.623259],
  [-27.006477,-48.622506]
];

const CICLOVIA_5A: [number, number][] = [
  [-27.000927,-48.645294],
  [-27.001044,-48.645092],
  [-27.001387,-48.644503],
  [-27.001457,-48.644383],
  [-27.001511,-48.644294],
  [-27.001706,-48.643954],
  [-27.002189,-48.643124],
  [-27.002249,-48.643023],
  [-27.002289,-48.642963],
  [-27.002448,-48.642686],
  [-27.00258,-48.642463],
  [-27.002909,-48.641894],
  [-27.003142,-48.641505],
  [-27.003346,-48.641131],
  [-27.003591,-48.640706],
  [-27.003808,-48.640331],
  [-27.003935,-48.640098],
  [-27.004016,-48.63995],
  [-27.004091,-48.639794],
  [-27.004161,-48.639624],
  [-27.004202,-48.639516],
  [-27.004399,-48.639001],
  [-27.004531,-48.638577],
  [-27.004556,-48.638498],
  [-27.004582,-48.638405],
  [-27.004621,-48.638249],
  [-27.00464,-48.638147],
  [-27.004668,-48.63797],
  [-27.004687,-48.637826],
  [-27.004709,-48.637611],
  [-27.004773,-48.636991],
  [-27.004798,-48.636751],
  [-27.004819,-48.636711],
  [-27.004836,-48.636658],
  [-27.004841,-48.636609],
  [-27.004846,-48.636536],
  [-27.004831,-48.636462],
  [-27.004828,-48.636424],
  [-27.004828,-48.636373],
  [-27.004841,-48.636146],
  [-27.004909,-48.63514],
  [-27.004941,-48.634662],
  [-27.004984,-48.634014],
  [-27.005,-48.63387],
  [-27.005019,-48.633688],
  [-27.005048,-48.633475],
  [-27.005075,-48.633304],
  [-27.005084,-48.633243],
  [-27.005137,-48.632927],
  [-27.005237,-48.632375],
  [-27.005433,-48.631286],
  [-27.005448,-48.631203],
  [-27.005505,-48.630885],
  [-27.005522,-48.630788],
  [-27.005539,-48.630696],
  [-27.005947,-48.628408],
  [-27.006138,-48.62734],
  [-27.006249,-48.62672],
  [-27.006261,-48.626652],
  [-27.006274,-48.626576],
  [-27.006459,-48.625541],
  [-27.006569,-48.624927],
  [-27.006584,-48.624836],
  [-27.006591,-48.624794],
  [-27.006561,-48.624712],
  [-27.006558,-48.624675],
  [-27.006562,-48.624631],
  [-27.006616,-48.62441],
  [-27.006656,-48.624236],
  [-27.006694,-48.624046],
  [-27.006714,-48.623992],
  [-27.007076,-48.623341],
  [-27.007105,-48.62329]
];

const CICLOVIA_3: [number, number][] = [
  [-27.006356,-48.638673],
  [-27.005566,-48.637513],
  [-27.005563,-48.637506],
  [-27.005562,-48.637478],
  [-27.005562,-48.637467],
  [-27.005557,-48.637449],
  [-27.005457,-48.637307],
  [-27.00534,-48.63713],
  [-27.005305,-48.637077],
  [-27.005296,-48.637068],
  [-27.00528,-48.637057],
  [-27.005265,-48.637049],
  [-27.005251,-48.637043],
  [-27.005241,-48.637031],
  [-27.005157,-48.636899],
  [-27.005081,-48.636787],
  [-27.005067,-48.636753],
  [-27.00506,-48.636722],
  [-27.00506,-48.636678],
  [-27.005054,-48.636618],
  [-27.005038,-48.636578],
  [-27.005005,-48.636519],
  [-27.004962,-48.636482],
  [-27.004926,-48.636434],
  [-27.004913,-48.636394],
  [-27.004932,-48.636182],
  [-27.004919,-48.636151]
];

const CICLOVIA_4: [number, number][] = [
  [-27.001341,-48.637847],
  [-27.001905,-48.638092],
  [-27.002078,-48.638174]
];

const CICLOVIA_5: [number, number][] = [
  [-26.971058,-48.63193],
  [-26.971039,-48.631881],
  [-26.970984,-48.631836],
  [-26.970936,-48.631808],
  [-26.970637,-48.631688],
  [-26.970602,-48.631691],
  [-26.970567,-48.631688],
  [-26.970532,-48.631679],
  [-26.970499,-48.631664],
  [-26.970468,-48.631644],
  [-26.97044,-48.631619],
  [-26.970422,-48.631603],
  [-26.970401,-48.631593],
  [-26.97038,-48.631588],
  [-26.970358,-48.631588],
  [-26.970337,-48.631593],
  [-26.970302,-48.631588],
  [-26.970268,-48.631578],
  [-26.970236,-48.631563],
  [-26.970197,-48.631539],
  [-26.970163,-48.631507],
  [-26.970129,-48.63149],
  [-26.970093,-48.631475],
  [-26.970031,-48.631456],
  [-26.969999,-48.631453],
  [-26.969968,-48.631445],
  [-26.969934,-48.63143],
  [-26.969903,-48.631409],
  [-26.969875,-48.631382],
  [-26.969865,-48.631365],
  [-26.969852,-48.63135],
  [-26.969825,-48.631329],
  [-26.969795,-48.631317],
  [-26.969762,-48.631314],
  [-26.969726,-48.631299],
  [-26.969693,-48.631278],
  [-26.969666,-48.631256],
  [-26.969643,-48.63123],
  [-26.969583,-48.631165],
  [-26.969571,-48.631153],
  [-26.969558,-48.631144],
  [-26.969538,-48.631137],
  [-26.969517,-48.631136],
  [-26.969501,-48.631137],
  [-26.969485,-48.631136],
  [-26.969461,-48.631127],
  [-26.969441,-48.631112],
  [-26.969374,-48.631047],
  [-26.969351,-48.631039],
  [-26.969327,-48.631036],
  [-26.969305,-48.63104],
  [-26.969284,-48.631048],
  [-26.969253,-48.631047],
  [-26.969235,-48.631042],
  [-26.969218,-48.631035],
  [-26.969172,-48.631004],
  [-26.969152,-48.630995],
  [-26.969131,-48.630991],
  [-26.969107,-48.630991],
  [-26.969084,-48.630997],
  [-26.969062,-48.631008],
  [-26.968988,-48.631082]
];

const CICLOVIA_6: [number, number][] = [
  [-26.990087,-48.642842],
  [-26.990218,-48.64285],
  [-26.990346,-48.642764]
];

const CICLOVIAS: CicloviaData[] = [
  { id: '1', nome: 'Ciclovia do Centro', tipo: 'ciclovia', cor: '#2196F3', corBg: 'rgba(33,150,243,0.15)', distancia: '2.2 km', coordenadas: CICLOVIA_1 },
  { id: '2', nome: 'Ciclovia da 5a Avenida', tipo: 'ciclovia', cor: '#9C27B0', corBg: 'rgba(156,39,176,0.15)', distancia: '2.3 km', coordenadas: CICLOVIA_5A },
  { id: '3', nome: 'Ciclovia do Tabuleiro', tipo: 'ciclovia', cor: '#FF9800', corBg: 'rgba(255,152,0,0.15)', distancia: '0.3 km', coordenadas: CICLOVIA_3 },
  { id: '4', nome: 'Ciclovia da Rua 1500', tipo: 'ciclovia', cor: '#4CAF50', corBg: 'rgba(76,175,80,0.15)', distancia: '0.1 km', coordenadas: CICLOVIA_4 },
  { id: '5', nome: 'Ciclovia da Barra Norte', tipo: 'ciclovia', cor: '#00BCD4', corBg: 'rgba(0,188,212,0.15)', distancia: '0.3 km', coordenadas: CICLOVIA_5 },
  { id: '6', nome: 'Ciclovia da Av. Brasil', tipo: 'ciclovia', cor: '#F44336', corBg: 'rgba(244,67,54,0.15)', distancia: '0.03 km', coordenadas: CICLOVIA_6 },
];
const tipoLabel: Record<string, string> = { ciclovia: 'Ciclovia', ciclofaixa: 'Ciclofaixa' };

function CicloviasLayer() {
  const map = useMap();
  useEffect(() => {
    const layers: L.Polyline[] = [];
    CICLOVIAS.forEach((c) => {
      const poly = L.polyline(c.coordenadas, {
        color: c.cor,
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      poly.bindPopup(`<div style="font-family:sans-serif;min-width:160px;padding:4px"><div style="font-size:12px;font-weight:bold;color=${c.cor}">${tipoLabel[c.tipo]}</div><div style="font-size:14px;font-weight:bold;color:#333">${c.nome}</div><div style="font-size:12px;color:#666;margin-top:2px">${c.distancia}</div></div>`);
      layers.push(poly);
    });
    return () => { layers.forEach(p => map.removeLayer(p)); };
  }, [map]);
  return null;
}

interface Ocorrencia {
  _id: string; tipo: 'manual' | 'monitorado';
  endereco: string; bairro: string; lat: number; lng: number;
  titulo: string; descricao: string; dataOcorrencia: string;
  veiculoTipo: string; veiculoCor: string; veiculoMarca: string;
  status: string; createdAt: string;
}

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
              <p className="text-amber-200/70 text-[10px] leading-relaxed">"Furto de bike trek azul na Av. Brasil, Centro, ontem as 20h30."</p>
            </div>
          )}
          <textarea value={texto} onChange={e => { setTexto(e.target.value); setErro(''); }} placeholder="Cole aqui a mensagem..." className="w-full h-28 glass-card p-3 text-white text-sm placeholder:text-slate-500 outline-none resize-none rounded-xl border border-white/5 focus:border-amber-400/30" />
          {erro && <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /><p className="text-red-300 text-[10px] leading-relaxed">{erro}</p></div>}
          {resultado && (
            <div className="mt-3 space-y-2">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-emerald-300 text-[10px] font-medium">Ocorrencia registrada!</p>
              </div>
              {resultado.dadosExtraidos && (
                <div className="p-3 rounded-lg glass-card space-y-1">
                  <p className="text-amber-400 text-[10px] font-bold mb-1">Dados extraidos:</p>
                  {resultado.dadosExtraidos.endereco && <div className="flex items-center gap-2 text-[10px]"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-300">{resultado.dadosExtraidos.endereco}</span></div>}
                  {resultado.dadosExtraidos.bairro && <div className="flex items-center gap-2 text-[10px]"><Navigation className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-300">{resultado.dadosExtraidos.bairro}</span></div>}
                  {resultado.geocoding && <div className="flex items-center gap-2 text-[10px]"><MapPin className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-emerald-400">Localizado em Balneario Camboriu</span></div>}
                </div>
              )}
            </div>
          )}
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
        <div className="flex items-center gap-1.5 text-[10px]"><Calendar className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{fd(o.dataOcorrencia)} as {fh(o.dataOcorrencia)}</span></div>
        {(o.veiculoTipo || o.veiculoCor) && <div className="flex items-center gap-1.5 text-[10px]"><BikeIcon className="w-3 h-3 text-slate-400 shrink-0" /><span className="text-slate-700">{o.veiculoTipo}{o.veiculoCor && ` - ${o.veiculoCor}`}</span></div>}
      </div>
      <p className="text-[8px] text-slate-400 mt-1.5 pt-1 border-t border-slate-200">Registrado em {new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
    </div>
  );
}

function contarPorBairro(ocorrencias: Ocorrencia[]): Record<string, number> {
  const map: Record<string, number> = {};
  ocorrencias.filter(o => o.status === 'ativo').forEach(o => {
    let matched = '';
    for (const b of Object.keys(BAIRROS)) {
      if ((o.bairro && (b.toLowerCase().includes(o.bairro.toLowerCase()) || o.bairro.toLowerCase().includes(b.toLowerCase())))) { matched = b; break; }
    }
    if (!matched) {
      for (const b of Object.keys(BAIRROS)) { if (o.endereco.toLowerCase().includes(b.toLowerCase())) { matched = b; break; } }
    }
    if (!matched) matched = 'Centro';
    map[matched] = (map[matched] || 0) + 1;
  });
  return map;
}

function getCorRisco(count: number) {
  if (count >= 5) return { fill: '#ef4444', stroke: '#dc2626', label: 'PERIGO', text: 'text-red-400', opacity: 0.25 };
  if (count >= 3) return { fill: '#f97316', stroke: '#ea580c', label: 'ATENCAO', text: 'text-orange-400', opacity: 0.22 };
  if (count >= 1) return { fill: '#eab308', stroke: '#ca8a04', label: 'MODERADO', text: 'text-yellow-400', opacity: 0.18 };
  return { fill: '#10b981', stroke: '#059669', label: 'SEGURO', text: 'text-emerald-400', opacity: 0.08 };
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
    try { const res = await fetch(`${API_BASE}/ocorrencias?dias=60`); if (res.ok) setOcorrencias(await res.json()); } catch {}
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try { const res = await fetch(`${API_BASE}/ocorrencias/stats?dias=60`); if (res.ok) setStats(await res.json()); } catch {}
  }, []);

  useEffect(() => { fetchOcorrencias(); fetchStats(); }, [fetchOcorrencias, fetchStats]);

  const porBairro = useMemo(() => contarPorBairro(ocorrencias), [ocorrencias]);

  const bikePositions = useMemo(() => bikes.map((b, i) => ({
    ...b,
    position: [[-0.008,0.005],[0.006,-0.007],[-0.005,-0.004],[0.009,0.003],[-0.003,0.008],[0.004,0.006],[-0.007,-0.002],[0.002,-0.009]][i % 8].map((o, j) => center[j] + o) as [number, number]
  })), [bikes, center]);

  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const isDentroBC = (lat: number, lng: number) => lat >= -27.06 && lat <= -26.95 && lng >= -48.68 && lng <= -48.58;

  return (
    <div className="h-[100dvh] w-full bg-[#0c1222] relative overflow-hidden flex flex-col">

      {/* Header */}
      <div className="relative z-20 bg-[#0c1222]/90 backdrop-blur-lg border-b border-white/5 shrink-0">
        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-3 pb-2.5">
          <div className="flex items-center gap-3 mb-2.5">
            <Link to="/" className="w-9 h-9 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white">Mapa da Seguranca</h1>
              <p className="text-[10px] text-slate-400 truncate">
                {activeTab === 'Rastreamento' ? `${bikes.length} equipamento(s)` : activeTab === 'AreaSegura' ? `${ocorrencias.length} ocorrencia(s) real(is)` : `${CICLOVIAS.length} vias cicloviarias`}
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
                {tab === 'Rastreamento' ? 'MEUS EQUIPAMENTOS' : tab === 'AreaSegura' ? 'AREA SEGURA' : 'CICLOVIAS'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <MapContainer center={center} zoom={activeTab === 'Ciclovias' ? 14 : 13} style={{ height: '100%', width: '100%', background: '#0c1222' }} zoomControl={false}>
          {activeTab === 'Ciclovias' ? (
            <>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' />
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" pane="overlayPane" />
            </>
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
          )}

          {activeTab === 'Rastreamento' ? (
            bikePositions.map(b => (
              <Marker key={b.id} position={b.position} icon={bikeIcon}>
                <Popup><div className="p-2 min-w-[180px]">{b.photo && <img src={b.photo} alt={b.name} className="w-full h-24 object-cover rounded-lg mb-2" />}<p className="font-bold text-sm text-[#0c1222]">{b.name}</p><p className="text-xs text-slate-600">{b.type} - {b.brand}</p><div className="flex items-center gap-1 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-emerald-600 text-[10px]">{b.lastSeen}</span></div></div></Popup>
              </Marker>
            ))
          ) : activeTab === 'AreaSegura' ? (
            <>
              <Circle center={center} radius={4200}
                pathOptions={{ fillColor: '#10b981', color: '#059669', fillOpacity: 0.06, weight: 2, dashArray: '6, 4' }}>
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <p className="font-bold text-sm text-[#0c1222]">Balneario Camboriu</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">AREA SEGURA</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {ocorrencias.length === 0 ? 'Sem ocorrencias registradas' : `${ocorrencias.length} ocorrencia(s) registrada(s)`}
                    </p>
                  </div>
                </Popup>
              </Circle>

              {Object.entries(BAIRROS).map(([bairro, pos]) => {
                const count = porBairro[bairro] || 0;
                if (count < 3) return null;
                const n = getCorRisco(count);
                return (
                  <Circle key={bairro} center={pos} radius={450}
                    pathOptions={{ fillColor: n.fill, color: n.stroke, fillOpacity: n.opacity, weight: 2.5 }}>
                    <Popup>
                      <div className="p-2 min-w-[160px]">
                        <p className="font-bold text-sm text-[#0c1222]">{bairro}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: n.fill }} />
                          <span className="text-xs font-medium" style={{ color: n.fill }}>{n.label}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{count} ocorrencia(s)</p>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {ocorrencias.filter(o => o.status === 'ativo' && isDentroBC(o.lat, o.lng)).map(o => (
                <Marker key={o._id} position={[o.lat, o.lng]} icon={o.tipo === 'manual' ? theftIcon : monitoredIcon}>
                  <Popup><OcorrenciaPopup o={o} /></Popup>
                </Marker>
              ))}
            </>
          ) : (
            <CicloviasLayer />
          )}
        </MapContainer>

        {/* Legend */}
        <AnimatePresence mode="wait">
          {activeTab === 'AreaSegura' ? (
            <motion.div key="legend-seg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-3 right-3 z-[400]">
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
                        {ocorrencias.length === 0 && <p className="text-[10px] text-slate-500 text-center py-2">Nenhuma ocorrencia. Clique no botao verde para adicionar.</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="glass-card p-3">
                <button onClick={() => setStatsOpen(!statsOpen)} className="w-full flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white text-[11px] font-bold">Nivel por Bairro</span>
                  </div>
                  {statsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {statsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-2.5 space-y-1.5">
                        {Object.entries(BAIRROS).map(([bairro]) => {
                          const count = porBairro[bairro] || 0;
                          const n = getCorRisco(count);
                          return (
                            <div key={bairro} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: n.fill }} />
                              <span className="text-[10px] text-slate-300 flex-1">{bairro}</span>
                              <span className={`text-[10px] font-bold ${n.text}`}>{count}</span>
                              {count > 0 && <span className="text-[8px] text-slate-500 w-14 text-right">{n.label}</span>}
                            </div>
                          );
                        })}
                      </div>
                      {stats && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-red-400" /><span className="text-[9px] text-slate-400">Rep.: {stats.manual}</span></div>
                            <div className="flex items-center gap-1"><CircleDot className="w-2.5 h-2.5 text-orange-400" /><span className="text-[9px] text-slate-400">Mon.: {stats.monitorado}</span></div>
                          </div>
                          <button onClick={() => { fetchOcorrencias(); fetchStats(); }} className="text-[9px] text-amber-400 cursor-pointer hover:underline">Atualizar</button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {!statsOpen && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full border border-dashed border-emerald-500 bg-emerald-500/20" /><span className="text-[8px] text-slate-400">BC Seguro</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-[8px] text-slate-400">Moderado</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-[8px] text-slate-400">Atencao</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[8px] text-slate-400">Perigo</span></div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'Ciclovias' ? (
            <motion.div key="legend-ciclov" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-3 right-3 z-[400]">
              <div className="glass-card p-3 space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                {CICLOVIAS.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: c.corBg }}>
                      <Bike className="w-5 h-5" style={{ color: c.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs font-semibold truncate">{c.nome}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: c.cor, backgroundColor: c.cor + '15' }}>{tipoLabel[c.tipo]}</span>
                        <span className="text-[10px] text-slate-400">{c.distancia}</span>
                        <span className="text-[10px] text-emerald-400">Ativa</span>
                      </div>
                    </div>
                  </div>
                ))}
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
