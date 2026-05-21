import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Store, ExternalLink, MapPin, Phone, Instagram,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categorias = ['Todas', 'Bike Shop', 'Acessórios', 'Serviços', 'Hospedagem', 'Restaurante'];

const lojas = [
  {
    id: 1,
    nome: 'Bike Point BC',
    categoria: 'Bike Shop',
    descricao: 'Venda e manutenção de bikes premium. Especialista em Mountain Bike e Speed.',
    endereco: 'Av. Brasil, 1500 - Centro, Balneário Camboriú',
    telefone: '(47) 3365-1234',
    instagram: '@bikepointbc',
    site: '#',
    destaque: true,
  },
  {
    id: 2,
    nome: 'Pedal Shop',
    categoria: 'Acessórios',
    descricao: 'Acessórios, vestuário e equipamentos para ciclistas. As melhores marcas do mercado.',
    endereco: 'Rua 1500, 340 - Centro, Balneário Camboriú',
    telefone: '(47) 3365-5678',
    instagram: '@pedalshopbc',
    site: '#',
    destaque: false,
  },
  {
    id: 3,
    nome: 'Ciclo Mecânica',
    categoria: 'Serviços',
    descricao: 'Oficina especializada em manutenção de bicicletas convencionais e elétricas.',
    endereco: 'Av. Atlântica, 2200 - Barra Norte, Balneário Camboriú',
    telefone: '(47) 98888-1234',
    instagram: '@ciclomecanicabc',
    site: '#',
    destaque: false,
  },
  {
    id: 4,
    nome: 'Hotel Ciclista',
    categoria: 'Hospedagem',
    descricao: 'Hotel pet-friendly com bike-friendly. Armazenamento seguro e rotas exclusivas.',
    endereco: 'Rua 2100, 100 - Barra Sul, Balneário Camboriú',
    telefone: '(47) 3365-9012',
    instagram: '@hotelciclistabc',
    site: '#',
    destaque: true,
  },
  {
    id: 5,
    nome: 'Speed Café',
    categoria: 'Restaurante',
    descricao: 'Café e restaurante com tema ciclismo. Ponto de encontro da comunidade pedal.',
    endereco: 'Av. Central, 500 - Centro, Balneário Camboriú',
    telefone: '(47) 3365-3456',
    instagram: '@speedcafebc',
    site: '#',
    destaque: false,
  },
  {
    id: 6,
    nome: 'E-Bike Center',
    categoria: 'Bike Shop',
    descricao: 'Especialistas em bikes elétricas e patinetes. Test ride disponível.',
    endereco: 'Rua 1800, 78 - Barra Norte, Balneário Camboriú',
    telefone: '(47) 98888-5678',
    instagram: '@ebikecenterbc',
    site: '#',
    destaque: false,
  },
];

export default function LojasParceiras() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [busca, setBusca] = useState('');

  const lojasFiltradas = lojas.filter(l => {
    const matchCategoria = categoriaAtiva === 'Todas' || l.categoria === categoriaAtiva;
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase()) || l.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-orange-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Lojas Parceiras</h1>
            <p className="text-xs text-slate-400">Apoie quem apoia o ciclismo</p>
          </div>
        </motion.header>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-5 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{lojas.length} lojas parceiras</p>
            <p className="text-slate-400 text-xs">Em Balneário Camboriú e região</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar loja parceira..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide"
        >
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoriaAtiva === cat
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'
                  : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Lojas List */}
        <div className="space-y-3 mb-24">
          {lojasFiltradas.map((loja, i) => (
            <motion.div
              key={loja.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="glass-card-hover p-4 group"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  loja.destaque
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                    : 'bg-gradient-to-br from-orange-400/20 to-amber-500/20'
                }`}>
                  <Store className={`w-5 h-5 ${loja.destaque ? 'text-[#0c1222]' : 'text-orange-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">{loja.nome}</h3>
                    {loja.destaque && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">DESTAQUE</span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[10px]">{loja.categoria}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-xs leading-relaxed mb-3">{loja.descricao}</p>

              {/* Info */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-slate-500 text-[11px]">{loja.endereco}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-slate-500 text-[11px]">{loja.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-slate-500 text-[11px]">{loja.instagram}</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={loja.site}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl glass-card border border-white/5 flex items-center justify-center gap-2 group-hover:border-amber-400/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-semibold">VISITAR PÁGINA</span>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Quer ser parceiro? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card border border-amber-400/20 p-5 mb-8 text-center"
        >
          <Store className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-white font-bold text-sm mb-1">Quer ser uma loja parceira?</h3>
          <p className="text-amber-400 text-xs font-semibold mb-3">ENTRE EM CONTATO CONOSCO!</p>
          <a
            href="https://wa.me/5547992458380"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] font-bold text-xs cursor-pointer"
          >
            SAIBA MAIS
          </a>
        </motion.div>

      </div>
    </div>
  );
}
