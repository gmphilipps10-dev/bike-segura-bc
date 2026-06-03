import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, FileText, Tag, MapPin, Link as LinkIcon,
  Upload, ClipboardList, NotebookPen, CheckCircle, Copy, QrCode
} from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useBikes } from '../context/BikeContext';

const categories = [
  'Bicicleta Mountain Bike', 'Bicicleta Mountain Bike Eletrica',
  'Bicicleta Speed / Road', 'Bicicleta Speed Eletrica',
  'Bicicleta Urbana / City', 'Bicicleta Urbana Eletrica',
  'Bicicleta Dobravel / Folding', 'Bicicleta Dobravel Eletrica',
  'Bicicleta Gravel', 'Bicicleta BMX', 'Bicicleta Downhill',
  'Bicicleta Enduro', 'Bicicleta Cross-country (XC)',
  'Bicicleta Trail / All Mountain', 'Bicicleta Fat Bike',
  'Bicicleta Triathlon / TT', 'Bicicleta Ciclocross',
  'Bicicleta Cicloturismo', 'Bicicleta Carga',
  'Bicicleta Carga Eletrica', 'Bicicleta Infantil',
  'Bicicleta Triciclo Adulto', 'Bicicleta Triciclo Adulto Eletrico',
  'Bicicleta Handbike', 'Bicicleta Tandem',
  'Bicicleta Lowrider / Custom', 'Patinete Eletrico',
  'Patinete Eletrico Compartilhado', 'Patinete Manual',
  'Patinete Eletrico Off-road', 'Patinete Motorizado a Combustao',
  'Skate Eletrico', 'Longboard Eletrico',
  'Monociclo Eletrico / EUC', 'Hoverboard', 'One-wheel',
  'Moto Eletrica', 'Moto Eletrica Dobravel', 'Triciclo Eletrico',
  'Quadriciclo Eletrico', 'Go-kart Eletrico', 'Outro Equipamento'
];

const photoSlots = [
  { key: 'frente', label: 'Frente' },
  { key: 'tras', label: 'Traseira' },
  { key: 'latDir', label: 'Lat. Direita' },
  { key: 'latEsq', label: 'Lat. Esquerda' },
  { key: 'nQuadro', label: 'N. Quadro' },
  { key: 'acessorios', label: 'Acessorios' },
];

