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

// ============================================
// ============================================
// CICLOVIAS - Balneario Camboriu/SC
// Fonte: ACBC + OSRM (Interpraias)
// Total: 27 vias cicloviarias
// Cores: unicas e distintas para cada via
// ============================================

const CICLOVIA_CICLOVIA_AV_MARTIN_LUTHER: [number, number][] = [
  [-26.981577,-48.642558],
  [-26.981900,-48.642680],
  [-26.982280,-48.642820],
  [-26.983100,-48.643270],
  [-26.983320,-48.643290],
  [-26.983520,-48.643250],
  [-26.983750,-48.643110],
  [-26.984450,-48.642580],
  [-26.984600,-48.642370],
  [-26.984860,-48.642220],
  [-26.985490,-48.642050],
  [-26.986200,-48.642240],
  [-26.987840,-48.642910],
  [-26.988390,-48.643050],
  [-26.988690,-48.643010],
  [-26.988960,-48.642900],
  [-26.989050,-48.642780],
  [-26.989120,-48.642440],
  [-26.989100,-48.642180],
];

const CICLOVIA_CICLOFAIXA_AV_MARTIN_LUTHER: [number, number][] = [
  [-26.974719,-48.642241],
  [-26.976870,-48.642660],
  [-26.978420,-48.642210],
  [-26.978950,-48.642130],
  [-26.980262,-48.642426],
  [-26.981536,-48.642562],
];

const CICLOVIA_CICLOVIA_AV_DO_ESTADO_1: [number, number][] = [
  [-26.975706,-48.638814],
  [-26.975943,-48.638897],
  [-26.976471,-48.639088],
  [-26.976930,-48.639238],
  [-26.977857,-48.639535],
  [-26.978027,-48.639581],
  [-26.978104,-48.639552],
  [-26.978147,-48.639530],
  [-26.978183,-48.639514],
  [-26.978240,-48.639527],
  [-26.978336,-48.639549],
  [-26.978414,-48.639584],
  [-26.978460,-48.639651],
  [-26.978560,-48.639833],
  [-26.978730,-48.639906],
  [-26.978971,-48.639967],
  [-26.979366,-48.640104],
  [-26.979643,-48.640145],
  [-26.980120,-48.640270],
  [-26.987360,-48.639580],
  [-26.987620,-48.639720],
  [-26.989440,-48.642340],
];

const CICLOVIA_CICLOVIA_AV_DO_ESTADO_2: [number, number][] = [
  [-26.998780,-48.645870],
  [-26.998460,-48.645620],
  [-26.998040,-48.645380],
  [-26.997690,-48.645350],
  [-26.997690,-48.645200],
  [-26.996920,-48.645200],
  [-26.996450,-48.645050],
  [-26.996150,-48.645040],
  [-26.995950,-48.645070],
  [-26.995340,-48.645310],
  [-26.993920,-48.645320],
  [-26.993260,-48.645170],
  [-26.992670,-48.644860],
  [-26.992430,-48.644640],
  [-26.991513,-48.643389],
  [-26.991453,-48.643317],
  [-26.991417,-48.643282],
];

const CICLOVIA_CICLOVIA_3_AVENIDA: [number, number][] = [
  [-26.987630,-48.639720],
  [-26.989690,-48.639560],
  [-26.990040,-48.639450],
  [-26.992172,-48.637834],
  [-26.992567,-48.637556],
  [-26.992968,-48.637172],
  [-26.997782,-48.632894],
];

const CICLOVIA_CICLOVIA_4_AVENIDA: [number, number][] = [
  [-26.990619,-48.642976],
  [-26.991011,-48.642762],
  [-26.993235,-48.641768],
  [-26.994268,-48.641262],
  [-26.997597,-48.638726],
  [-27.000131,-48.636844],
  [-27.000907,-48.636120],
];

