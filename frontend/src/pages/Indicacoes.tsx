import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Share2, Copy, Check, Users, Gift, TrendingUp,
  UserPlus, ChevronRight, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Indicacoes() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const descontoAtual = 0;
  const convertidas = 0;
  // Valor configuravel pelo admin - nao expor numeros fixos sem autorizacao
  const proximoBeneficio = 'Beneficio';

  // Generate code from user name
  const generateCode = () => {
    if (user?.name) {
      const prefix = user.name.split(' ')[0].toUpperCase().slice(0, 6);
      return `${prefix}2025BC`;
    }
    return 'BIKE2025BC';
  };

  const codigoIndicacao = generateCode();
  // Usa o dominio real do app (funciona em qualquer ambiente)
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://bikesegurabc.com.br/';
  const linkIndicacao = `${baseUrl}#/indicar/${codigoIndicacao}`;

  const copyToClipboard = async (text: string) => {
    let success = false;

    // Tenta navigator.clipboard primeiro (funciona em browsers modernos)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        // Falhou, tenta fallback
      }
    }

    // Fallback para iOS Safari e browsers antigos
    if (!success) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        success = document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    const shareData = {
      title: 'Bike Segura BC - Indicação',
      text: `Use meu codigo ${codigoIndicacao} no Bike Segura BC! Sua bike protegida com Acordo de Cooperacao Tecnica (ACT) com as forcas de seguranca.`,
      url: linkIndicacao,
      url: linkIndicacao,
    };

    // Tenta navigator.share (iOS Safari suporta, mas pode falhar com URL inválida)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; // Sucesso, sai da função
      } catch (err: any) {
        // Se o erro for "cancelado pelo usuário", ignora
        if (err?.name === 'AbortError') return;
        // Outros erros: cai no fallback
      }
    }

    // Fallback: copia o link para o clipboard
    await copyToClipboard(linkIndicacao);
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Minhas Indicações</h1>
            <p className="text-xs text-slate-400">Indique e ganhe beneficios</p>
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
                  Indique <span className="font-bold">1 amigo</span> e comece a acumular <span className="font-bold">{proximoBeneficio}s exclusivos</span>
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
              { icon: Shield, text: 'ACT - Acordo de Cooperacao Tecnica com forcas de seguranca', highlight: true },
              { icon: UserPlus, text: 'Indique amigos e acumule beneficios exclusivos' },
              { icon: TrendingUp, text: 'Descontos cumulativos em cada indicacao convertida' },
              { icon: Gift, text: 'Beneficios especiais ao atingir metas de indicacao' },
              { icon: Users, text: 'Depois de usar os beneficios, a contagem zera e recomeça' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <item.icon className={`w-4 h-4 shrink-0 mt-0.5 ${item.highlight ? 'text-amber-400' : 'text-amber-400'}`} />
                <span className={`text-xs ${item.highlight ? 'text-amber-300 font-semibold' : 'text-slate-300'}`}>{item.text}</span>
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
              <p className="text-slate-500 text-xs">Compartilhe seu codigo para comecar a acumular beneficios</p>
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
