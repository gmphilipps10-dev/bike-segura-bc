import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Share2, Copy, Check, Users, Gift, TrendingUp,
  UserPlus, CircleCheck, Clock, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const indicacoesMock = [
  { id: 1, nome: 'Carlos Silva', data: '15/05/2025', status: 'convertido' },
  { id: 2, nome: 'Ana Paula', data: '02/06/2025', status: 'convertido' },
  { id: 3, nome: 'Marcos Lima', data: '10/06/2025', status: 'pendente' },
  { id: 4, nome: 'Fernanda Rocha', data: '18/06/2025', status: 'convertido' },
  { id: 5, nome: 'Pedro Costa', data: '01/07/2025', status: 'pendente' },
];

export default function Indicacoes() {
  const [copied, setCopied] = useState(false);
  const descontoAtual = 30; // 3 indicações convertidas = 30%
  const convertidas = indicacoesMock.filter(i => i.status === 'convertido').length;
  const proximoDesconto = Math.min((convertidas + 1) * 10, 100);
  const codigoIndicacao = 'GIAN2025BC';
  const linkIndicacao = `https://bikesegurabc.com.br/indicar/${codigoIndicacao}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = async () => {
    const shareData = {
      title: 'Bike Segura BC - Indicação',
      text: `Use meu código ${codigoIndicacao} e ganhe benefícios no Bike Segura BC! Proteja sua bike com quem entende.`,
      url: linkIndicacao,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Usuário cancelou o compartilhamento
      }
    } else {
      // Fallback: copiar link
      copyToClipboard(linkIndicacao);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Minhas Indicações</h1>
            <p className="text-xs text-slate-400">Indique e ganhe desconto</p>
          </div>
        </motion.header>

        {/* Discount Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 mb-5 relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Gift className="w-6 h-6 text-[#0c1222]" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Seu desconto acumulado</p>
                <p className="text-3xl font-bold text-gradient-gold">{descontoAtual}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${descontoAtual}%` }}
                  transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-slate-500 text-[10px]">0%</span>
                <span className="text-amber-400 text-[10px] font-semibold">{descontoAtual}% acumulado</span>
                <span className="text-slate-500 text-[10px]">100%</span>
              </div>
            </div>

            <div className="glass-card bg-amber-500/5 border border-amber-400/20 p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-400 text-xs">
                  Mais <span className="font-bold">{10 - (descontoAtual % 10)} indicação(ões)</span> para chegar a <span className="font-bold">{proximoDesconto}%</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 mb-5"
        >
          <h3 className="text-white font-bold text-sm mb-3">Como funciona</h3>
          <div className="space-y-2.5">
            {[
              { icon: UserPlus, text: 'Cada indicação que contratar o Bike Segura BC = 10% de desconto' },
              { icon: TrendingUp, text: 'O desconto é cumulativo: 10%, 20%, 30%... até 100%' },
              { icon: Gift, text: 'Ao atingir 100%, seu próximo plano sai de graça' },
              { icon: Users, text: 'Depois de usar o desconto, a contagem zera e recomeça' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <item.icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-xs">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Share Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4 mb-5"
        >
          <h3 className="text-white font-bold text-sm mb-3">Seu código de indicação</h3>

          <div className="glass-card bg-amber-500/5 border border-amber-400/20 p-3 mb-3 flex items-center justify-between">
            <span className="text-amber-400 font-mono text-sm font-bold">{codigoIndicacao}</span>
            <button
              onClick={() => copyToClipboard(codigoIndicacao)}
              className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer hover:bg-amber-500/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          <button
            onClick={shareLink}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#0c1222]" />
            <span className="text-[#0c1222] font-bold text-sm">COMPARTILHAR LINK</span>
          </button>
        </motion.div>

        {/* Indicacoes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">Minhas indicações</h3>
            <span className="text-amber-400 text-xs font-semibold">{convertidas} convertida(s)</span>
          </div>

          <div className="space-y-2">
            {indicacoesMock.map((ind, i) => (
              <motion.div
                key={ind.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="glass-card p-3 flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ind.status === 'convertido'
                    ? 'bg-emerald-500/20'
                    : 'bg-yellow-500/10'
                }`}>
                  {ind.status === 'convertido' ? (
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{ind.nome}</p>
                  <p className="text-slate-500 text-[10px]">{ind.data}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  ind.status === 'convertido'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {ind.status === 'convertido' ? '+10%' : 'PENDENTE'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Link to="/planos">
            <button className="w-full py-4 rounded-2xl glass-card border border-amber-400/20 flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-500/5 transition-colors">
              <span className="text-amber-400 font-bold text-sm">VER PLANOS</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
