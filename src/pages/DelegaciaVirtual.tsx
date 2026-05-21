import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, ExternalLink, Copy, Check,
  Bike, MapPin, QrCode, Palette, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBikes } from '../context/BikeContext';

const delegaciaUrl = 'https://www.delegaciavirtual.sc.gov.br/';

export default function DelegaciaVirtual() {
  const { bikes } = useBikes();
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRedirectConfirm, setShowRedirectConfirm] = useState(false);

  const selectedBike = bikes.find(b => b.id === selectedBikeId);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const getBikeInfoText = () => {
    if (!selectedBike) return '';
    return [
      `Marca: ${selectedBike.brand}`,
      `Modelo: ${selectedBike.name}`,
      `Tipo: ${selectedBike.type}`,
      `Cor: ${selectedBike.color}`,
      `Número de Série: ${selectedBike.serie}`,
      `Localização aproximada: ${selectedBike.location}`,
    ].join('\n');
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-40 right-0 w-60 h-60 bg-red-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Delegacia Virtual SC</h1>
            <p className="text-xs text-slate-400">Registro de ocorrência</p>
          </div>
        </motion.header>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border-l-4 border-l-red-500 p-4 mb-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold mb-1">Sofreu furto ou roubo?</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Selecione o equipamento abaixo para copiar os dados e registrar o boletim de ocorrência na Delegacia Virtual de Santa Catarina.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Step 1: Select Equipment */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-amber-400 font-bold text-sm">Selecione o Equipamento</h2>
          </div>

          <div className="space-y-2.5">
            {bikes.map((bike) => (
              <button
                key={bike.id}
                onClick={() => { setSelectedBikeId(bike.id); setShowRedirectConfirm(false); }}
                className={`w-full glass-card p-3 flex items-center gap-3 text-left transition-all cursor-pointer ${
                  selectedBikeId === bike.id
                    ? 'border-amber-400/50 bg-amber-500/5'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selectedBikeId === bike.id ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                }`}>
                  {selectedBikeId === bike.id && <Check className="w-3 h-3 text-[#0c1222]" />}
                </div>
                {bike.photo && (
                  <img src={bike.photo} alt={bike.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{bike.name}</p>
                  <p className="text-slate-500 text-xs">{bike.type} • {bike.serie}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>

          {bikes.length === 0 && (
            <div className="glass-card p-8 text-center">
              <Bike className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhum equipamento cadastrado</p>
              <Link to="/cadastrar" className="text-amber-400 text-xs mt-2 inline-block">Cadastrar agora</Link>
            </div>
          )}
        </motion.section>

        {/* Step 2: Copy Info */}
        <AnimatePresence>
          {selectedBike && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-amber-400 font-bold text-sm">Copie os Dados</h2>
              </div>

              <div className="glass-card p-4 space-y-3">
                {/* Copy All */}
                <button
                  onClick={() => copyToClipboard(getBikeInfoText(), 'all')}
                  className="w-full glass-card border border-amber-400/20 hover:border-amber-400/50 px-3 py-2.5 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-amber-400 text-xs font-semibold">Copiar todos os dados</span>
                  {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                </button>

                <div className="h-px bg-white/5" />

                {/* Individual Fields */}
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: Bike, label: 'Marca/Modelo', value: `${selectedBike.brand} ${selectedBike.name}` },
                    { icon: Palette, label: 'Cor', value: selectedBike.color },
                    { icon: QrCode, label: 'Número de Série', value: selectedBike.serie },
                    { icon: MapPin, label: 'Localização', value: selectedBike.location },
                    { icon: Bike, label: 'Categoria', value: selectedBike.type },
                  ].map((field) => (
                    <button
                      key={field.label}
                      onClick={() => copyToClipboard(field.value, field.label)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <field.icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-500 text-[10px]">{field.label}</p>
                        <p className="text-white text-xs truncate">{field.value}</p>
                      </div>
                      {copiedField === field.label ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {selectedBike.photo && (
                  <>
                    <div className="h-px bg-white/5" />
                    <div>
                      <p className="text-slate-500 text-[10px] mb-2">Foto do equipamento</p>
                      <img src={selectedBike.photo} alt={selectedBike.name} className="w-full aspect-video rounded-lg object-cover" />
                      <p className="text-slate-600 text-[10px] mt-1.5">Salve a imagem para anexar ao boletim</p>
                    </div>
                  </>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Step 3: Go to Delegacia */}
        <AnimatePresence>
          {selectedBike && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-amber-400 font-bold text-sm">Acesse a Delegacia Virtual</h2>
              </div>

              {!showRedirectConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRedirectConfirm(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm tracking-wide">REGISTRAR OCORRÊNCIA</span>
                  <ExternalLink className="w-4 h-4 text-white/70" />
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card border border-red-500/30 p-5"
                >
                  <p className="text-white text-sm font-semibold mb-2">Você será redirecionado</p>
                  <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                    Ao clicar em confirmar, você será direcionado para a Delegacia Virtual de Santa Catarina. 
                    Os dados do equipamento já foram copiados — cole-os no formulário de ocorrência.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRedirectConfirm(false)}
                      className="flex-1 py-3 rounded-xl glass-card text-slate-400 text-xs font-semibold cursor-pointer"
                    >
                      CANCELAR
                    </button>
                    <a
                      href={delegaciaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold text-center shadow-lg shadow-red-500/20"
                    >
                      CONFIRMAR
                    </a>
                  </div>
                </motion.div>
              )}

              <p className="text-center text-slate-600 text-[10px] mt-3">
                delegaciavirtual.sc.gov.br
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-4"
        >
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-amber-400 font-semibold">Importante:</span> O registro do boletim de ocorrência é feito diretamente no site oficial da Polícia Civil de Santa Catarina. O Bike Segura BC apenas facilita o acesso e a cópia dos dados do seu equipamento.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