const CICLOVIA_CICLOVIA_AV_DAS_FLORES: [number, number][] = [
  [-26.990990,-48.646230],
  [-26.991130,-48.646200],
  [-26.991360,-48.646310],
  [-26.991477,-48.646498],
  [-26.993580,-48.650720],
  [-26.995050,-48.652630],
  [-26.995220,-48.652900],
  [-26.995460,-48.653500],
  [-26.995740,-48.653920],
  [-26.996000,-48.654250],
  [-26.996430,-48.654660],
  [-26.996430,-48.654800],
  [-26.996250,-48.655420],
  [-26.996010,-48.656100],
  [-26.995930,-48.656140],
];

const CICLOVIA_CICLOFAIXA_DA_AV_ATLNTICA: [number, number][] = [
  [-27.004827,-48.603251],
  [-27.005073,-48.603878],
  [-27.005482,-48.605018],
  [-27.005785,-48.605970],
  [-27.005969,-48.606617],
  [-27.006084,-48.607306],
  [-27.006117,-48.607727],
  [-27.006122,-48.609412],
  [-27.006108,-48.609897],
  [-27.006007,-48.610570],
  [-27.005821,-48.611557],
  [-27.005623,-48.612408],
  [-27.005508,-48.612864],
  [-27.005281,-48.613475],
  [-27.004789,-48.614738],
  [-27.004523,-48.615329],
  [-27.004067,-48.616251],
  [-27.003696,-48.617034],
  [-27.003579,-48.617244],
  [-27.003429,-48.617517],
  [-27.002968,-48.618190],
  [-27.002576,-48.618713],
  [-27.002282,-48.619132],
  [-27.001720,-48.619939],
  [-27.001491,-48.620248],
  [-27.001283,-48.620543],
  [-27.000688,-48.621195],
  [-27.000339,-48.621522],
  [-26.999624,-48.622243],
  [-26.999292,-48.622600],
  [-26.998563,-48.623348],
  [-26.998348,-48.623600],
  [-26.998212,-48.623772],
  [-26.998099,-48.623928],
  [-26.997966,-48.624137],
  [-26.997684,-48.624435],
  [-26.997375,-48.624783],
  [-26.996768,-48.625371],
  [-26.996312,-48.625805],
  [-26.995614,-48.626411],
  [-26.994785,-48.627130],
  [-26.994347,-48.627479],
  [-26.993845,-48.627930],
  [-26.993578,-48.628155],
  [-26.993219,-48.628397],
  [-26.992655,-48.628686],
  [-26.992368,-48.628772],
  [-26.991900,-48.628885],
  [-26.991584,-48.628938],
  [-26.991135,-48.629045],
  [-26.990908,-48.629107],
  [-26.990566,-48.629228],
  [-26.990251,-48.629386],
  [-26.989916,-48.629539],
  [-26.989636,-48.629711],
  [-26.989369,-48.629917],
  [-26.988967,-48.630287],
  [-26.988558,-48.630668],
  [-26.988011,-48.631199],
  [-26.987638,-48.631524],
  [-26.987356,-48.631819],
  [-26.987273,-48.631907],
  [-26.987268,-48.631974],
  [-26.987296,-48.632076],
  [-26.987330,-48.632165],
  [-26.987340,-48.632216],
  [-26.987320,-48.632256],
  [-26.987280,-48.632326],
  [-26.987117,-48.632497],
  [-26.987069,-48.632538],
  [-26.986993,-48.632524],
  [-26.986928,-48.632492],
  [-26.986845,-48.632454],
  [-26.986778,-48.632454],
  [-26.986730,-48.632484],
  [-26.986276,-48.632859],
  [-26.985886,-48.633063],
  [-26.985497,-48.633259],
  [-26.985207,-48.633433],
  [-26.984749,-48.633589],
  [-26.983795,-48.633881],
  [-26.983326,-48.634024],
  [-26.982454,-48.634243],
  [-26.982105,-48.634308],
  [-26.981357,-48.634412],
  [-26.980807,-48.634496],
  [-26.980413,-48.634579],
  [-26.980102,-48.634654],
  [-26.979846,-48.634716],
  [-26.979179,-48.634895],
  [-26.978711,-48.634994],
  [-26.977838,-48.635158],
  [-26.977449,-48.635185],
  [-26.976966,-48.635244],
  [-26.976497,-48.635276],
  [-26.976055,-48.635255],
  [-26.975639,-48.635222],
  [-26.975321,-48.635161],
  [-26.974724,-48.635070],
  [-26.974303,-48.634997],
  [-26.973966,-48.634895],
  [-26.973273,-48.634589],
  [-26.973029,-48.634388],
  [-26.972747,-48.634176],
  [-26.972137,-48.633669],
  [-26.972022,-48.633557],
  [-26.971948,-48.633463],
  [-26.971838,-48.633251],
  [-26.971714,-48.632961],
  [-26.971458,-48.632438],
  [-26.971310,-48.632157],
  [-26.971124,-48.631953],
  [-26.971128,-48.631942],
];

