import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MapPin, QrCode, ChevronRight, Bike } from 'lucide-react';
import { useBikes } from '../context/BikeContext';

interface AlertaFurtoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertaFurtoModal({ isOpen, onClose }: AlertaFurtoModalProps) {
  const { bikes } = useBikes();
  const whatsappNumber = '5547992458380';

  const handleEmitirAlerta = (bike: typeof bikes[0]) => {
    const mensagem = [
      '🚨 *ALERTA DE FURTO - BIKE SEGURA BC*',
      '',
      `*Equipamento:* ${bike.name}`,
      `*Marca:* ${bike.brand}`,
      `*Tipo:* ${bike.type}`,
      `*Nº de Série:* ${bike.serie}`,
      `*Cor:* ${bike.color}`,
      `*Localização aproximada:* ${bike.location}`,
      '',
      'O equipamento acima foi furtado/roubado. Solicito ativação imediata do protocolo de Recuperação Assistida.',
    ].join('\n');

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full bg-[#111827] rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-600" />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center animate-pulse-glow">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Alerta de Furto</h2>
                    <p className="text-red-400 text-xs">Selecione o equipamento</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full glass-card flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Warning */}
              <div className="glass-card border-l-4 border-l-red-500 p-3 mb-4">
                <p className="text-slate-400 text-xs leading-relaxed">
                  <span className="text-red-400 font-semibold">Atenção:</span> Ao confirmar, o alerta será enviado diretamente para nossa equipe via WhatsApp com os dados e link de rastreamento do equipamento.
                </p>
              </div>

              {/* Bike List */}
              {bikes.length > 0 ? (
                <div className="space-y-2.5">
                  {bikes.map(bike => (
                    <button
                      key={bike.id}
                      onClick={() => handleEmitirAlerta(bike)}
                      className="w-full glass-card p-3 flex items-center gap-3 text-left hover:border-red-400/30 transition-colors cursor-pointer"
                    >
                      {bike.photo ? (
                        <img src={bike.photo} alt={bike.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400/20 to-rose-500/20 flex items-center justify-center shrink-0">
                          <Bike className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bike.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <QrCode className="w-3 h-3 text-slate-600" />
                          <span className="text-slate-500 text-[10px] font-mono">{bike.serie}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span className="text-slate-500 text-[10px]">{bike.location}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhum equipamento cadastrado</p>
                  <p className="text-slate-500 text-xs mt-1 mb-3">Cadastre um equipamento primeiro para emitir o alerta</p>
                  <button
                    onClick={() => { onClose(); }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] text-xs font-bold"
                  >
                    CADASTRAR EQUIPAMENTO
                  </button>
                </div>
              )}

              {/* Direct WhatsApp option */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 glass-card text-slate-400 text-xs hover:text-white transition-colors"
                >
                  <span>Precisa de ajuda urgente? Fale diretamente</span>
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
