import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, Copy, QrCode, CreditCard, FileText,
  Shield, Award, Medal, Crown, Gem, Loader2, Bike
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBikes } from '../context/BikeContext';
import { apiPost } from '../config/api';
import {
  formatDailyProtectionPrice,
  formatPlanPrice,
  getAnnualPlanPrice,
  usePlanPrices,
} from '../hooks/usePlanPrices';

const planosConfig = {
  bronze: { name: 'Bronze', icon: Award, color: 'text-amber-600', bg: 'bg-amber-500/10', desc: 'Protecao basica' },
  prata: { name: 'Prata', icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/10', desc: 'TAG iOS ou Android' },
  ouro: { name: 'Ouro', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'Rastreador GPS 4G' },
  diamante: { name: 'Diamante', icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'TAG + Rastreador GPS 4G' },
};

type MetodoPagamento = 'pix' | 'boleto' | 'cartao';
type Frequencia = 'mensal' | 'anual';

export default function PagamentoPlano() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();
  const { bikes, loading: bikesLoading } = useBikes();
  const { prices, loading: pricesLoading, error: pricesError } = usePlanPrices();

  const planoId = searchParams.get('plano') || 'bronze';
  const plano = planosConfig[planoId as keyof typeof planosConfig] || planosConfig.bronze;
  const [bikeId, setBikeId] = useState(searchParams.get('bike') || '');
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal');
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [reused, setReused] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const mensalidade = prices[planoId as keyof typeof prices];
  const valorAnual = getAnnualPlanPrice(mensalidade);
  const valorEscolhido = frequencia === 'mensal' ? mensalidade : valorAnual;
  const equipamento = bikes.find(bike => bike.id === bikeId);

  const handleCriarCobranca = async () => {
    if (!isLoggedIn || !token) {
      setError('Faca login para continuar com o pagamento.');
      return;
    }
    if (!bikeId || !equipamento) {
      setError('Escolha o equipamento que recebera a protecao.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/pagamentos/criar-minha-cobranca', {
        plano: planoId,
        bikeId,
        frequencia,
        metodoPagamento: metodo,
      }, token);
      setResultado(res.pagamento);
      setReused(Boolean(res.reused));
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.message || 'Erro ao criar cobranca. Tente novamente.');
      } catch {
        setError(err.message || 'Erro ao criar cobranca. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = plano.icon;

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-lg mx-auto px-4 pt-6 pb-8">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/planos')} className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Pagamento</h1>
            <p className="text-xs text-slate-400">Finalize a protecao do equipamento</p>
          </div>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${plano.bg} flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${plano.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${plano.color}`}>{plano.name}</h2>
              <p className="text-slate-400 text-xs">{plano.desc}</p>
              <p className="text-emerald-400 text-[11px] font-semibold mt-1">
                ({formatDailyProtectionPrice(mensalidade)})
              </p>
            </div>
            <div className="text-right">
              <p className="text-white text-xl font-bold">{formatPlanPrice(valorEscolhido)}</p>
              <p className="text-slate-500 text-xs">{frequencia === 'mensal' ? '/mes' : '/ano'}</p>
            </div>
          </div>
        </motion.div>

        {!resultado && (
          <>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Bike className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-semibold text-sm">Equipamento protegido</h3>
              </div>
              {bikesLoading ? (
                <p className="text-slate-500 text-xs">Carregando equipamentos...</p>
              ) : bikes.length ? (
                <div className="space-y-2">
                  {bikes.map(bike => (
                    <button
                      key={bike.id}
                      type="button"
                      onClick={() => {
                        setBikeId(bike.id);
                        setError('');
                      }}
                      className={`w-full rounded-xl border p-3 text-left ${
                        bikeId === bike.id
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-white text-sm font-semibold">{bike.name}</p>
                      <p className="text-slate-500 text-[11px]">{bike.brand} • Serie {bike.serie}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => navigate('/cadastrar')} className="w-full py-3 rounded-xl bg-amber-400 text-[#0c1222] text-sm font-bold">
                  CADASTRAR EQUIPAMENTO
                </button>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Como deseja pagar?</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequencia('mensal')}
                  className={`glass-card rounded-xl p-4 text-left border ${
                    frequencia === 'mensal' ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/5'
                  }`}
                >
                  <p className="text-white text-sm font-bold">Mensal</p>
                  <p className="text-amber-400 text-lg font-bold">{formatPlanPrice(mensalidade)}</p>
                  <p className="text-slate-500 text-[10px]">12 cobrancas mensais</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencia('anual')}
                  className={`glass-card rounded-xl p-4 text-left border ${
                    frequencia === 'anual' ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/5'
                  }`}
                >
                  <p className="text-white text-sm font-bold">Ano completo</p>
                  <p className="text-amber-400 text-lg font-bold">{formatPlanPrice(valorAnual)}</p>
                  <p className="text-slate-500 text-[10px]">uma unica cobranca</p>
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Forma de pagamento</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pix', label: 'PIX', icon: QrCode },
                  { id: 'boleto', label: 'Boleto', icon: FileText },
                  { id: 'cartao', label: 'Cartao', icon: CreditCard },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setMetodo(item.id as MetodoPagamento)}
                    className={`glass-card p-3 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      metodo === item.id ? 'border-amber-400/50 bg-amber-400/5' : 'border-white/5'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${metodo === item.id ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className={`text-xs font-medium ${metodo === item.id ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {(error || pricesError) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-red-500/20 p-4 mb-4">
            <p role="alert" className="text-red-400 text-sm">{error || pricesError}</p>
            {!isLoggedIn && (
              <button onClick={() => navigate('/login')} className="mt-2 text-amber-400 text-xs font-bold hover:underline cursor-pointer">
                Fazer login
              </button>
            )}
          </motion.div>
        )}

        {resultado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card border-emerald-500/20 p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">
                {reused ? 'Cobranca existente' : 'Cobranca criada!'}
              </h3>
              <p className="text-slate-400 text-xs">
                {reused
                  ? 'Este equipamento ja tinha uma cobranca ativa. Nenhuma cobranca duplicada foi gerada.'
                  : `Protecao vinculada a ${resultado.bikeName || equipamento?.name}.`}
              </p>
            </div>

            {resultado.pixQrCode && (
              <div className="glass-card p-5 text-center">
                <h4 className="text-white font-semibold text-sm mb-3">QR Code PIX</h4>
                <div className="bg-white rounded-xl p-3 inline-block mb-3">
                  <img src={`data:image/png;base64,${resultado.pixQrCode}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
                {resultado.pixPayload && (
                  <div className="glass-card px-3 py-2 rounded-lg flex items-center justify-center gap-2">
                    <p className="text-slate-400 font-mono text-[10px] truncate max-w-[200px]">{resultado.pixPayload}</p>
                    <button onClick={() => copyToClipboard(resultado.pixPayload)} className="cursor-pointer shrink-0">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {resultado.boletoUrl && (
              <div className="glass-card p-5 text-center">
                <h4 className="text-white font-semibold text-sm mb-3">Boleto bancario</h4>
                <a href={resultado.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-[#0c1222] font-bold text-sm">
                  <FileText className="w-4 h-4" /> Visualizar boleto
                </a>
              </div>
            )}

            {resultado.linkPagamento && (
              <div className="glass-card p-5 text-center">
                <a href={resultado.linkPagamento} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-[#0c1222] font-bold text-sm">
                  <CreditCard className="w-4 h-4" /> Abrir pagamento seguro
                </a>
              </div>
            )}

            <div className="glass-card p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  A protecao deste equipamento sera ativada automaticamente quando o Asaas confirmar o pagamento.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm"
            >
              VOLTAR PARA O INICIO
            </button>
          </motion.div>
        )}

        {!resultado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              onClick={handleCriarCobranca}
              disabled={loading || pricesLoading || bikesLoading || !bikeId || !!pricesError}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading || pricesLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
                : `PAGAR ${formatPlanPrice(valorEscolhido)}${frequencia === 'mensal' ? '/MES' : ''}`}
            </button>
            <p className="text-center text-slate-600 text-[10px] mt-3">
              Pagamento processado de forma segura pelo Asaas
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