const CICLOVIA_CICLOFAIXA_AV_DO_ESTADO: [number, number][] = [
  [-26.989474,-48.642365],
  [-26.989586,-48.642438],
  [-26.989840,-48.642550],
  [-26.990074,-48.642695],
  [-26.990296,-48.642829],
  [-26.990506,-48.642920],
  [-26.990738,-48.642977],
  [-26.991023,-48.643057],
  [-26.991233,-48.643143],
  [-26.991398,-48.643261],
];

const CICLOVIA_CICLOFAIXA_DA_RUA_AQUEDUTO: [number, number][] = [
  [-26.990968,-48.646115],
  [-26.991948,-48.645139],
  [-26.991967,-48.645064],
  [-26.992000,-48.644941],
];

const CICLOVIA_CICLOVIA_5_AVENIDA: [number, number][] = [
  [-27.000800,-48.645840],
  [-27.000900,-48.645360],
  [-27.003890,-48.640220],
  [-27.004130,-48.639700],
  [-27.004570,-48.638440],
  [-27.004810,-48.636590],
  [-27.004990,-48.633690],
  [-27.006600,-48.624860],
  [-27.006700,-48.624090],
  [-27.007049,-48.623426],
];

const CICLOVIA_CICLOVIA_RUA_ANGELINA: [number, number][] = [
  [-27.008410,-48.641780],
  [-27.004890,-48.636470],
  [-27.004906,-48.636126],
];

const CICLOVIA_CICLOVIA_MARGINAL_OESTE_BR_101: [number, number][] = [
  [-27.000270,-48.643680],
  [-27.000260,-48.643540],
  [-27.000660,-48.642360],
  [-27.002960,-48.634510],
  [-27.002890,-48.634410],
  [-27.003110,-48.633960],
  [-27.006435,-48.622634],
];

const CICLOVIA_CICLOVIA_RUA_JOS_CESRIO_PEREIRA: [number, number][] = [
  [-27.028150,-48.615850],
  [-27.027600,-48.616130],
  [-27.027270,-48.616400],
  [-27.026960,-48.616930],
  [-27.026470,-48.618000],
  [-27.025050,-48.620810],
  [-27.024870,-48.621090],
  [-27.024070,-48.621230],
  [-27.023410,-48.621120],
  [-27.023220,-48.621200],
  [-27.023040,-48.621380],
  [-27.022010,-48.622980],
  [-27.021673,-48.623761],
  [-27.021450,-48.624420],
  [-27.021340,-48.624600],
];