export default function CadastrarNovo() {
  const { addBike } = useBikes();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    marca: '', modelo: '', cor: '', numeroSerie: '',
    categoria: '', caracteristicas: '',
    tipoRastreamento: '', plataformaTag: '', linkRastreamento: '',
    notaFiscal: null as string | null,
  });
  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [cadastrando, setCadastrando] = useState(false);
  const [bikeCadastrada, setBikeCadastrada] = useState<any>(null);
  const [showPlanPrompt, setShowPlanPrompt] = useState(false);

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

  const handleSubmit = async () => {
    setCadastrando(true);
    try {
      console.log('[Cadastro] Enviando...');
      const result = await addBike({
        name: `${form.marca} ${form.modelo}`,
        type: form.categoria || 'Nao informado',
        brand: form.marca,
        serie: form.numeroSerie,
        color: form.cor,
        value: '',
        photo: photos['frente'] || photos['latDir'] || null,
        caracteristicas: form.caracteristicas,
        rastreamento: form.tipoRastreamento,
        plataformaTag: form.plataformaTag,
      });
      console.log('[Cadastro] Resultado:', JSON.stringify(result, null, 2));
      // SEMPRE mostra modal se tiver resultado, senao navega
      if (result && (result.id || result._id)) {
        console.log('[Cadastro] Abrindo modal com:', result.hash || 'sem hash');
        setBikeCadastrada(result);
        setShowPlanPrompt(true);
      } else {
        console.log('[Cadastro] Sem resultado valido, navegando');
        alert('Bike cadastrada! (sem dados de retorno)');
        navigate('/equipamentos');
      }
    } catch (err: any) {
      console.error('[Cadastro] Erro:', err);
      alert('Erro ao cadastrar: ' + (err.message || 'desconhecido'));
      navigate('/equipamentos');
    }
    setCadastrando(false);
  };

  const isFormValid = form.marca && form.modelo && form.cor && form.numeroSerie && form.tipoRastreamento;

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-amber-400">{icon}</span>
      <h2 className="text-amber-400 font-bold text-sm tracking-wide">{title}</h2>
    </div>
  );

  // URL base para QR Code
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : '/';

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <RouterLink to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </RouterLink>
          <h1 className="text-xl font-bold text-white">Cadastrar Equipamento</h1>
        </motion.header>

        {/* DADOS BASICOS */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-4">
          {sectionHeader(<FileText className="w-4 h-4" />, 'Dados Basicos')}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Marca <span className="text-amber-400">*</span></label>
              <input type="text" placeholder="Ex: Caloi" value={form.marca} onChange={e => handleChange('marca', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Modelo <span className="text-amber-400">*</span></label>
              <input type="text" placeholder="Ex: Elite" value={form.modelo} onChange={e => handleChange('modelo', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">Cor <span className="text-amber-400">*</span></label>
              <input type="text" placeholder="Ex: Preta" value={form.cor} onChange={e => handleChange('cor', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none" />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] mb-1.5 block">N. Serie <span className="text-amber-400">*</span></label>
              <input type="text" placeholder="N. Quadro" value={form.numeroSerie} onChange={e => handleChange('numeroSerie', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none" />
            </div>
          </div>
        </motion.section>

        {/* CATEGORIA */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
          {sectionHeader(<Tag className="w-4 h-4" />, 'Categoria')}
          <select value={form.categoria} onChange={e => handleChange('categoria', e.target.value)} className="w-full glass-card px-3 py-2.5 text-sm text-white outline-none cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
            <option value="" className="bg-[#1a2332]">Selecione...</option>
            {categories.map(c => <option key={c} value={c} className="bg-[#1a2332]">{c}</option>)}
          </select>
        </motion.section>

        {/* CARACTERISTICAS */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 mb-4">
          {sectionHeader(<ClipboardList className="w-4 h-4" />, 'Caracteristicas')}
          <textarea rows={3} placeholder="Acessorios, modificacoes..." value={form.caracteristicas} onChange={e => handleChange('caracteristicas', e.target.value)} className="w-full glass-card px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none resize-none" />
        </motion.section>

        {/* RASTREAMENTO */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-4">
          {sectionHeader(<MapPin className="w-4 h-4" />, 'Rastreamento')}
          <label className="text-slate-400 text-[11px] mb-2 block">Tipo <span className="text-amber-400">*</span></label>
          <div className="flex flex-wrap gap-2 mb-4">
            {['TAG', 'Rastreador GPS', 'TAG + GPS (Completo)'].map(opt => (
              <button key={opt} onClick={() => handleChange('tipoRastreamento', opt)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${form.tipoRastreamento === opt ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] shadow-lg shadow-amber-500/20' : 'glass-card text-slate-300'}`}>{opt}</button>
            ))}
          </div>
          {form.tipoRastreamento && form.tipoRastreamento !== 'Rastreador GPS' && (
            <>
              <label className="text-slate-400 text-[11px] mb-2 block">Plataforma</label>
              <div className="flex gap-2 mb-4">
                {['iOS (Apple)', 'Android'].map(opt => (
                  <button key={opt} onClick={() => handleChange('plataformaTag', opt)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${form.plataformaTag === opt ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]' : 'glass-card text-slate-300'}`}>{opt}</button>
                ))}
              </div>
            </>
          )}
          <label className="text-slate-400 text-[11px] mb-1.5 block">Link</label>
          <div className="glass-card flex items-center gap-3 px-3 py-2.5">
            <LinkIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <input type="text" placeholder="https://..." value={form.linkRastreamento} onChange={e => handleChange('linkRastreamento', e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder:text-slate-600" />
          </div>
        </motion.section>

        {/* FOTOS */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5 mb-4">
          {sectionHeader(<Camera className="w-4 h-4" />, 'Fotos')}
          <div className="grid grid-cols-2 gap-2.5">
            {photoSlots.map(slot => (
              <div key={slot.key} className="relative">
                <input type="file" accept="image/*" className="hidden" id={`photo-${slot.key}`} onChange={(e) => handlePhotoUpload(e, slot.key)} />
                <label htmlFor={`photo-${slot.key}`} className="glass-card border-2 border-dashed border-white/10 hover:border-amber-400/40 rounded-xl overflow-hidden cursor-pointer flex flex-col items-center justify-center py-5">
                  {photos[slot.key] ? (
                    <div className="relative w-full aspect-square">
                      <img src={photos[slot.key]!} alt={slot.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="text-white text-[10px]">Trocar</span></div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2"><Camera className="w-6 h-6 text-slate-500" /><span className="text-slate-400 text-[11px]">{slot.label}</span></div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </motion.section>

        {/* NOTA FISCAL */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-6">
          {sectionHeader(<NotebookPen className="w-4 h-4" />, 'Nota Fiscal')}
          <input type="file" accept="image/*,.pdf" className="hidden" id="nota-fiscal" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setForm(p => ({ ...p, notaFiscal: r.result as string })); r.readAsDataURL(f); } }} />
          <label htmlFor="nota-fiscal" className="flex items-center gap-3 glass-card px-4 py-3 cursor-pointer hover:border-amber-400/30"><Upload className="w-5 h-5 text-amber-400" /><span className="text-slate-400 text-sm">{form.notaFiscal ? 'NF anexada ✓' : 'Selecionar NF'}</span></label>
        </motion.section>

        {/* BOTAO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
          <motion.button whileTap={isFormValid && !cadastrando ? { scale: 0.98 } : undefined} onClick={handleSubmit} disabled={!isFormValid || cadastrando} className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer ${isFormValid && !cadastrando ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] shadow-lg' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}>
            {cadastrando ? 'CADASTRANDO...' : 'CADASTRAR'}
          </motion.button>
        </motion.div>

        <div className="text-center mb-8"><RouterLink to="/" className="text-slate-500 text-xs hover:text-amber-400">Cancelar</RouterLink></div>

        {/* ===== MODAL SUCESSO ===== */}
        <AnimatePresence>
          {bikeCadastrada && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm glass-card border border-emerald-500/20 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 text-center border-b border-white/5">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg">Cadastrado!</h3>
                  <p className="text-slate-400 text-xs mt-1">{bikeCadastrada.name || bikeCadastrada.brand + ' ' + bikeCadastrada.modelo}</p>
                </div>

                <div className="p-5">
                  {/* QR Code - sempre mostra algo */}
                  <div className="text-center mb-4">
                    {bikeCadastrada.hash ? (
                      <>
                        <div className="bg-white rounded-xl p-3 inline-block mb-2">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${baseUrl}#/qr/${bikeCadastrada.hash}`)}`}
                            alt="QR"
                            className="w-32 h-32"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        {bikeCadastrada.stickerNumber && (
                          <div className="glass-card bg-amber-500/5 border border-amber-400/20 px-3 py-2 rounded-lg mb-2">
                            <p className="text-slate-500 text-[10px]">Adesivo</p>
                            <p className="text-amber-400 font-mono text-sm font-bold">{bikeCadastrada.stickerNumber}</p>
                          </div>
                        )}
                        <div className="glass-card px-3 py-2 rounded-lg flex items-center justify-center gap-2">
                          <p className="text-slate-400 font-mono text-[10px]">{String(bikeCadastrada.hash).toUpperCase()}</p>
                          <button onClick={() => navigator.clipboard.writeText(String(bikeCadastrada.hash))} className="cursor-pointer"><Copy className="w-3 h-3 text-slate-500" /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs">QR Code em processamento</p>
                        <p className="text-slate-600 text-[10px] mt-1">Verifique em Meus Equipamentos</p>
                      </>
                    )}
                  </div>

                  <p className="text-slate-500 text-[10px] text-center mb-4">
                    {bikeCadastrada.stickerNumber
                      ? `Use o adesivo ${bikeCadastrada.stickerNumber} no quadro da bike.`
                      : 'Imprima este QR Code em adesivo casca de ovo e cole no quadro.'}
                  </p>

                  {/* Botao escolher plano */}
                  <button
                    onClick={() => { setBikeCadastrada(null); navigate('/planos'); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0c1222] font-bold text-sm cursor-pointer mb-3"
                  >
                    ESCOLHER PLANO DE PROTECAO
                  </button>

                  <button onClick={() => { setBikeCadastrada(null); navigate('/equipamentos'); }} className="w-full py-3 rounded-xl glass-card text-slate-400 text-sm cursor-pointer">
                    Meus Equipamentos
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
