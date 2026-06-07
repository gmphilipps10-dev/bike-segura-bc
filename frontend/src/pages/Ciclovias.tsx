import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bike, MapPin, Navigation, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Ciclovia {
  id: string;
  nome: string;
  distancia: string;
  tipo: 'ciclovia' | 'ciclofaixa' | 'ciclorrota';
  cor: string;
  coordenadas: [number, number][];
}

// Ciclovias conhecidas de Balneario Camboriu / Itapema / Itajai
const cicloviasBC: Ciclovia[] = [
  {
    id: '1',
    nome: 'Av. Atlantica (Centro)',
    distancia: '3,2 km',
    tipo: 'ciclovia',
    cor: '#10b981',
    coordenadas: [
      [-26.9935, -48.6358], [-26.9920, -48.6345], [-26.9905, -48.6332],
      [-26.9890, -48.6320], [-26.9875, -48.6308], [-26.9860, -48.6295],
      [-26.9845, -48.6283], [-26.9830, -48.6270],
    ],
  },
  {
    id: '2',
    nome: 'Av. Brasil (Centro - Nações)',
    distancia: '5,8 km',
    tipo: 'ciclovia',
    cor: '#10b981',
    coordenadas: [
      [-26.9900, -48.6350], [-26.9885, -48.6330], [-26.9870, -48.6310],
      [-26.9855, -48.6290], [-26.9840, -48.6270], [-26.9825, -48.6250],
      [-26.9810, -48.6230], [-26.9795, -48.6210], [-26.9780, -48.6190],
      [-26.9765, -48.6170], [-26.9750, -48.6150],
    ],
  },
  {
    id: '3',
    nome: 'Rua 1500 (Meia Praia)',
    distancia: '2,5 km',
    tipo: 'ciclofaixa',
    cor: '#f59e0b',
    coordenadas: [
      [-26.9850, -48.6200], [-26.9840, -48.6180], [-26.9830, -48.6160],
      [-26.9820, -48.6140], [-26.9810, -48.6120], [-26.9800, -48.6100],
    ],
  },
  {
    id: '4',
    nome: 'Av. Santa Catarina (Barra Norte)',
    distancia: '4,0 km',
    tipo: 'ciclovia',
    cor: '#10b981',
    coordenadas: [
      [-26.9800, -48.6100], [-26.9790, -48.6080], [-26.9780, -48.6060],
      [-26.9770, -48.6040], [-26.9760, -48.6020], [-26.9750, -48.6000],
      [-26.9740, -48.5980], [-26.9730, -48.5960],
    ],
  },
  {
    id: '5',
    nome: 'Orla de Itapema (Meia Praia)',
    distancia: '6,0 km',
    tipo: 'ciclovia',
    cor: '#10b981',
    coordenadas: [
      [-27.0020, -48.6100], [-27.0010, -48.6080], [-27.0000, -48.6060],
      [-26.9990, -48.6040], [-26.9980, -48.6020], [-26.9970, -48.6000],
      [-26.9960, -48.5980], [-26.9950, -48.5960], [-26.9940, -48.5940],
      [-26.9930, -48.5920], [-26.9920, -48.5900], [-26.9910, -48.5880],
    ],
  },
];

const tipoLabel: Record<string, string> = {
  ciclovia: 'Ciclovia',
  ciclofaixa: 'Ciclofaixa',
  ciclorrota: 'Ciclorrota',
};

export default function Ciclovias() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const [selected, setSelected] = useState<Ciclovia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mapInstance: any = null;

    const initMap = async () => {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix Leaflet default icon path
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Centro de Balneario Camboriu
      const map = L.map(mapRef.current).setView([-26.9850, -48.6200], 13);
      mapInstance = map;
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Adiciona rotas de ciclovias
      cicloviasBC.forEach((c) => {
        const polyline = L.polyline(c.coordenadas, {
          color: c.cor,
          weight: 5,
          opacity: 0.8,
          dashArray: c.tipo === 'ciclofaixa' ? '10, 10' : undefined,
        }).addTo(map);

        // Popup ao clicar na linha
        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 150px;">
            <strong style="color: ${c.cor};">${tipoLabel[c.tipo]}</strong><br/>
            <b>${c.nome}</b><br/>
            <small>Distancia: ${c.distancia}</small>
          </div>
        `);

        // Evento de click para selecionar
        polyline.on('click', () => setSelected(c));
      });

      setLoading(false);
    };

    initMap();

    return () => {
      if (mapInstance) mapInstance.remove();
    };
  }, []);

  const focusCiclovia = (c: Ciclovia) => {
    setSelected(c);
    if (leafletMap.current) {
      const mid = Math.floor(c.coordenadas.length / 2);
      leafletMap.current.flyTo(c.coordenadas[mid], 15, { duration: 1.5 });
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0c1222] relative flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 flex items-center gap-3 px-4 py-3 z-20 bg-[#0c1222]/80 backdrop-blur-sm border-b border-white/5"
      >
        <Link to="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </motion.div>
        </Link>
        <div className="flex items-center gap-2">
          <Bike className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-white font-bold text-sm">Ciclovias</h1>
            <p className="text-slate-400 text-[10px]">Balneario Camboriu e Regiao</p>
          </div>
        </div>
      </motion.header>

      {/* Mapa */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="absolute inset-0" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0c1222]">
            <div className="text-center">
              <Bike className="w-8 h-8 text-emerald-400 animate-bounce mx-auto mb-2" />
              <p className="text-slate-400 text-xs">Carregando mapa...</p>
            </div>
          </div>
        )}

        {/* Legenda */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-3 right-3 z-[400] glass-card p-2.5 rounded-lg space-y-1.5"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-300">Ciclovia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-amber-500" style={{ background: 'repeating-linear-gradient(90deg, #f59e0b, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-[10px] text-slate-300">Ciclofaixa</span>
          </div>
        </motion.div>
      </div>

      {/* Lista de ciclovias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="shrink-0 bg-[#0c1222] border-t border-white/5"
      >
        <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto">
          {cicloviasBC.map((c) => (
            <button
              key={c.id}
              onClick={() => focusCiclovia(c)}
              className={`w-full glass-card p-2.5 flex items-center gap-3 text-left transition-all cursor-pointer ${
                selected?.id === c.id ? 'border-emerald-400/30 bg-emerald-500/5' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: c.cor + '20' }}>
                <Bike className="w-5 h-5" style={{ color: c.cor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xs font-semibold truncate">{c.nome}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Ruler className="w-3 h-3" /> {c.distancia}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: c.cor, backgroundColor: c.cor + '15' }}>
                    {tipoLabel[c.tipo]}
                  </span>
                </div>
              </div>
              <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
