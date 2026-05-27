import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Printer, Plus, Hash, CheckCircle, Package,
  AlertTriangle, Download, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = '/bike-segura-bc-backend/api';

interface QRItem {
  _id: string;
  stickerNumber: string;
  hash: string;
  status: 'disponivel' | 'vinculado' | 'inativo';
  lote: string;
  vinculadoAt?: string;
  scanCount: number;
}

export default function AdminAdesivos() {
  const [items, setItems] = useState<QRItem[]>([]);
  const [stats, setStats] = useState({ total: 0, disponiveis: 0, vinculados: 0 });
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [geradoMsg, setGeradoMsg] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'disponivel' | 'vinculado'>('todos');
  const [proximos, setProximos] = useState<string[]>([]);

  const token = localStorage.getItem('token') || '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusParam = filtro !== 'todos' ? `&status=${filtro}` : '';
      const res = await fetch(`${API_BASE}/preprinted?limit=100${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats({ total: data.total, disponiveis: data.disponiveis, vinculados: data.vinculados });
      }
    } catch {}
    setLoading(false);
  };

  const fetchProximos = async () => {
    try {
      const res = await fetch(`${API_BASE}/preprinted/proximos-disponiveis?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProximos(data.proximos);
      }
    } catch {}
  };

  useEffect(() => { fetchData(); fetchProximos(); }, [filtro]);

  const gerarLote = async () => {
    setGerando(true);
    try {
      const res = await fetch(`${API_BASE}/preprinted/gerar-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantidade: 100, prefixo: 'BSBC' })
      });
      if (res.ok) {
        const data = await res.json();
        setGeradoMsg(`${data.quantidade} adesivos gerados: ${data.de} ate ${data.ate}`);
        fetchData();
        fetchProximos();
      }
    } catch {}
    setGerando(false);
  };

  const imprimirPagina = () => window.print();

  const itemsFiltrados = filtro === 'todos' ? items : items.filter(i => i.status === filtro);

  return (
    <div className="min-h-screen bg-[#0c1222] relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-4xl mx-auto px-4 md:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Adesivos QR Code</h1>
            <p className="text-xs text-slate-400">Gerenciamento de adesivos pre-impressos</p>
          </div>
        </motion.header>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2 mb-5">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-500 text-[10px]">Total</p>
          </div>
          <div className="glass-card p-3 text-center border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-400">{stats.disponiveis}</p>
            <p className="text-slate-500 text-[10px]">Disponiveis</p>
          </div>
          <div className="glass-card p-3 text-center border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">{stats.vinculados}</p>
            <p className="text-slate-500 text-[10px]">Vinculados</p>
          </div>
        </motion.div>

        {/* Proximos disponiveis */}
        {proximos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              <h3 className="text-amber-400 font-bold text-xs tracking-wider">PROXIMOS ADESIVOS PARA INSTALACAO</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {proximos.map(n => (
                <span key={n} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">{n}</span>
              ))}
            </div>
          </motion.div>
        )}

        {stats.disponiveis < 10 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border border-red-500/30 p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-bold text-sm">Estoque baixo!</p>
              <p className="text-slate-400 text-xs">Apenas {stats.disponiveis} adesivos disponiveis. Gere um novo lote.</p>
            </div>
          </motion.div>
        )}

        {/* Acoes */}
        <div className="flex gap-2 mb-5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={gerarLote}
            disabled={gerando}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0c1222]" />
            <span className="text-[#0c1222] font-bold text-xs">GERAR LOTE (+100)</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={imprimirPagina}
            className="flex-1 py-3 rounded-xl glass-card border border-white/10 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.06] transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-xs">IMPRIMIR</span>
          </motion.button>
        </div>

        {geradoMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card bg-emerald-500/10 border border-emerald-500/20 p-3 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-xs">{geradoMsg}</p>
          </motion.div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {(['todos', 'disponivel', 'vinculado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filtro === f
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'
                  : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              {f === 'todos' ? 'TODOS' : f === 'disponivel' ? 'DISPONIVEIS' : 'VINCULADOS'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-slate-500 text-center text-sm py-8">Carregando...</p>
        ) : itemsFiltrados.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum adesivo encontrado</p>
            <p className="text-slate-600 text-xs mt-1">Gere um lote para comecar</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
            {itemsFiltrados.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`glass-card p-3 flex items-center gap-3 ${
                  item.status === 'disponivel' ? 'border border-emerald-500/10' : 'border border-amber-500/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.status === 'disponivel'
                    ? 'bg-emerald-500/10'
                    : 'bg-amber-500/10'
                }`}>
                  <Hash className={`w-4 h-4 ${
                    item.status === 'disponivel' ? 'text-emerald-400' : 'text-amber-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-xs font-bold">{item.stickerNumber}</p>
                  <p className="text-slate-600 text-[10px] font-mono">{item.hash.toUpperCase()}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.status === 'disponivel'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {item.status === 'disponivel' ? 'DISPONIVEL' : 'VINCULADO'}
                  </span>
                  {item.scanCount > 0 && (
                    <p className="text-slate-600 text-[9px] mt-0.5">{item.scanCount} scans</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Print-only grid */}
        <div className="hidden print:block mt-8">
          <h2 className="text-center text-black font-bold text-lg mb-6">ADESIVOS BIKE SEGURA BC</h2>
          <div className="grid grid-cols-4 gap-4">
            {items.filter(i => i.status === 'disponivel').map(item => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#/qr/${item.hash}`)}`;
              return (
                <div key={item._id} className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                  <img src={qrUrl} alt="" className="w-24 h-24 mx-auto mb-2" />
                  <p className="text-black font-mono text-[10px] font-bold">{item.stickerNumber}</p>
                  <p className="text-gray-500 text-[8px] font-mono">bikesegurabc.com.br</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