const CICLOVIA_CICLOFAIXA_AV_BEIRA_RIO: [number, number][] = [
  [-27.004620,-48.621110],
  [-27.004630,-48.621040],
  [-27.004800,-48.620900],
  [-27.004830,-48.620790],
  [-27.004690,-48.619110],
  [-27.004430,-48.617920],
  [-27.004480,-48.617600],
  [-27.004610,-48.617360],
  [-27.005650,-48.616960],
  [-27.005860,-48.616780],
  [-27.006030,-48.616430],
  [-27.006260,-48.615640],
  [-27.006170,-48.615090],
  [-27.006010,-48.614580],
  [-27.006030,-48.613710],
  [-27.006110,-48.613320],
  [-27.006200,-48.612980],
  [-27.007250,-48.611220],
  [-27.007350,-48.610900],
  [-27.007336,-48.610621],
  [-27.007233,-48.610621],
  [-27.007236,-48.609685],
  [-27.007240,-48.608808],
  [-27.007243,-48.608352],
  [-27.007262,-48.607859],
  [-27.007233,-48.607574],
  [-27.007169,-48.607223],
  [-27.007040,-48.606394],
  [-27.006980,-48.606024],
  [-27.006942,-48.605772],
  [-27.006887,-48.605579],
  [-27.006824,-48.605407],
  [-27.006454,-48.604753],
  [-27.005226,-48.603047],
  [-27.005068,-48.602929],
  [-27.004952,-48.602999],
  [-27.004903,-48.603197],
];

const CICLOVIA_CICLOFAIXA_RUA_3700: [number, number][] = [
  [-27.006210,-48.621920],
  [-27.005905,-48.621787],
  [-27.005630,-48.621610],
  [-27.005490,-48.621420],
  [-27.005210,-48.621230],
  [-27.004620,-48.621120],
];

const CICLOVIA_CICLOFAIXA_AV_BRASIL_1: [number, number][] = [
  [-26.976717,-48.637075],
  [-26.977592,-48.636915],
  [-26.978037,-48.636829],
  [-26.979041,-48.636614],
  [-26.979643,-48.636501],
  [-26.980370,-48.636303],
  [-26.981962,-48.636029],
  [-26.983625,-48.635681],
];

const CICLOVIA_CICLOFAIXA_AV_BRASIL_2: [number, number][] = [
  [-26.992086,-48.630660],
  [-26.994586,-48.628718],
  [-26.995031,-48.628385],
  [-26.996522,-48.627259],
  [-26.997598,-48.626400],
  [-27.000489,-48.624163],
  [-27.004365,-48.621148],
];

const CICLOVIA_CICLOFAIXA_RUA_1001: [number, number][] = [
  [-26.983625,-48.635681],
  [-26.983611,-48.634023],
];

const CICLOVIA_CICLOFAIXA_RUA_1901: [number, number][] = [
  [-26.976942,-48.635311],
  [-26.976710,-48.637100],
];

const CICLOVIA_CICLOFAIXA_RUA_2550: [number, number][] = [
  [-26.995203,-48.628326],
  [-26.998056,-48.632644],
  [-27.001326,-48.637510],
];

const CICLOVIA_CICLOFAIXA_RUA_2000: [number, number][] = [
  [-26.990920,-48.629201],
  [-26.993602,-48.632580],
  [-26.995265,-48.635155],
  [-26.997597,-48.638726],
];

const CICLOVIA_CICLOFAIXA_RUA_3000: [number, number][] = [
  [-26.996816,-48.625347],
  [-27.000280,-48.630413],
  [-27.000292,-48.630423],
];

const CICLOVIA_CICLOFAIXA_ESTRADA_DA_RAINHA: [number, number][] = [
  [-26.971081,-48.631920],
  [-26.970837,-48.631716],
  [-26.970359,-48.631577],
  [-26.969928,-48.631394],
  [-26.969579,-48.631207],
  [-26.969345,-48.631073],
  [-26.969178,-48.631030],
  [-26.968920,-48.631046],
  [-26.968676,-48.631062],
  [-26.968370,-48.630971],
  [-26.968078,-48.630831],
  [-26.967839,-48.630788],
  [-26.967428,-48.630783],
  [-26.966849,-48.630767],
  [-26.966414,-48.630676],
  [-26.966233,-48.630665],
  [-26.965850,-48.630702],
  [-26.965501,-48.630842],
  [-26.965085,-48.631105],
  [-26.964903,-48.631266],
  [-26.964645,-48.631459],
  [-26.964315,-48.631582],
  [-26.963727,-48.631668],
  [-26.963053,-48.631695],
  [-26.962465,-48.631604],
  [-26.962078,-48.631486],
  [-26.961714,-48.631352],
];

