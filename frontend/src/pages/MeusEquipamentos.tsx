import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Shield, ShieldCheck, MapPin, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useBikes } from '../context/BikeContext';

export default function MeusEquipamentos() {
  const { bikes } = useBikes();
  const activeCount = bikes.filter(b => b.protected).length;

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Meus Equipamentos</h1>
            <p className="text-xs text-slate-400">{bikes.length} {bikes.length === 1 ? 'bike cadastrada' : 'bikes cadastradas'} • {activeCount} protegidas</p>
          </div>
        </motion.header>

        {/* Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{activeCount} de {bikes.length} equipamentos protegidos</p>
            <p className="text-xs text-slate-400 mt-0.5">Monitoramento em tempo real ativo</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-bold text-lg">{bikes.length > 0 ? Math.round((activeCount / bikes.length) * 100) : 0}%</p>
          </div>
        </motion.div>

        {/* Bike List */}
        <div className="space-y-4 mb-24">
          {bikes.map((bike, i) => (
            <motion.div
              key={bike.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="glass-card-hover overflow-hidden cursor-pointer group"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={bike.photo || '/bike-1.jpg'} alt={bike.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    bike.protected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {bike.protected ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {bike.protected ? 'PROTEGIDO' : 'DESATIVADO'}
                  </div>
                </div>

                {/* Bike Type */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                    {bike.type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-base mb-1">{bike.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400 text-xs font-mono">{bike.serie}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400 text-xs">{bike.location}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${
                    bike.protected ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {bike.lastSeen}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Button */}
        {bikes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-400 text-sm mb-4">Nenhum equipamento cadastrado</p>
            <Link to="/cadastrar" className="text-amber-400 text-xs">Cadastrar agora</Link>
          </motion.div>
        )}

        <Link to="/cadastrar">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="fixed bottom-20 right-4 z-40"
          >
            <button className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30 cursor-pointer hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-[#0c1222]" />
            </button>
          </motion.div>
        </Link>

      </div>

      <BottomNav />
    </div>
  );
}
