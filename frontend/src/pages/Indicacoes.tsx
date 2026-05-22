import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Share2, Copy, Check, Users, Gift, TrendingUp,
  UserPlus, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Indicacoes() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const descontoAtual = 0;
  const convertidas = 0;
  const proximoDesconto = 10;

  // Generate code from user name
  const generateCode = () => {
    if (user?.name) {
      const prefix = user.name.split(' ')[0].toUpperCase().slice(0, 6);
      return `${prefix}2025BC`;
    }
    return 'BIKE2025BC';
  };

  const codigoIndicacao = generateCode();
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
        // Usuário cancelou
      }
    } else {
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
                  Indique <span className="font-bold">1 amigo</span> para começar a acumular <span className="font-bold">{proximoDesconto}%</span> de desconto
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

        {/* Indicações List - Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm">Minhas indicações</h3>
            <span className="text-slate-500 text-xs">{convertidas} convertida(s)</span>
          </div>

          {convertidas === 0 && (
            <div className="glass-card p-8 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-1">Nenhuma indicação ainda</p>
              <p className="text-slate-500 text-xs">Compartilhe seu código para começar a acumular descontos</p>
            </div>
          )}
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
