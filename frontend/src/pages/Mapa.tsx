import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, Shield, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useBikes } from '../context/BikeContext';
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

/* ===== Security Zones Data (Balneario Camboriu areas) ===== */
const securityZones = [
  { name: 'Centro / Avenida Atlântica', center: [-26.9975, -48.6352] as [number, number], radius: 1100, level: 'danger', incidents: 28, label: 'PERIGOSO' },
  { name: 'Barra Norte', center: [-26.9800, -48.6200] as [number, number], radius: 900, level: 'warning', incidents: 16, label: 'ATENÇÃO' },
  { name: 'Barra Sul', center: [-27.0150, -48.6400] as [number, number], radius: 800, level: 'warning', incidents: 14, label: 'ATENÇÃO' },
  { name: 'Praia Brava', center: [-26.9600, -48.6100] as [number, number], radius: 1000, level: 'caution', incidents: 9, label: 'MODERADO' },
  { name: 'Nações', center: [-27.0050, -48.6600] as [number, number], radius: 750, level: 'safe', incidents: 4, label: 'SEGURO' },
  { name: 'Vila Real', center: [-27.0250, -48.6350] as [number, number], radius: 850, level: 'caution', incidents: 7, label: 'MODERADO' },
  { name: 'Pioneiros', center: [-27.0080, -48.6500] as [number, number], radius: 700, level: 'safe', incidents: 3, label: 'SEGURO' },
  { name: 'Jardim Iate Clube', center: [-26.9900, -48.6450] as [number, number], radius: 950, level: 'danger', incidents: 21, label: 'PERIGOSO' },
  { name: 'Rio Pequeno', center: [-27.0350, -48.6250] as [number, number], radius: 800, level: 'safe', incidents: 2, label: 'SEGURO' },
  { name: 'Santa Regina', center: [-27.0180, -48.6650] as [number, number], radius: 900, level: 'caution', incidents: 8, label: 'MODERADO' },
];

const levelColors: Record<string, { fill: string; stroke: string; text: string; bg: string }> = {
  safe:     { fill: '#10b981', stroke: '#059669', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  caution:  { fill: '#eab308', stroke: '#ca8a04', text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  warning:  { fill: '#f97316', stroke: '#ea580c', text: 'text-orange-400', bg: 'bg-orange-500/20' },
  danger:   { fill: '#ef4444', stroke: '#dc2626', text: 'text-red-400', bg: 'bg-red-500/20' },
};

// Fixed bike positions relative to center - deterministic based on bike ID
const getBikePosition = (index: number): [number, number] => {
  // Create fixed offsets for each bike to avoid random positioning
  const offsets = [
    [-0.008, 0.005],
    [0.006, -0.007],
    [-0.005, -0.004],
    [0.009, 0.003],
    [-0.003, 0.008],
    [0.004, 0.006],
    [-0.007, -0.002],
    [0.002, -0.009],
  ];
  const base: [number, number] = [-26.9975, -48.6352];
  const offset = offsets[index % offsets.length];
  return [base[0] + offset[0], base[1] + offset[1]];
};

const tabNames = ['Rastreamento', 'Segurança'] as const;
type TabType = typeof tabNames[number];

export default function Mapa() {
  const { bikes } = useBikes();
  const [activeTab, setActiveTab] = useState<TabType>('Rastreamento');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Balneario Camboriu center coordinates
  const center: [number, number] = [-26.9975, -48.6352];

  const stats = {
    total: securityZones.reduce((acc, z) => acc + z.incidents, 0),
    danger: securityZones.filter(z => z.level === 'danger').length,
    safe: securityZones.filter(z => z.level === 'safe').length,
  };

  // Memoize bike positions so they don't change on re-render
  const bikePositions = useMemo(() => {
    return bikes.map((bike, i) => ({
      ...bike,
      position: getBikePosition(i)
    }));
  }, [bikes]);

  return (
    <div className="h-screen bg-[#0c1222] relative overflow-hidden flex flex-col">

      {/* Header */}
      <div className="relative z-20 bg-[#0c1222]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-4 mb-3">
            <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Mapa</h1>
              <p className="text-xs text-slate-400">
                {activeTab === 'Rastreamento' ? `${bikes.length} equipamento(s) monitorado(s)` : `${stats.total} incidentes reportados`}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1">
            {tabNames.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'Rastreamento' ? 'MEUS EQUIPAMENTOS' : 'SEGURANÇA DA ÁREA'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#0c1222' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {activeTab === 'Rastreamento' ? (
            /* Bike Markers */
            bikePositions.map(bike => (
              <Marker
                key={bike.id}
                position={bike.position}
                icon={customBikeIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[180px]">
                    {bike.photo && (
                      <img src={bike.photo} alt={bike.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <p className="font-bold text-sm text-[#0c1222]">{bike.name}</p>
                    <p className="text-xs text-slate-600">{bike.type} • {bike.brand}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-emerald-600 text-[10px] font-medium">{bike.lastSeen}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))
          ) : (
            /* Security Zones */
            securityZones.map(zone => {
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
                  eventHandlers={{
                    click: () => setSelectedZone(zone.name),
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-sm text-[#0c1222]">{zone.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.fill }} />
                        <span className="text-xs font-medium" style={{ color: colors.fill }}>{zone.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{zone.incidents} incidente(s) reportado(s)</p>
                    </div>
                  </Popup>
                </Circle>
              );
            })
          )}
        </MapContainer>

        {/* Floating Legend */}
        <AnimatePresence mode="wait">
          {activeTab === 'Segurança' ? (
            <motion.div
              key="legend-seguranca"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 z-[400]"
            >
              <div className="glass-card p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white text-[11px] font-bold">Nível de Segurança</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Seguro', color: 'bg-emerald-500', count: stats.safe },
                    { label: 'Moderado', color: 'bg-yellow-500', count: securityZones.filter(z => z.level === 'caution').length },
                    { label: 'Atenção', color: 'bg-orange-500', count: securityZones.filter(z => z.level === 'warning').length },
                    { label: 'Perigoso', color: 'bg-red-500', count: stats.danger },
                  ].map(item => (
                    <div key={item.label} className="flex-1 text-center">
                      <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1`} />
                      <p className="text-white text-[9px] font-medium">{item.label}</p>
                      <p className="text-slate-500 text-[9px]">{item.count} área(s)</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <p className="text-slate-500 text-[9px] text-center">
                    Dados atualizados com base em reportes da comunidade • {stats.total} incidentes no último mês
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="legend-rastreamento"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 z-[400]"
            >
              <div className="glass-card p-3.5 flex items-center gap-3">
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
    </div>
  );
}
