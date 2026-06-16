import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Tag, Plus, X, Bike, ChevronRight, Search,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBikes } from '../context/BikeContext';

interface Anuncio {
  id: string;
  equipamentoId: string;
  nome: string;
  tipo: string;
  marca: string;
  preco: string;
  condicao: string;
  descricao: string;
  foto: string | null;
  data: string;
  vendedor: string;
  telefone: string;
}

const condicoes = ['Novo', 'Seminovo', 'Usado - Excelente', 'Usado - Bom', 'Usado - Regular'];

export default function AnuncieAqui() {
  const { bikes } = useBikes();
  const [showForm, setShowForm] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [form, setForm] = useState({ preco: '', condicao: '', descricao: '' });
  const [busca, setBusca] = useState('');
  const [meusAnuncios, setMeusAnuncios] = useState<Anuncio[]>([]);

  const selectedBike = bikes.find(b => b.id === selectedBikeId);

  const anunciosFiltrados = meusAnuncios.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.tipo.toLowerCase().includes(busca.toLowerCase()) ||
    a.marca.toLowerCase().includes(busca.toLowerCase())
  );

  const handleCreateAnuncio = () => {
    if (!selectedBike || !form.preco || !form.condicao) return;

    const novoAnuncio: Anuncio = {
      id: Date.now().toString(),
      equipamentoId: selectedBike.id,
      nome: selectedBike.name,
      tipo: selectedBike.type,
      marca: selectedBike.brand,
      preco: form.preco,
      condicao: form.condicao,
      descricao: form.descricao,
      foto: selectedBike.photo,
      data: new Date().toLocaleDateString('pt-BR'),
      vendedor: 'Você',
      telefone: ''
    };

    setMeusAnuncios(prev => [novoAnuncio, ...prev]);
    setShowForm(false);
    setSelectedBikeId(null);
    setForm({ preco: '', condicao: '', descricao: '' });
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -right-20 w-60 h-60 bg-sky-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Anuncie Aqui</h1>
            <p className="text-xs text-slate-400">Venda seu equipamento cadastrado</p>
          </div>
        </motion.header>

        {/* Rules Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border-l-4 border-l-sky-400 p-4 mb-5"
        >
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold mb-1">Somente equipamentos cadastrados</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Para anunciar, o equipamento precisa estar previamente cadastrado no Bike Segura BC. Não aceitamos anúncios de equipamentos externos.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Criar Anuncio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5"
        >
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm tracking-wide">CRIAR ANÚNCIO</span>
          </button>
        </motion.div>

        {/* Search */}
        {meusAnuncios.length > 0 && (
          <div className="glass-card flex items-center gap-3 px-4 py-3 mb-5">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar anúncios..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600"
            />
          </div>
        )}

        {/* Anuncios Feed */}
        <div className="space-y-3 mb-6">
          {meusAnuncios.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-sm">Meus anúncios</h3>
              <span className="text-slate-500 text-xs">{anunciosFiltrados.length} ativo(s)</span>
            </div>
          )}

          {anunciosFiltrados.map((anuncio, i) => (
            <motion.div
              key={anuncio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="glass-card-hover overflow-hidden"
            >
              {anuncio.foto && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={anuncio.foto} alt={anuncio.nome} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold text-sm">{anuncio.nome}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">{anuncio.tipo}</span>
                </div>
                <p className="text-slate-500 text-xs mb-2">{anuncio.marca} • {anuncio.condicao}</p>
                {anuncio.descricao && (
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">{anuncio.descricao}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-500 text-[10px]">Preço</p>
                    <p className="text-white font-bold text-lg">R$ {Number(anuncio.preco).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-[10px]">Publicado</p>
                    <p className="text-slate-400 text-xs">{anuncio.data}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {meusAnuncios.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center"
            >
              <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-1">Nenhum anúncio ainda</p>
              <p className="text-slate-500 text-xs">Cadastre um equipamento e crie seu primeiro anúncio</p>
              {bikes.length === 0 && (
                <Link to="/cadastrar" className="text-sky-400 text-xs mt-3 inline-block">
                  Cadastrar equipamento
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
              onClick={() => { setShowForm(false); setSelectedBikeId(null); }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full bg-[#111827] rounded-t-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>

                <div className="px-5 pb-8 pt-2">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-white font-bold text-lg">Criar Anúncio</h2>
                    <button
                      onClick={() => { setShowForm(false); setSelectedBikeId(null); }}
                      className="w-8 h-8 rounded-full glass-card flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {!selectedBikeId || !selectedBike ? (
                    /* Step 1: Select Bike */
                    <div>
                      <p className="text-slate-400 text-xs mb-3">Selecione um equipamento cadastrado para anunciar:</p>
                      <div className="space-y-2">
                        {bikes.map(bike => (
                          <button
                            key={bike.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedBikeId(bike.id); }}
                            className="w-full glass-card p-3 flex items-center gap-3 text-left cursor-pointer hover:border-amber-400/30 transition-colors"
                          >
                            {bike.photo ? (
                              <img src={bike.photo} alt={bike.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 flex items-center justify-center shrink-0">
                                <Bike className="w-5 h-5 text-sky-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{bike.name}</p>
                              <p className="text-slate-500 text-xs">{bike.type} • {bike.serie}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          </button>
                        ))}
                      </div>

                      {bikes.length === 0 && (
                        <div className="text-center py-8">
                          <Bike className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">Nenhum equipamento cadastrado</p>
                          <Link to="/cadastrar" className="text-sky-400 text-xs mt-2 inline-block">Cadastrar primeiro</Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Step 2: Anuncio Details */
                    <div className="space-y-4">
                      {/* Selected Bike Preview */}
                      <div className="glass-card p-3 flex items-center gap-3">
                        {selectedBike?.photo ? (
                          <img src={selectedBike.photo} alt={selectedBike.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-500/20 flex items-center justify-center shrink-0">
                            <Bike className="w-6 h-6 text-sky-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{selectedBike?.name}</p>
                          <p className="text-slate-500 text-xs">{selectedBike?.type} • {selectedBike?.serie}</p>
                        </div>
                        <button
                          onClick={() => setSelectedBikeId(null)}
                          className="text-slate-500 text-xs hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          Trocar
                        </button>
                      </div>

                      {/* Preco */}
                      <div>
                        <label className="text-slate-400 text-xs mb-1.5 block">Preço (R$)</label>
                        <div className="glass-card flex items-center gap-3 px-4 py-3">
                          <DollarSign className="w-5 h-5 text-sky-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="0,00"
                            value={form.preco}
                            onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))}
                            className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Condicao */}
                      <div>
                        <label className="text-slate-400 text-xs mb-1.5 block">Condição</label>
                        <div className="flex flex-wrap gap-2">
                          {condicoes.map(c => (
                            <button
                              key={c}
                              onClick={() => setForm(prev => ({ ...prev, condicao: c }))}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                form.condicao === c
                                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white'
                                  : 'glass-card text-slate-400 hover:text-white'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Descricao */}
                      <div>
                        <label className="text-slate-400 text-xs mb-1.5 block">Descrição</label>
                        <textarea
                          rows={3}
                          placeholder="Detalhes sobre o equipamento, motivo da venda, etc."
                          value={form.descricao}
                          onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                          className="w-full glass-card px-4 py-3 text-white text-sm placeholder:text-slate-600 outline-none resize-none"
                        />
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateAnuncio}
                        disabled={!form.preco || !form.condicao}
                        className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide cursor-pointer transition-all ${
                          form.preco && form.condicao
                            ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        PUBLICAR ANÚNCIO
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
