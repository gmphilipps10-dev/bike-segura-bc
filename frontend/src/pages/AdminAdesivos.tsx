import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Printer, Plus, Hash, CheckCircle, Package,
  AlertTriangle, Link2, Bike, QrCode, Search
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

interface BikeItem {
  _id: string;
  name: string;
  brand: string;
  type: string;
  serie: string;
  hash?: string;
  stickerNumber?: string;
  photo?: string | null;
}

export default function AdminAdesivos() {
  const [items, setItems] = useState<QRItem[]>([]);
  const [bikes, setBikes] = useState<BikeItem[]>([]);
  const [stats, setStats] = useState({ total: 0, disponiveis: 0, vinculados: 0 });
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [geradoMsg, setGeradoMsg] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'disponivel' | 'vinculado'>('disponivel');
  const [proximos, setProximos] = useState<string[]>([]);
  const [aba, setAba] = useState<'estoque' | 'vincular'>('estoque');
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [buscaBike, setBuscaBike] = useState('');

  const token = localStorage.getItem('token') || '';

  const fetchData = async () => {
    setLoading(true);
    try {
      // QR codes
      const statusParam = filtro !== 'todos' ? `&status=${filtro}` : '';
      const res = await fetch(`${API_BASE}/preprinted?limit=100${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats({ total: data.total, disponiveis: data.disponiveis, vinculados: data.vinculados });
      }
      // Bikes sem adesivo
      const resBikes = await fetch(`${API_BASE}/bikes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resBikes.ok) {
        const allBikes = await resBikes.json();
        setBikes(allBikes);
      }
      // Proximos disponiveis
      const resProx = await fetch(`${API_BASE}/preprinted/proximos-disponiveis?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProx.ok) {
        const data = await resProx.json();
        setProximos(data.proximos);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filtro]);

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
      }
    } catch {}
    setGerando(false);
  };

  const vincularAdesivo = async (bikeId: string) => {
    setVinculando(bikeId);
    try {
      const res = await fetch(`${API_BASE}/preprinted/vincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bikeId })
      });
      if (res.ok) {
        const data = await res.json();
        setGeradoMsg(`Adesivo ${data.qr.stickerNumber} vinculado com sucesso!`);
        fetchData();
      } else {
        const err = await res.json();
        setGeradoMsg(err.message || 'Erro ao vincular');
      }
    } catch {
      setGeradoMsg('Erro de conexao');
    }
    setVinculando(null);
  };

  const bikesSemAdesivo = bikes.filter(b => !b.hash);
  const bikesComAdesivo = bikes.filter(b => b.hash);

  const bikesFiltradas = buscaBike
    ? bikesSemAdesivo.filter(b =>
        b.name.toLowerCase().includes(buscaBike.toLowerCase()) ||
        b.serie.toLowerCase().includes(buscaBike.toLowerCase()) ||
        b.brand.toLowerCase().includes(buscaBike.toLowerCase())
      )
    : bikesSemAdesivo;

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
            <p className="text-xs text-slate-400">Estoque e vinculacao</p>
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
            <p className="text-slate-500 text-[10px]">Em uso</p>
          </div>
        </motion.div>

        {/* Alerta estoque baixo */}
        {stats.disponiveis < 10 && stats.total > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border border-red-500/30 p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-bold text-sm">Estoque baixo!</p>
              <p className="text-slate-400 text-xs">Apenas {stats.disponiveis} adesivos. Gere um novo lote.</p>
            </div>
          </motion.div>
        )}

        {/* Proximos para instalacao */}
        {proximos.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              <h3 className="text-amber-400 font-bold text-xs tracking-wider">PROXIMOS ADESIVOS PARA INSTALACAO</h3>
            </div>
            <p className="text-slate-500 text-[10px] mb-2">Se um cliente cadastrou a bike, o sistema usara estes numeros automaticamente:</p>
            <div className="flex flex-wrap gap-1.5">
              {proximos.slice(0, 15).map(n => (
                <span key={n} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">{n}</span>
              ))}
              {proximos.length > 15 && (
                <span className="px-2 py-1 rounded bg-white/5 text-slate-500 text-[10px]">+{proximos.length - 15}</span>
              )}
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
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl glass-card border border-white/10 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.06] transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-xs">IMPRIMIR FOLHA</span>
          </motion.button>
        </div>

        {/* Msg */}
        <AnimatePresence>
          {geradoMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass-card bg-emerald-500/10 border border-emerald-500/20 p-3 mb-4 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs">{geradoMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Abas */}
        <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setAba('estoque')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              aba === 'estoque' ? 'bg-amber-400 text-[#0c1222]' : 'text-slate-400'
            }`}
          >
            ESTOQUE ({stats.disponiveis})
          </button>
          <button
            onClick={() => setAba('vincular')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              aba === 'vincular' ? 'bg-amber-400 text-[#0c1222]' : 'text-slate-400'
            }`}
          >
            VINCULAR A BIKE ({bikesSemAdesivo.length})
          </button>
        </div>

        {/* ABA: ESTOQUE */}
        {aba === 'estoque' && (
          <>
            <p className="text-slate-500 text-[10px] mb-3">
              Clique IMPRIMIR para gerar folha A4 com todos os adesivos disponiveis (tamanho 3,5cm ideal para bike).
            </p>
            <div className="flex gap-2 mb-3">
              {(['disponivel', 'vinculado', 'todos'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                    filtro === f ? 'bg-white/10 text-white' : 'text-slate-600'
                  }`}
                >
                  {f === 'todos' ? 'TODOS' : f === 'disponivel' ? 'DISP.' : 'USADOS'}
                </button>
              ))}
            </div>
            {loading ? (
              <p className="text-slate-500 text-center text-sm py-8">Carregando...</p>
            ) : itemsFiltrados.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">Nenhum adesivo {filtro === 'disponivel' ? 'disponivel' : ''}</p>
                {stats.total === 0 && (
                  <p className="text-slate-600 text-[10px] mt-1">Gere o primeiro lote de 100 adesivos</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
                {itemsFiltrados.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className={`glass-card p-2.5 ${
                      item.status === 'disponivel' ? 'border border-emerald-500/10' : 'border border-slate-500/10 opacity-60'
                    }`}
                  >
                    <p className="text-white font-mono text-[11px] font-bold">{item.stickerNumber}</p>
                    <p className="text-slate-600 text-[9px] font-mono">{item.hash.slice(0, 8).toUpperCase()}</p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                      item.status === 'disponivel'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status === 'disponivel' ? 'LIVRE' : 'USADO'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ABA: VINCULAR A BIKE */}
        {aba === 'vincular' && (
          <>
            <p className="text-slate-500 text-[10px] mb-3">
              Bikes cadastradas sem adesivo fisico. Clique "Vincular" para associar o proximo adesivo disponivel automaticamente.
            </p>

            {/* Busca */}
            <div className="glass-card flex items-center gap-2 px-3 py-2 mb-3">
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar bike..."
                value={buscaBike}
                onChange={e => setBuscaBike(e.target.value)}
                className="bg-transparent text-white text-xs w-full outline-none placeholder:text-slate-600"
              />
            </div>

            {bikesFiltradas.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <Bike className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">
                  {buscaBike ? 'Nenhuma bike encontrada' : 'Todas as bikes ja tem adesivo!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
                {bikesFiltradas.map((bike, i) => (
                  <motion.div
                    key={bike._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="glass-card p-3 flex items-center gap-3"
                  >
                    {bike.photo ? (
                      <img src={bike.photo} alt={bike.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-500/20 flex items-center justify-center shrink-0">
                        <Bike className="w-5 h-5 text-amber-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{bike.name}</p>
                      <p className="text-slate-500 text-[10px]">{bike.brand} - {bike.serie}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => vincularAdesivo(bike._id)}
                      disabled={vinculando === bike._id || stats.disponiveis === 0}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] text-[10px] font-bold disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3" />
                      {vinculando === bike._id ? '...' : 'VINCULAR'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bikes com adesivo */}
            {bikesComAdesivo.length > 0 && (
              <div className="mt-6">
                <h3 className="text-slate-500 text-[10px] font-bold mb-2 tracking-wider">BIKES COM ADESIVO</h3>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto scrollbar-hide opacity-60">
                  {bikesComAdesivo.map(bike => (
                    <div key={bike._id} className="glass-card p-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{bike.name}</p>
                        <p className="text-slate-500 text-[9px]">{bike.stickerNumber || bike.hash?.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Print-only: grid compacto A4, 30 QR Codes por folha */}
        <div className="hidden print:block">
          <div className="text-center mb-4">
            <h2 className="text-black font-bold text-sm">BIKE SEGURA BC - ADESIVOS QR CODE</h2>
            <p className="text-gray-500 text-[8px]">Imprimir em papel adesivo casca de ovo (void) - Recortar com tesoura</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {items.filter(i => i.status === 'disponivel').map(item => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/#/s/${item.stickerNumber}`)}`;
              return (
                <div key={item._id} className="border border-gray-300 rounded p-1.5 text-center">
                  <img src={qrUrl} alt="" className="w-10 h-10 mx-auto mb-0.5" />
                  <p className="text-black font-mono text-[7px] font-bold leading-tight">{item.stickerNumber}</p>
                  <p className="text-gray-400 text-[5px]">bikesegurabc</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
