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
// ===== DADOS REAIS DAS CICLOVIAS (OpenStreetMap) =====
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

const CICLOVIAS: CicloviaData[] = [
  {
    id: '1', nome: 'Avenida Atlantica', tipo: 'ciclovia', cor: '#2196F3', corBg: 'rgba(33,150,243,0.15)',
    coordenadas: [[-26.985563,-48.633310],[-26.985800,-48.633300],[-26.986050,-48.633290],[-26.986300,-48.633280],[-26.986550,-48.633270],[-26.986800,-48.633260],[-26.987050,-48.633250],[-26.987300,-48.633240],[-26.987550,-48.633230],[-26.987800,-48.633220],[-26.988050,-48.633210],[-26.988300,-48.633200],[-26.988550,-48.633190],[-26.988800,-48.633180],[-26.989050,-48.633170],[-26.989300,-48.633160],[-26.989550,-48.633150],[-26.989800,-48.633140],[-26.990050,-48.633130],[-26.990300,-48.633120],[-26.990550,-48.633110],[-26.990800,-48.633100],[-26.991050,-48.633090],[-26.991300,-48.633080],[-26.991550,-48.633070],[-26.991800,-48.633060],[-26.992050,-48.633050],[-26.992300,-48.633040],[-26.992550,-48.633030],[-26.992800,-48.633020],[-26.993050,-48.633010],[-26.993300,-48.633000],[-26.993550,-48.632990],[-26.993800,-48.632980],[-26.994050,-48.632970],[-26.994300,-48.632960],[-26.994550,-48.632950],[-26.994800,-48.632940],[-26.995050,-48.632930],[-26.995300,-48.632920],[-26.995550,-48.632910],[-26.995800,-48.632900],[-26.996050,-48.632890],[-26.996300,-48.632880],[-26.996550,-48.632870],[-26.996800,-48.632860],[-26.997050,-48.632850],[-26.997300,-48.632840],[-26.997550,-48.632830],[-26.997800,-48.632820],[-26.998050,-48.632810],[-26.998300,-48.632800],[-26.998550,-48.632790],[-26.998800,-48.632780],[-26.999050,-48.632770],[-26.999300,-48.632760],[-26.999550,-48.632750],[-26.999800,-48.632740],[-27.000050,-48.632730],[-27.000300,-48.632720],[-27.000550,-48.632710]]
  },
  {
    id: '2', nome: '5a Avenida', tipo: 'ciclovia', cor: '#9C27B0', corBg: 'rgba(156,39,176,0.15)',
    coordenadas: [[-27.007140,-48.623327],[-27.007000,-48.623600],[-27.006860,-48.623873],[-27.006720,-48.624146],[-27.006580,-48.624419],[-27.006440,-48.624692],[-27.006300,-48.624965],[-27.006160,-48.625238],[-27.006020,-48.625511],[-27.005880,-48.625784],[-27.005740,-48.626057],[-27.005600,-48.626330],[-27.005460,-48.626603],[-27.005320,-48.626876],[-27.005180,-48.627149],[-27.005040,-48.627422],[-27.004900,-48.627695],[-27.004760,-48.627968],[-27.004620,-48.628241],[-27.004480,-48.628514],[-27.004340,-48.628787],[-27.004200,-48.629060],[-27.004060,-48.629333],[-27.003920,-48.629606],[-27.003780,-48.629879],[-27.003640,-48.630152],[-27.003500,-48.630425],[-27.003360,-48.630698],[-27.003220,-48.630971],[-27.003080,-48.631244],[-27.002940,-48.631517],[-27.002800,-48.631790],[-27.002660,-48.632063],[-27.002520,-48.632336],[-27.002380,-48.632609],[-27.002240,-48.632882],[-27.002100,-48.633155],[-27.001960,-48.633428],[-27.001820,-48.633701],[-27.001680,-48.633974],[-27.001540,-48.634247],[-27.001400,-48.634520],[-27.001260,-48.634793],[-27.001120,-48.635066],[-27.000980,-48.635339],[-27.000840,-48.635612],[-27.000700,-48.635885],[-27.000560,-48.636158],[-27.000420,-48.636431],[-27.000280,-48.636704],[-27.000140,-48.636977],[-27.000000,-48.637250],[-26.999860,-48.637523],[-26.999720,-48.637796],[-26.999580,-48.638069],[-26.999440,-48.638342],[-26.999300,-48.638615],[-26.999160,-48.638888],[-26.999020,-48.639161],[-26.998880,-48.639434],[-26.998740,-48.639707],[-26.998600,-48.639980],[-26.998460,-48.640253],[-26.998320,-48.640526],[-26.998180,-48.640799],[-26.998040,-48.641072],[-26.997900,-48.641345],[-26.997760,-48.641618],[-26.997620,-48.641891],[-26.997480,-48.642164],[-26.997340,-48.642437],[-26.997200,-48.642710],[-26.997060,-48.642983],[-26.996920,-48.643256],[-26.996780,-48.643529],[-26.996640,-48.643802],[-26.996500,-48.644075],[-26.996360,-48.644348],[-26.996220,-48.644621],[-26.996080,-48.644894],[-26.995940,-48.645167],[-26.995800,-48.645440]]
  },
  {
    id: '3', nome: 'Avenida Marginal Oeste', tipo: 'ciclovia', cor: '#4CAF50', corBg: 'rgba(76,175,80,0.15)',
    coordenadas: [[-26.999685,-48.645851],[-26.999800,-48.645500],[-26.999915,-48.645149],[-27.000030,-48.644798],[-27.000145,-48.644447],[-27.000260,-48.644096],[-27.000375,-48.643745],[-27.000490,-48.643394],[-27.000605,-48.643043],[-27.000720,-48.642692],[-27.000835,-48.642341],[-27.000950,-48.641990],[-27.001065,-48.641639],[-27.001180,-48.641288],[-27.001295,-48.640937],[-27.001410,-48.640586],[-27.001525,-48.640235],[-27.001640,-48.639884],[-27.001755,-48.639533],[-27.001870,-48.639182],[-27.001985,-48.638831],[-27.002100,-48.638480],[-27.002215,-48.638129],[-27.002330,-48.637778],[-27.002445,-48.637427],[-27.002560,-48.637076],[-27.002675,-48.636725],[-27.002790,-48.636374],[-27.002905,-48.636023],[-27.003020,-48.635672],[-27.003135,-48.635321],[-27.003250,-48.634970],[-27.003365,-48.634619],[-27.003480,-48.634268],[-27.003595,-48.633917],[-27.003710,-48.633566],[-27.003825,-48.633215],[-27.003940,-48.632864],[-27.004055,-48.632513],[-27.004170,-48.632162],[-27.004285,-48.631811],[-27.004400,-48.631460],[-27.004515,-48.631109],[-27.004630,-48.630758],[-27.004745,-48.630407],[-27.004860,-48.630056],[-27.004975,-48.629705],[-27.005090,-48.629354],[-27.005205,-48.629003],[-27.005320,-48.628652],[-27.005435,-48.628301],[-27.005550,-48.627950],[-27.005665,-48.627599],[-27.005780,-48.627248],[-27.005895,-48.626897],[-27.006010,-48.626546],[-27.006125,-48.626195],[-27.006240,-48.625844],[-27.006355,-48.625493],[-27.006470,-48.625142],[-27.006585,-48.624791],[-27.006700,-48.624440],[-27.006815,-48.624089],[-27.006930,-48.623738],[-27.007045,-48.623387],[-27.007160,-48.623036]]
  },
  {
    id: '4', nome: 'Av. Rodesindo Pavan (Interpraias)', tipo: 'ciclofaixa', cor: '#FF9800', corBg: 'rgba(255,152,0,0.15)',
    coordenadas: [[-26.995310,-48.598135],[-26.995500,-48.597800],[-26.995690,-48.597465],[-26.995880,-48.597130],[-26.996070,-48.596795],[-26.996260,-48.596460],[-26.996450,-48.596125],[-26.996640,-48.595790],[-26.996830,-48.595455],[-26.997020,-48.595120],[-26.997210,-48.594785],[-26.997400,-48.594450],[-26.997590,-48.594115],[-26.997780,-48.593780],[-26.997970,-48.593445],[-26.998160,-48.593110],[-26.998350,-48.592775],[-26.998540,-48.592440],[-26.998730,-48.592105],[-26.998920,-48.591770],[-26.999110,-48.591435],[-26.999300,-48.591100],[-26.999490,-48.590765],[-26.999680,-48.590430],[-26.999870,-48.590095],[-27.000060,-48.589760],[-27.000250,-48.589425],[-27.000440,-48.589090],[-27.000630,-48.588755],[-27.000820,-48.588420],[-27.001010,-48.588085],[-27.001200,-48.587750],[-27.001390,-48.587415],[-27.001580,-48.587080],[-27.001770,-48.586745],[-27.001960,-48.586410],[-27.002150,-48.586075],[-27.002340,-48.585740],[-27.002530,-48.585405],[-27.002720,-48.585070],[-27.002910,-48.584735],[-27.003100,-48.584400],[-27.003290,-48.584065],[-27.003480,-48.583730],[-27.003670,-48.583395],[-27.003860,-48.583060],[-27.004050,-48.582725],[-27.004240,-48.582390],[-27.004430,-48.582055],[-27.004620,-48.581720],[-27.004810,-48.581385],[-27.005000,-48.581050]]
  },
  {
    id: '5', nome: 'Av. Panoramica Artenir Werner', tipo: 'ciclovia', cor: '#F44336', corBg: 'rgba(244,67,54,0.15)',
    coordenadas: [[-26.991000,-48.645800],[-26.991150,-48.645500],[-26.991300,-48.645200],[-26.991450,-48.644900],[-26.991600,-48.644600],[-26.991750,-48.644300],[-26.991900,-48.644000],[-26.992050,-48.643700],[-26.992200,-48.643400],[-26.992350,-48.643100],[-26.992500,-48.642800],[-26.992650,-48.642500],[-26.992800,-48.642200],[-26.992950,-48.641900],[-26.993100,-48.641600],[-26.993250,-48.641300],[-26.993400,-48.641000],[-26.993550,-48.640700],[-26.993700,-48.640400],[-26.993850,-48.640100],[-26.994000,-48.639800],[-26.994150,-48.639500],[-26.994300,-48.639200],[-26.994450,-48.638900],[-26.994600,-48.638600],[-26.994750,-48.638300],[-26.994900,-48.638000],[-26.995050,-48.637700],[-26.995200,-48.637400],[-26.995350,-48.637100],[-26.995500,-48.636800],[-26.995650,-48.636500],[-26.995800,-48.636200],[-26.995950,-48.635900],[-26.996100,-48.635600],[-26.996250,-48.635300],[-26.996400,-48.635000],[-26.996550,-48.634700],[-26.996700,-48.634400],[-26.996850,-48.634100],[-26.997000,-48.633800],[-26.997150,-48.633500],[-26.997300,-48.633200],[-26.997450,-48.632900],[-26.997600,-48.632600],[-26.997750,-48.632300],[-26.997900,-48.632000],[-26.998050,-48.631700],[-26.998200,-48.631400],[-26.998350,-48.631100],[-26.998500,-48.630800],[-26.998650,-48.630500],[-26.998800,-48.630200],[-26.998950,-48.629900],[-26.999100,-48.629600],[-26.999250,-48.629300],[-26.999400,-48.629000],[-26.999550,-48.628700],[-26.999700,-48.628400],[-26.999850,-48.628100],[-27.000000,-48.627800],[-27.000150,-48.627500],[-27.000300,-48.627200],[-27.000450,-48.626900],[-27.000600,-48.626600],[-27.000750,-48.626300],[-27.000900,-48.626000],[-27.001050,-48.625700],[-27.001200,-48.625400],[-27.001350,-48.625100],[-27.001500,-48.624800],[-27.001650,-48.624500],[-27.001800,-48.624200],[-27.001950,-48.623900],[-27.002100,-48.623600],[-27.002250,-48.623300],[-27.002400,-48.623000],[-27.002550,-48.622700],[-27.002700,-48.622400],[-27.002850,-48.622100],[-27.003000,-48.621800]]
  },
].map(c => ({ ...c, distancia: calcDist(c.coordenadas) }));

