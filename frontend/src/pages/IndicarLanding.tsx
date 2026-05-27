import { motion } from 'framer-motion';
import { Bike, Gift, ArrowRight, CheckCircle } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function IndicarLanding() {
  const { codigo } = useParams<{ codigo: string }>();

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden flex flex-col items-center justify-center px-5">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mx-auto mb-4">
            <Bike className="w-10 h-10 text-[#0c1222]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">BIKE SEGURA BC</h1>
          <p className="text-slate-400 text-sm mt-1">Proteja o que te move</p>
        </motion.div>

        {/* Gift Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6 text-left"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Voce foi indicado!</p>
              <p className="text-slate-400 text-xs">Use o codigo e ganhe beneficios</p>
            </div>
          </div>

          <div className="glass-card bg-amber-500/5 border border-amber-400/20 p-4 mb-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Codigo de indicacao</p>
            <p className="text-amber-400 font-mono text-xl font-bold">{codigo}</p>
          </div>

          <div className="space-y-2">
            {[
              '10% de desconto na primeira assinatura',
              'Protecao completa para sua bike',
              'Rastreamento em tempo real',
              'Alertas de furto instantaneos'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-xs">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/login">
            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
              <span className="text-[#0c1222] font-bold text-sm tracking-wide">CADASTRAR AGORA</span>
              <ArrowRight className="w-5 h-5 text-[#0c1222]" />
            </button>
          </Link>
          <p className="text-slate-500 text-xs mt-4">
            Ja tem conta? <Link to="/login" className="text-amber-400">Faca login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
