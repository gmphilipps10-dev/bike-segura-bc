import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Camera, FileText, Tag, MapPin, Link as LinkIcon,
  ChevronDown, Upload, ClipboardList, NotebookPen
} from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useBikes } from '../context/BikeContext';

const categories = [
  'Mountain Bike', 'Speed / Road', 'Elétrica Urbana', 'BMX', 'Gravel',
  'Dobrável', 'Urban / City', 'Downhill', 'Ciclocross', 'Triathlon',
  'Fat Bike', 'Outra'
];

const photoSlots = [
  { key: 'frente', label: 'Frente' },
  { key: 'tras', label: 'Traseira' },
  { key: 'latDir', label: 'Lat. Direita' },
  { key: 'latEsq', label: 'Lat. Esquerda' },
  { key: 'nQuadro', label: 'N. Quadro' },
  { key: 'notaFiscal', label: 'Nota Fiscal' },
  { key: 'acessorios', label: 'Acessórios' },
];

export default function CadastrarNovo() {
  const { addBike } = useBikes();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    marca: '', modelo: '', cor: '', numeroSerie: '',
    categoria: '',
    caracteristicas: '',
    tipoRastreamento: '', plataformaTag: '', linkRastreamento: '',
    notaFiscal: null as string | null,
  });

  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => ({ ...prev, [slot]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    addBike({
      name: `${form.marca} ${form.modelo}`,
      type: form.categoria || 'Não informado',
      brand: form.marca,
      serie: form.numeroSerie,
      color: form.cor,
      value: '',
      photo: photos['frente'] || photos['latDir'] || null
    });
    navigate('/equipamentos');
  };

  const isFormValid = form.marca && form.modelo && form.cor && form.numeroSerie && form.tipoRastreamento;

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-amber-400">{icon}</span>
      <h2 className="text-amber-400 font-bold text-sm tracking-wide">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <RouterLink to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </RouterLink>
          <h1 className="text-xl font-bold text-white">Cadastrar Bicicleta</h1>
        </motion.header>

        {/* ===== DADOS BASICOS ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-4">
          {sectionHeader(<FileText className="w-4 h-4" />, 'Dados Básicos')}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Marca <span className="text-amber-400">*</span></label>
              <input
                type="text" placeholder="Ex: Caloi, Specialized"
                value={form.marca} onChange={e => handleChange('marca', e.target.value)}
                className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Modelo <span className="text-amber-400">*</span></label>
              <input
                type="text" placeholder="Ex: Elite, Tarmac"
                value={form.modelo} onChange={e => handleChange('modelo', e.target.value)}
                className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Cor <span className="text-amber-400">*</span></label>
              <input
                type="text" placeholder="Ex: Preta, Vermelha"
                value={form.cor} onChange={e => handleChange('cor', e.target.value)}
                className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Número de Série <span className="text-amber-400">*</span></label>
              <input
                type="text" placeholder="Número gravado no quadro"
                value={form.numeroSerie} onChange={e => handleChange('numeroSerie', e.target.value)}
                className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
          </div>
        </motion.section>

        {/* ===== CATEGORIA ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
          {sectionHeader(<Tag className="w-4 h-4" />, 'Categoria')}

          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full glass-card flex items-center justify-between px-3 py-2.5 cursor-pointer"
            >
              <span className={`text-sm ${form.categoria ? 'text-white' : 'text-slate-500'}`}>
                {form.categoria || 'Selecione...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCategoryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-1 glass-card border border-white/10 rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto"
              >
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => { handleChange('categoria', c); setShowCategoryDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* ===== CARACTERISTICAS ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 mb-4">
          {sectionHeader(<ClipboardList className="w-4 h-4" />, 'Características')}

          <label className="text-slate-400 text-[11px] mb-1.5 block">Características / Observações</label>
          <textarea
            rows={3}
            placeholder="Acessórios, modificações, detalhes especiais..."
            value={form.caracteristicas}
            onChange={e => handleChange('caracteristicas', e.target.value)}
            className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none resize-none focus:border-amber-400/50 transition-colors"
          />
        </motion.section>

        {/* ===== RASTREAMENTO ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-4">
          {sectionHeader(<MapPin className="w-4 h-4" />, 'Rastreamento')}

          <label className="text-slate-400 text-[11px] mb-2 block">Tipo de Rastreamento <span className="text-amber-400">*</span></label>
          <div className="flex flex-wrap gap-2 mb-4">
            {['TAG', 'Rastreador GPS', 'TAG + GPS (Completo)'].map(opt => (
              <button
                key={opt}
                onClick={() => handleChange('tipoRastreamento', opt)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  form.tipoRastreamento === opt
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg shadow-amber-500/20'
                    : 'glass-card text-slate-300 hover:border-amber-400/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {form.tipoRastreamento && form.tipoRastreamento !== 'Rastreador GPS' && (
            <>
              <label className="text-slate-400 text-[11px] mb-2 block">Plataforma da TAG</label>
              <div className="flex gap-2 mb-4">
                {['iOS (Apple)', 'Android'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleChange('plataformaTag', opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      form.plataformaTag === opt
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'
                        : 'glass-card text-slate-300 hover:border-amber-400/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="text-slate-400 text-[11px] mb-1.5 block">Link de Rastreamento</label>
          <div className="glass-card flex items-center gap-3 px-3 py-2.5">
            <LinkIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text" placeholder="https://..."
              value={form.linkRastreamento}
              onChange={e => handleChange('linkRastreamento', e.target.value)}
              className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600"
            />
          </div>
        </motion.section>

        {/* ===== FOTOS ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5 mb-4">
          {sectionHeader(<Camera className="w-4 h-4" />, 'Fotos da Bicicleta')}

          <div className="grid grid-cols-2 gap-2.5">
            {photoSlots.map(slot => (
              <div key={slot.key} className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`photo-${slot.key}`}
                  onChange={(e) => handlePhotoUpload(e, slot.key)}
                />
                <label
                  htmlFor={`photo-${slot.key}`}
                  className="glass-card border-2 border-dashed border-white/10 hover:border-amber-400/40 transition-colors rounded-xl overflow-hidden cursor-pointer flex flex-col items-center justify-center py-5"
                >
                  {photos[slot.key] ? (
                    <div className="relative w-full aspect-square">
                      <img src={photos[slot.key]!} alt={slot.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] font-medium">Trocar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <Camera className="w-6 h-6 text-slate-500" />
                      <span className="text-slate-400 text-[11px]">{slot.label}</span>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ===== NOTA FISCAL ===== */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-6">
          {sectionHeader(<NotebookPen className="w-4 h-4" />, 'Nota Fiscal')}

          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            id="nota-fiscal"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setForm(prev => ({ ...prev, notaFiscal: reader.result as string }));
                reader.readAsDataURL(file);
              }
            }}
          />
          <label htmlFor="nota-fiscal" className="flex items-center gap-3 glass-card px-4 py-3 cursor-pointer hover:border-amber-400/30 transition-colors">
            <Upload className="w-5 h-5 text-amber-400" />
            <span className="text-slate-400 text-sm">{form.notaFiscal ? 'Nota fiscal anexada ✓' : 'Selecionar Nota Fiscal'}</span>
          </label>
        </motion.section>

        {/* ===== BOTAO CADASTRAR ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
          <motion.button
            whileTap={isFormValid ? { scale: 0.98 } : undefined}
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
              isFormValid
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            CADASTRAR BICICLETA
          </motion.button>
        </motion.div>

        {/* Cancelar */}
        <div className="text-center mb-8">
          <RouterLink to="/" className="text-slate-500 text-xs hover:text-amber-400 transition-colors">Cancelar</RouterLink>
        </div>

      </div>
    </div>
  );
}