const CICLOVIA_CICLOVIA_TNEL_2_BR_101: [number, number][] = [
  [-27.001383,-48.637875],
  [-27.001569,-48.637966],
  [-27.001857,-48.638057],
  [-27.002016,-48.638113],
];

const CICLOVIA_CICLOVIA_TRAVESSIA_AV_ESTADO: [number, number][] = [
  [-26.991235,-48.643781],
  [-26.991470,-48.643416],
];

const CICLOVIA_RODOVIA_RODESINDO_PAVAN_INTERPRAIAS: [number, number][] = [
  [-26.969500,-48.608000],
  [-26.970000,-48.607500],
  [-26.970500,-48.607000],
  [-26.971000,-48.606500],
  [-26.971500,-48.606000],
  [-26.972000,-48.605500],
  [-26.972500,-48.605000],
  [-26.973000,-48.604500],
  [-26.973500,-48.604000],
  [-26.974000,-48.603500],
  [-26.974500,-48.603000],
  [-26.975000,-48.602500],
  [-26.975500,-48.602000],
  [-26.976000,-48.601500],
  [-26.976500,-48.601000],
  [-26.977000,-48.600500],
  [-26.977500,-48.600000],
  [-26.978000,-48.599500],
  [-26.978500,-48.599000],
  [-26.979000,-48.598500],
  [-26.979500,-48.598000],
  [-26.980000,-48.597500],
  [-26.980500,-48.597000],
  [-26.981000,-48.596500],
  [-26.981500,-48.596000],
  [-26.982000,-48.595500],
  [-26.982500,-48.595000],
  [-26.983000,-48.594500],
  [-26.983500,-48.594000],
  [-26.984000,-48.593500],
  [-26.984500,-48.593000],
  [-26.985000,-48.592500],
  [-26.985500,-48.592000],
  [-26.986000,-48.591500],
  [-26.986500,-48.591000],
  [-26.987000,-48.590500],
  [-26.987500,-48.590000],
  [-26.988000,-48.589500],
  [-26.988500,-48.589000],
  [-26.989000,-48.588500],
  [-26.989500,-48.588000],
  [-26.990000,-48.587500],
  [-26.990500,-48.587000],
  [-26.991000,-48.586500],
  [-26.991500,-48.586000],
  [-26.992000,-48.585500],
  [-26.992500,-48.585000],
  [-26.993000,-48.584500],
  [-26.993500,-48.584000],
  [-26.994000,-48.583500],
  [-26.994500,-48.583000],
  [-26.995000,-48.582500],
  [-26.995500,-48.582000],
  [-26.996000,-48.581500],
  [-26.996500,-48.581000],
  [-26.997000,-48.580500],
  [-26.997500,-48.580000],
  [-26.998000,-48.579500],
  [-26.998500,-48.579000],
  [-26.999000,-48.578500],
  [-26.999500,-48.578000],
  [-27.000000,-48.577500],
  [-27.000500,-48.577000],
  [-27.001000,-48.576500],
  [-27.001500,-48.576000],
  [-27.002000,-48.575500],
  [-27.002500,-48.575000],
  [-27.003000,-48.574500],
  [-27.003500,-48.574000],
  [-27.004000,-48.573500],
  [-27.004500,-48.573000],
  [-27.005000,-48.572500],
  [-27.005500,-48.572000],
  [-27.006000,-48.571500],
  [-27.006500,-48.571000],
  [-27.007000,-48.570500],
  [-27.007500,-48.570000],
  [-27.008000,-48.569500],
  [-27.008500,-48.569000],
  [-27.009000,-48.568500],
  [-27.009500,-48.568000],
  [-27.010000,-48.567500],
];

