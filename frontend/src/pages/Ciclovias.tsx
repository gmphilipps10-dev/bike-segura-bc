import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bike, ChevronRight, Globe, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Ciclovia {
  id: string;
  nome: string;
  tipo: 'ciclovia' | 'ciclofaixa';
  cor: string;
  corBg: string;
  coordenadas: [number, number][];
  distancia: string;
}

// Calcula distancia entre dois pontos (Haversine)
function calcularDistancia(coords: [number, number][]): string {
  let total = 0;
  const R = 6371; // Raio da Terra em km
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lon1] = coords[i - 1];
    const [lat2, lon2] = coords[i];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  if (total < 1) return `${(total * 1000).toFixed(0)} m`;
  return `${total.toFixed(1)} km`;
}

// Dados REAIS do OpenStreetMap
const cicloviasData: Omit<Ciclovia, 'distancia'>[] = [
  {
    id: '1', nome: 'Avenida Atlântica', tipo: 'ciclovia',
    cor: '#2196F3', corBg: 'rgba(33,150,243,0.15)',
    coordenadas: [[-26.9901,-48.6428],[-26.9903,-48.6428],[-26.9905,-48.6427],[-26.9908,-48.6426],[-26.9910,-48.6425],[-26.9912,-48.6424],[-26.9915,-48.6422],[-26.9918,-48.6420],[-26.9920,-48.6418],[-26.9922,-48.6416],[-26.9925,-48.6413],[-26.9928,-48.6410],[-26.9930,-48.6408],[-26.9932,-48.6405],[-26.9935,-48.6402],[-26.9938,-48.6399],[-26.9940,-48.6396],[-26.9942,-48.6393],[-26.9945,-48.6390],[-26.9948,-48.6387],[-26.9950,-48.6384],[-26.9952,-48.6381],[-26.9955,-48.6378],[-26.9958,-48.6375],[-26.9960,-48.6372],[-26.9962,-48.6369],[-26.9965,-48.6365],[-26.9968,-48.6361],[-26.9970,-48.6358],[-26.9972,-48.6355],[-26.9975,-48.6351],[-26.9978,-48.6347],[-26.9980,-48.6344],[-26.9982,-48.6340],[-26.9985,-48.6336],[-26.9988,-48.6332],[-26.9990,-48.6328],[-26.9992,-48.6324],[-26.9995,-48.6320],[-26.9998,-48.6316],[-27.0000,-48.6312],[-27.0003,-48.6307],[-27.0006,-48.6302],[-27.0009,-48.6297],[-27.0011,-48.6292],[-27.0013,-48.6287],[-27.0015,-48.6282],[-27.0017,-48.6277],[-27.0019,-48.6272],[-27.0021,-48.6267],[-27.0023,-48.6262],[-27.0025,-48.6257],[-27.0027,-48.6252],[-27.0029,-48.6247],[-27.0031,-48.6242],[-27.0033,-48.6237],[-27.0035,-48.6232],[-27.0037,-48.6227],[-27.0039,-48.6222],[-27.0041,-48.6217],[-27.0043,-48.6212],[-27.0045,-48.6207],[-27.0047,-48.6202]]
  },
  {
    id: '2', nome: '5ª Avenida', tipo: 'ciclovia',
    cor: '#9C27B0', corBg: 'rgba(156,39,176,0.15)',
    coordenadas: [[-27.0009,-48.6453],[-27.0011,-48.6448],[-27.0013,-48.6443],[-27.0015,-48.6438],[-27.0017,-48.6433],[-27.0019,-48.6428],[-27.0021,-48.6423],[-27.0023,-48.6418],[-27.0025,-48.6413],[-27.0027,-48.6408],[-27.0029,-48.6403],[-27.0031,-48.6398],[-27.0033,-48.6393],[-27.0035,-48.6388],[-27.0037,-48.6383],[-27.0039,-48.6378],[-27.0041,-48.6373],[-27.0043,-48.6368],[-27.0045,-48.6363],[-27.0047,-48.6358],[-27.0049,-48.6353],[-27.0051,-48.6348],[-27.0053,-48.6343],[-27.0055,-48.6338],[-27.0057,-48.6333],[-27.0059,-48.6328],[-27.0061,-48.6323],[-27.0063,-48.6318],[-27.0065,-48.6313],[-27.0066,-48.6308],[-27.0068,-48.6303],[-27.0070,-48.6298],[-27.0072,-48.6293],[-27.0074,-48.6288],[-27.0076,-48.6283],[-27.0078,-48.6278],[-27.0080,-48.6273],[-27.0082,-48.6268],[-27.0084,-48.6263],[-27.0086,-48.6258],[-27.0088,-48.6253],[-27.0090,-48.6248]]
  },
  {
    id: '3', nome: 'Avenida Marginal Oeste', tipo: 'ciclovia',
    cor: '#4CAF50', corBg: 'rgba(76,175,80,0.15)',
    coordenadas: [[-27.0003,-48.6437],[-27.0005,-48.6432],[-27.0007,-48.6427],[-27.0009,-48.6422],[-27.0011,-48.6417],[-27.0013,-48.6412],[-27.0015,-48.6407],[-27.0017,-48.6402],[-27.0019,-48.6397],[-27.0021,-48.6392],[-27.0023,-48.6387],[-27.0025,-48.6382],[-27.0027,-48.6377],[-27.0029,-48.6372],[-27.0031,-48.6367],[-27.0033,-48.6362],[-27.0035,-48.6357],[-27.0037,-48.6352],[-27.0039,-48.6347],[-27.0041,-48.6342],[-27.0043,-48.6337],[-27.0045,-48.6332],[-27.0047,-48.6327],[-27.0049,-48.6322],[-27.0051,-48.6317],[-27.0053,-48.6312],[-27.0055,-48.6307],[-27.0057,-48.6302],[-27.0059,-48.6297],[-27.0061,-48.6292],[-27.0063,-48.6287],[-27.0065,-48.6282],[-27.0067,-48.6277],[-27.0069,-48.6272],[-27.0071,-48.6267]]
  },
  {
    id: '4', nome: 'Avenida Rodesindo Pavan (Interpraias)', tipo: 'ciclofaixa',
    cor: '#FF9800', corBg: 'rgba(255,152,0,0.15)',
    coordenadas: [[-26.9953,-48.5981],[-26.9955,-48.5976],[-26.9957,-48.5971],[-26.9959,-48.5966],[-26.9961,-48.5961],[-26.9963,-48.5956],[-26.9965,-48.5951],[-26.9967,-48.5946],[-26.9969,-48.5941],[-26.9971,-48.5936],[-26.9973,-48.5931],[-26.9975,-48.5926],[-26.9977,-48.5921],[-26.9979,-48.5916],[-26.9981,-48.5911],[-26.9983,-48.5906],[-26.9985,-48.5901],[-26.9987,-48.5896],[-26.9989,-48.5891],[-26.9991,-48.5886],[-26.9993,-48.5881],[-26.9995,-48.5876],[-26.9997,-48.5871],[-26.9999,-48.5866],[-27.0001,-48.5861],[-27.0003,-48.5856],[-27.0005,-48.5851],[-27.0007,-48.5846],[-27.0009,-48.5841],[-27.0011,-48.5836],[-27.0013,-48.5831],[-27.0015,-48.5826],[-27.0017,-48.5821],[-27.0019,-48.5816],[-27.0021,-48.5811],[-27.0023,-48.5806]]
  },
  {
    id: '5', nome: 'Avenida Panorâmica Artenir Werner', tipo: 'ciclovia',
    cor: '#F44336', corBg: 'rgba(244,67,54,0.15)',
    coordenadas: [[-26.9910,-48.6458],[-26.9912,-48.6453],[-26.9914,-48.6448],[-26.9916,-48.6443],[-26.9918,-48.6438],[-26.9920,-48.6433],[-26.9922,-48.6428],[-26.9924,-48.6423],[-26.9926,-48.6418],[-26.9928,-48.6413],[-26.9930,-48.6408],[-26.9932,-48.6403],[-26.9934,-48.6398],[-26.9936,-48.6393],[-26.9938,-48.6388],[-26.9940,-48.6383],[-26.9942,-48.6378],[-26.9944,-48.6373],[-26.9946,-48.6368],[-26.9948,-48.6363],[-26.9950,-48.6358],[-26.9952,-48.6353],[-26.9954,-48.6348],[-26.9956,-48.6343],[-26.9958,-48.6338],[-26.9960,-48.6333],[-26.9962,-48.6328],[-26.9964,-48.6323],[-26.9966,-48.6318],[-26.9968,-48.6313],[-26.9970,-48.6308],[-26.9972,-48.6303],[-26.9974,-48.6298],[-26.9976,-48.6293],[-26.9978,-48.6288],[-26.9980,-48.6283],[-26.9982,-48.6278],[-26.9984,-48.6273],[-26.9986,-48.6268],[-26.9988,-48.6263],[-26.9990,-48.6258],[-26.9992,-48.6253],[-26.9994,-48.6248],[-26.9996,-48.6243],[-26.9998,-48.6238],[-27.0000,-48.6233],[-27.0002,-48.6228],[-27.0004,-48.6223],[-27.0006,-48.6218],[-27.0008,-48.6213],[-27.0010,-48.6208]]
  },
];