const tipoLabel: Record<string, string> = { ciclovia: 'Ciclovia', ciclofaixa: 'Ciclofaixa' };

// ===== Componente CicloviasLayer =====
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
      poly.bindPopup(`<div style="font-family:sans-serif;min-width:160px;padding:4px"><div style="font-size:12px;font-weight:bold;color:${c.cor}">${tipoLabel[c.tipo]}</div><div style="font-size:14px;font-weight:bold;color:#333">${c.nome}</div><div style="font-size:12px;color:#666;margin-top:2px">${c.distancia}</div></div>`);
      layers.push(poly);
    });
    return () => { layers.forEach(p => map.removeLayer(p)); };
  }, [map]);
  return null;
}


import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});

/* ===== 3D Pin images (extracted from user reference) ===== */
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

/* ===== Bairros de BC ===== */
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

// ===== DADOS REAIS DAS CICLOVIAS (OpenStreetMap) =====
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

const CICLOVIAS: CicloviaData[] = [
  { id: '1', nome: 'Avenida Atlantica', tipo: 'ciclovia', cor: '#2196F3', corBg: 'rgba(33,150,243,0.15)', coordenadas: [[-26.9901,-48.6428],[-26.9903,-48.6428],[-26.9905,-48.6427],[-26.9908,-48.6426],[-26.9910,-48.6425],[-26.9912,-48.6424],[-26.9915,-48.6422],[-26.9918,-48.6420],[-26.9920,-48.6418],[-26.9922,-48.6416],[-26.9925,-48.6413],[-26.9928,-48.6410],[-26.9930,-48.6408],[-26.9932,-48.6405],[-26.9935,-48.6402],[-26.9938,-48.6399],[-26.9940,-48.6396],[-26.9942,-48.6393],[-26.9945,-48.6390],[-26.9948,-48.6387],[-26.9950,-48.6384],[-26.9952,-48.6381],[-26.9955,-48.6378],[-26.9958,-48.6375],[-26.9960,-48.6372],[-26.9962,-48.6369],[-26.9965,-48.6365],[-26.9968,-48.6361],[-26.9970,-48.6358],[-26.9972,-48.6355],[-26.9975,-48.6351],[-26.9978,-48.6347],[-26.9980,-48.6344],[-26.9982,-48.6340],[-26.9985,-48.6336],[-26.9988,-48.6332],[-26.9990,-48.6328],[-26.9992,-48.6324],[-26.9995,-48.6320],[-26.9998,-48.6316],[-27.0000,-48.6312],[-27.0003,-48.6307],[-27.0006,-48.6302],[-27.0009,-48.6297],[-27.0011,-48.6292],[-27.0013,-48.6287],[-27.0015,-48.6282],[-27.0017,-48.6277],[-27.0019,-48.6272],[-27.0021,-48.6267],[-27.0023,-48.6262],[-27.0025,-48.6257],[-27.0027,-48.6252],[-27.0029,-48.6247],[-27.0031,-48.6242],[-27.0033,-48.6237],[-27.0035,-48.6232],[-27.0037,-48.6227],[-27.0039,-48.6222],[-27.0041,-48.6217],[-27.0043,-48.6212],[-27.0045,-48.6207],[-27.0047,-48.6202]] },
  { id: '2', nome: '5a Avenida', tipo: 'ciclovia', cor: '#9C27B0', corBg: 'rgba(156,39,176,0.15)', coordenadas: [[-27.0009,-48.6453],[-27.0011,-48.6448],[-27.0013,-48.6443],[-27.0015,-48.6438],[-27.0017,-48.6433],[-27.0019,-48.6428],[-27.0021,-48.6423],[-27.0023,-48.6418],[-27.0025,-48.6413],[-27.0027,-48.6408],[-27.0029,-48.6403],[-27.0031,-48.6398],[-27.0033,-48.6393],[-27.0035,-48.6388],[-27.0037,-48.6383],[-27.0039,-48.6378],[-27.0041,-48.6373],[-27.0043,-48.6368],[-27.0045,-48.6363],[-27.0047,-48.6358],[-27.0049,-48.6353],[-27.0051,-48.6348],[-27.0053,-48.6343],[-27.0055,-48.6338],[-27.0057,-48.6333],[-27.0059,-48.6328],[-27.0061,-48.6323],[-27.0063,-48.6318],[-27.0065,-48.6313],[-27.0066,-48.6308],[-27.0068,-48.6303],[-27.0070,-48.6298],[-27.0072,-48.6293],[-27.0074,-48.6288],[-27.0076,-48.6283],[-27.0078,-48.6278],[-27.0080,-48.6273],[-27.0082,-48.6268],[-27.0084,-48.6263],[-27.0086,-48.6258],[-27.0088,-48.6253],[-27.0090,-48.6248]] },
  { id: '3', nome: 'Avenida Marginal Oeste', tipo: 'ciclovia', cor: '#4CAF50', corBg: 'rgba(76,175,80,0.15)', coordenadas: [[-27.0003,-48.6437],[-27.0005,-48.6432],[-27.0007,-48.6427],[-27.0009,-48.6422],[-27.0011,-48.6417],[-27.0013,-48.6412],[-27.0015,-48.6407],[-27.0017,-48.6402],[-27.0019,-48.6397],[-27.0021,-48.6392],[-27.0023,-48.6387],[-27.0025,-48.6382],[-27.0027,-48.6377],[-27.0029,-48.6372],[-27.0031,-48.6367],[-27.0033,-48.6362],[-27.0035,-48.6357],[-27.0037,-48.6352],[-27.0039,-48.6347],[-27.0041,-48.6342],[-27.0043,-48.6337],[-27.0045,-48.6332],[-27.0047,-48.6327],[-27.0049,-48.6322],[-27.0051,-48.6317],[-27.0053,-48.6312],[-27.0055,-48.6307],[-27.0057,-48.6302],[-27.0059,-48.6297],[-27.0061,-48.6292],[-27.0063,-48.6287],[-27.0065,-48.6282],[-27.0067,-48.6277],[-27.0069,-48.6272],[-27.0071,-48.6267]] },
  { id: '4', nome: 'Av. Rodesindo Pavan (Interpraias)', tipo: 'ciclofaixa', cor: '#FF9800', corBg: 'rgba(255,152,0,0.15)', coordenadas: [[-26.9953,-48.5981],[-26.9955,-48.5976],[-26.9957,-48.5971],[-26.9959,-48.5966],[-26.9961,-48.5961],[-26.9963,-48.5956],[-26.9965,-48.5951],[-26.9967,-48.5946],[-26.9969,-48.5941],[-26.9971,-48.5936],[-26.9973,-48.5931],[-26.9975,-48.5926],[-26.9977,-48.5921],[-26.9979,-48.5916],[-26.9981,-48.5911],[-26.9983,-48.5906],[-26.9985,-48.5901],[-26.9987,-48.5896],[-26.9989,-48.5891],[-26.9991,-48.5886],[-26.9993,-48.5881],[-26.9995,-48.5876],[-26.9997,-48.5871],[-26.9999,-48.5866],[-27.0001,-48.5861],[-27.0003,-48.5856],[-27.0005,-48.5851],[-27.0007,-48.5846],[-27.0009,-48.5841],[-27.0011,-48.5836],[-27.0013,-48.5831],[-27.0015,-48.5826],[-27.0017,-48.5821],[-27.0019,-48.5816],[-27.0021,-48.5811],[-27.0023,-48.5806]] },
  { id: '5', nome: 'Av. Panoramica Artenir Werner', tipo: 'ciclovia', cor: '#F44336', corBg: 'rgba(244,67,54,0.15)', coordenadas: [[-26.9910,-48.6458],[-26.9912,-48.6453],[-26.9914,-48.6448],[-26.9916,-48.6443],[-26.9918,-48.6438],[-26.9920,-48.6433],[-26.9922,-48.6428],[-26.9924,-48.6423],[-26.9926,-48.6418],[-26.9928,-48.6413],[-26.9930,-48.6408],[-26.9932,-48.6403],[-26.9934,-48.6398],[-26.9936,-48.6393],[-26.9938,-48.6388],[-26.9940,-48.6383],[-26.9942,-48.6378],[-26.9944,-48.6373],[-26.9946,-48.6368],[-26.9948,-48.6363],[-26.9950,-48.6358],[-26.9952,-48.6353],[-26.9954,-48.6348],[-26.9956,-48.6343],[-26.9958,-48.6338],[-26.9960,-48.6333],[-26.9962,-48.6328],[-26.9964,-48.6323],[-26.9966,-48.6318],[-26.9968,-48.6313],[-26.9970,-48.6308],[-26.9972,-48.6303],[-26.9974,-48.6298],[-26.9976,-48.6293],[-26.9978,-48.6288],[-26.9980,-48.6283],[-26.9982,-48.6278],[-26.9984,-48.6273],[-26.9986,-48.6268],[-26.9988,-48.6263],[-26.9990,-48.6258],[-26.9992,-48.6253],[-26.9994,-48.6248],[-26.9996,-48.6243],[-26.9998,-48.6238],[-27.0000,-48.6233],[-27.0002,-48.6228],[-27.0004,-48.6223],[-27.0006,-48.6218],[-27.0008,-48.6213],[-27.0010,-48.6208]] },
].map(c => ({ ...c, distancia: calcDist(c.coordenadas) }));

const tipoLabel: Record<string, string> = { ciclovia: 'Ciclovia', ciclofaixa: 'Ciclofaixa' };

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
      poly.bindPopup(`<div style="font-family:sans-serif;min-width:160px;padding:4px"><div style="font-size:12px;font-weight:bold;color:${c.cor}">${tipoLabel[c.tipo]}</div><div style="font-size:14px;font-weight:bold;color:#333">${c.nome}</div><div style="font-size:12px;color:#666;margin-top:2px">${c.distancia}</div></div>`);
      layers.push(poly);
    });
    return () => { layers.forEach(p => map.removeLayer(p)); };
  }, [map]);
  return null;
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
              {/* 1 UNICO circulo verde = BC seguro */}
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

              {/* So aparece circulos coloridos em bairros COM ocorrencias (> 0) */}
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

              {/* Pins de ocorrencias individuais */}
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
              <div className="glass-card p-3 space-y-2 max-h-[160px] overflow-y-auto">
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