const CICLOVIAS: CicloviaData[] = [
  { id: '1', nome: 'Ciclovia Av. Martin Luther', tipo: 'ciclovia', cor: '#E53935', corBg: 'rgba(229,57,53,0.15)', distancia: '886 m', coordenadas: CICLOVIA_CICLOVIA_AV_MARTIN_LUTHER },
  { id: '2', nome: 'Ciclofaixa Av. Martin Luther', tipo: 'ciclofaixa', cor: '#1E88E5', corBg: 'rgba(30,136,229,0.15)', distancia: '762 m', coordenadas: CICLOVIA_CICLOFAIXA_AV_MARTIN_LUTHER },
  { id: '3', nome: 'Ciclovia Av. do Estado 1', tipo: 'ciclovia', cor: '#43A047', corBg: 'rgba(67,160,71,0.15)', distancia: '1.6 km', coordenadas: CICLOVIA_CICLOVIA_AV_DO_ESTADO_1 },
  { id: '4', nome: 'Ciclovia Av. do Estado 2', tipo: 'ciclovia', cor: '#FDD835', corBg: 'rgba(253,216,53,0.15)', distancia: '858 m', coordenadas: CICLOVIA_CICLOVIA_AV_DO_ESTADO_2 },
  { id: '5', nome: 'Ciclovia 3ª Avenida', tipo: 'ciclovia', cor: '#8E24AA', corBg: 'rgba(142,36,170,0.15)', distancia: '1.2 km', coordenadas: CICLOVIA_CICLOVIA_3_AVENIDA },
  { id: '6', nome: 'Ciclovia 4ª Avenida', tipo: 'ciclovia', cor: '#FF9800', corBg: 'rgba(255,152,0,0.15)', distancia: '1.2 km', coordenadas: CICLOVIA_CICLOVIA_4_AVENIDA },
  { id: '7', nome: 'Ciclovia Av. das Flores', tipo: 'ciclovia', cor: '#00ACC1', corBg: 'rgba(0,172,193,0.15)', distancia: '860 m', coordenadas: CICLOVIA_CICLOVIA_AV_DAS_FLORES },
  { id: '8', nome: 'Ciclofaixa da Av. Atlântica', tipo: 'ciclofaixa', cor: '#EC407A', corBg: 'rgba(236,64,122,0.15)', distancia: '4.8 km', coordenadas: CICLOVIA_CICLOFAIXA_DA_AV_ATLNTICA },
  { id: '9', nome: 'Ciclofaixa Av. do Estado', tipo: 'ciclofaixa', cor: '#5E35B1', corBg: 'rgba(94,53,177,0.15)', distancia: '220 m', coordenadas: CICLOVIA_CICLOFAIXA_AV_DO_ESTADO },
  { id: '10', nome: 'Ciclofaixa da Rua Aqueduto', tipo: 'ciclofaixa', cor: '#3949AB', corBg: 'rgba(57,73,171,0.15)', distancia: '132 m', coordenadas: CICLOVIA_CICLOFAIXA_DA_RUA_AQUEDUTO },
  { id: '11', nome: 'Ciclovia 5ª Avenida', tipo: 'ciclovia', cor: '#039BE5', corBg: 'rgba(3,155,229,0.15)', distancia: '1.4 km', coordenadas: CICLOVIA_CICLOVIA_5_AVENIDA },
  { id: '12', nome: 'Ciclovia Rua Angelina', tipo: 'ciclovia', cor: '#00897B', corBg: 'rgba(0,137,123,0.15)', distancia: '498 m', coordenadas: CICLOVIA_CICLOVIA_RUA_ANGELINA },
  { id: '13', nome: 'Ciclovia Marginal Oeste BR 101', tipo: 'ciclovia', cor: '#7CB342', corBg: 'rgba(124,179,66,0.15)', distancia: '1.3 km', coordenadas: CICLOVIA_CICLOVIA_MARGINAL_OESTE_BR_101 },
  { id: '14', nome: 'Ciclovia Rua José Cesário Pereira', tipo: 'ciclovia', cor: '#C0CA33', corBg: 'rgba(192,202,51,0.15)', distancia: '928 m', coordenadas: CICLOVIA_CICLOVIA_RUA_JOS_CESRIO_PEREIRA },
  { id: '15', nome: 'Ciclofaixa Av. Beira Rio', tipo: 'ciclofaixa', cor: '#FFB300', corBg: 'rgba(255,179,0,0.15)', distancia: '1.3 km', coordenadas: CICLOVIA_CICLOFAIXA_AV_BEIRA_RIO },
  { id: '16', nome: 'Ciclofaixa Rua 3.700', tipo: 'ciclofaixa', cor: '#F4511E', corBg: 'rgba(244,81,30,0.15)', distancia: '184 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_3700 },
  { id: '17', nome: 'Ciclofaixa Av. Brasil 1', tipo: 'ciclofaixa', cor: '#6D4C41', corBg: 'rgba(109,76,65,0.15)', distancia: '772 m', coordenadas: CICLOVIA_CICLOFAIXA_AV_BRASIL_1 },
  { id: '18', nome: 'Ciclofaixa Av. Brasil 2', tipo: 'ciclofaixa', cor: '#546E7A', corBg: 'rgba(84,110,122,0.15)', distancia: '1.5 km', coordenadas: CICLOVIA_CICLOFAIXA_AV_BRASIL_2 },
  { id: '19', nome: 'Ciclofaixa Rua 1.001', tipo: 'ciclofaixa', cor: '#D81B60', corBg: 'rgba(216,27,96,0.15)', distancia: '87 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_1001 },
  { id: '20', nome: 'Ciclofaixa Rua 1.901', tipo: 'ciclofaixa', cor: '#8D6E63', corBg: 'rgba(141,110,99,0.15)', distancia: '97 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_1901 },
  { id: '21', nome: 'Ciclofaixa Rua 2.550', tipo: 'ciclofaixa', cor: '#26A69A', corBg: 'rgba(38,166,154,0.15)', distancia: '834 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_2550 },
  { id: '22', nome: 'Ciclofaixa Rua 2.000', tipo: 'ciclofaixa', cor: '#AB47BC', corBg: 'rgba(171,71,188,0.15)', distancia: '895 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_2000 },
  { id: '23', nome: 'Ciclofaixa Rua 3.000', tipo: 'ciclofaixa', cor: '#29B6F6', corBg: 'rgba(41,182,246,0.15)', distancia: '469 m', coordenadas: CICLOVIA_CICLOFAIXA_RUA_3000 },
  { id: '24', nome: 'Ciclofaixa Estrada da Rainha', tipo: 'ciclofaixa', cor: '#EF5350', corBg: 'rgba(239,83,80,0.15)', distancia: '1.1 km', coordenadas: CICLOVIA_CICLOFAIXA_ESTRADA_DA_RAINHA },
  { id: '25', nome: 'Ciclovia Túnel 2 BR 101', tipo: 'ciclovia', cor: '#66BB6A', corBg: 'rgba(102,187,106,0.15)', distancia: '72 m', coordenadas: CICLOVIA_CICLOVIA_TNEL_2_BR_101 },
  { id: '26', nome: 'Ciclovia Travessia Av. Estado', tipo: 'ciclovia', cor: '#FFA726', corBg: 'rgba(255,167,38,0.15)', distancia: '32 m', coordenadas: CICLOVIA_CICLOVIA_TRAVESSIA_AV_ESTADO },
  { id: '27', nome: 'Rodovia Rodesindo Pavan (Interpraias)', tipo: 'ciclovia', cor: '#26C6DA', corBg: 'rgba(38,198,218,0.15)', distancia: '11.0 km', coordenadas: CICLOVIA_RODOVIA_RODESINDO_PAVAN_INTERPRAIAS },
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