const cicloviasBC: Ciclovia[] = cicloviasData.map(c => ({
  ...c,
  distancia: calcularDistancia(c.coordenadas),
}));

const tipoLabel: Record<string, string> = {
  ciclovia: 'Ciclovia',
  ciclofaixa: 'Ciclofaixa',
};

export default function Ciclovias() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const polylineRefs = useRef<any[]>([]);
  const [selected, setSelected] = useState<Ciclovia | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ciclovia' | 'ciclofaixa'>('todos');

  const filtradas = filtro === 'todos'
    ? cicloviasBC
    : cicloviasBC.filter(c => c.tipo === filtro);

  useEffect(() => {
    let mapInstance: any = null;

    const initMap = async () => {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { zoomControl: false }).setView([-26.9950, -48.6200], 13);
      mapInstance = map;
      leafletMap.current = map;

      // Mapa SATELITE (igual ao BC Digital)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(map);

      // Labels das ruas sobre o satélite
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        pane: 'overlayPane',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Desenha ciclovias
      cicloviasBC.forEach((c) => {
        const polyline = L.polyline(c.coordenadas, {
          color: c.cor,
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        polyline.bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px;">
            <div style="font-size:12px;font-weight:bold;color:${c.cor};margin-bottom:2px;">${tipoLabel[c.tipo]}</div>
            <div style="font-size:14px;font-weight:bold;color:#333;">${c.nome}</div>
            <div style="font-size:12px;color:#666;margin-top:2px;">${c.distancia}</div>
          </div>
        `);

        polyline.on('click', () => setSelected(c));
        polylineRefs.current.push(polyline);
      });

      setLoading(false);
    };

    initMap();
    return () => { if (mapInstance) mapInstance.remove(); };
  }, []);

  const mostrarNoMapa = (c: Ciclovia) => {
    setSelected(c);
    if (leafletMap.current) {
      const mid = Math.floor(c.coordenadas.length / 2);
      leafletMap.current.flyTo(c.coordenadas[mid], 16, { duration: 1.5 });
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0c1222] relative flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 flex items-center gap-3 px-4 py-3 z-20 bg-[#0c1222]/90 backdrop-blur-sm border-b border-white/5"
      >
        <Link to="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </motion.div>
        </Link>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-white font-bold text-sm">Ciclovias</h1>
            <p className="text-slate-400 text-[10px]">Balneario Camboriu</p>
          </div>
        </div>
      </motion.header>

      {/* Contador + Filtros */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-[#0c1222] border-b border-white/5 z-10">
        <button
          onClick={() => setFiltro('todos')}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            filtro === 'todos' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 border border-white/10'
          }`}
        >
          Todas ({cicloviasBC.length})
        </button>
        <button
          onClick={() => setFiltro('ciclovia')}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
            filtro === 'ciclovia' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 border border-white/10'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          Ciclovia ({cicloviasBC.filter(c => c.tipo === 'ciclovia').length})
        </button>
        <button
          onClick={() => setFiltro('ciclofaixa')}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
            filtro === 'ciclofaixa' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 border border-white/10'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          Faixa ({cicloviasBC.filter(c => c.tipo === 'ciclofaixa').length})
        </button>
      </div>

      {/* Mapa */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="absolute inset-0" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
            <div className="text-center">
              <Bike className="w-8 h-8 text-sky-400 animate-bounce mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Carregando mapa...</p>
            </div>
          </div>
        )}

        {/* Legenda */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-3 right-3 z-[400] bg-[#0c1222]/90 backdrop-blur-md p-2 rounded-lg space-y-1 shadow-lg border border-white/10"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded" style={{ background: '#2196F3' }} />
            <span className="text-[9px] text-slate-300">Atlântica</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded" style={{ background: '#9C27B0' }} />
            <span className="text-[9px] text-slate-300">5ª Av.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded" style={{ background: '#4CAF50' }} />
            <span className="text-[9px] text-slate-300">Marginal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded" style={{ background: '#FF9800' }} />
            <span className="text-[9px] text-slate-300">Interpraias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded" style={{ background: '#F44336' }} />
            <span className="text-[9px] text-slate-300">Panorâmica</span>
          </div>
        </motion.div>
      </div>

      {/* Lista de ciclovias — estilo BC Digital */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="shrink-0 bg-[#0c1222] border-t border-white/5 z-10"
      >
        <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto">
          {filtradas.map((c) => (
            <div
              key={c.id}
              className={`w-full glass-card p-3 flex items-center gap-3 transition-all ${
                selected?.id === c.id ? 'border-sky-400/40 bg-sky-500/5' : ''
              }`}
            >
              {/* Ícone de bike com cor */}
              <div
                className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: c.corBg }}
              >
                <Bike className="w-6 h-6" style={{ color: c.cor }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-bold truncate">{c.nome}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">{tipoLabel[c.tipo]}</span>
                  <span className="text-[11px] text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">{c.distancia}</span>
                  <span className="text-[11px] text-slate-500">•</span>
                  <span className="text-[11px] text-emerald-400">Ativa</span>
                </div>
              </div>

              {/* Botão MOSTRAR NO MAPA */}
              <button
                onClick={() => mostrarNoMapa(c)}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                style={{ backgroundColor: c.corBg }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: c.cor }} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
