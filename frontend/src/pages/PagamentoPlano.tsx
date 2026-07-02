import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, Copy, QrCode, CreditCard, FileText,
  Shield, Award, Medal, Crown, Gem, Loader2, Bike, Clock3, CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBikes } from '../context/BikeContext';
import { apiGet, apiPost } from '../config/api';
import {
  formatDailyProtectionPrice,
  formatPlanPrice,
  getAnnualPlanPrice,
  getMonthlyPlanPrice,
  usePlanPrices,
} from '../hooks/usePlanPrices';
import { getStoredPartnerStore } from '../hooks/usePartnerStoreTracking';

const planosConfig = {
  bronze: { name: 'Bronze', icon: Award, color: 'text-amber-600', bg: 'bg-amber-500/10', desc: 'QR Code + alerta de furto' },
  prata: { name: 'Prata', icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/10', desc: 'TAG Bluetooth iOS ou Android' },
  ouro: { name: 'Ouro', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'GPS 4G + geocerca + Ativar Proteção' },
  diamante: { name: 'Diamante', icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'TAG + GPS + proteção máxima' },
};

function planRequiresInstallation(planId: string) {
  return ['prata', 'ouro', 'diamante'].includes(planId);
}

type MetodoPagamento = 'pix' | 'boleto' | 'cartao';
type Frequencia = 'mensal' | 'anual';
type OpcaoParcelamento = {
  parcelas: number;
  valorBase: number;
  valorEncargos: number;
  valorCobrado: number;
  valorParcela: number;
  valorUltimaParcela: number;
};

export default function PagamentoPlano() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();
  const { bikes, loading: bikesLoading } = useBikes();
  const { prices, loading: pricesLoading, error: pricesError } = usePlanPrices();

  const planoId = searchParams.get('plano') || 'bronze';
  const codigoParceiroUrl = searchParams.get('loja') || '';
  const plano = planosConfig[planoId as keyof typeof planosConfig] || planosConfig.bronze;
  const [bikeId, setBikeId] = useState(searchParams.get('bike') || '');
  const [frequencia, setFrequencia] = useState<Frequencia>(
    searchParams.get('frequencia') === 'anual' ? 'anual' : 'mensal'
  );
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [parcelasCartao, setParcelasCartao] = useState(1);
  const [opcoesParcelamento, setOpcoesParcelamento] = useState<OpcaoParcelamento[]>([]);
  const [simulacaoLoading, setSimulacaoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [reused, setReused] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [alterandoForma, setAlterandoForma] = useState(searchParams.get('alterar') === '1');
  const [carregandoExistente, setCarregandoExistente] = useState(Boolean(searchParams.get('cobranca')));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const valorAnual = getAnnualPlanPrice(prices[planoId as keyof typeof prices]);
  const mensalidade = getMonthlyPlanPrice(valorAnual);
  const valorEscolhido = frequencia === 'mensal' ? mensalidade : valorAnual;
  const opcaoCartao = opcoesParcelamento.find(opcao => opcao.parcelas === parcelasCartao);
  const cartaoAnual = metodo === 'cartao' && frequencia === 'anual';
  const valorFinal = cartaoAnual && opcaoCartao
    ? opcaoCartao.valorCobrado / 100
    : valorEscolhido;
  const equipamento = bikes.find(bike => bike.id === bikeId);
  const partnerStore = getStoredPartnerStore();

  useEffect(() => {
    setSimulacaoLoading(true);
    apiGet(`/pagamentos/simulacao-cartao?plano=${encodeURIComponent(planoId)}`)
      .then(data => setOpcoesParcelamento(Array.isArray(data?.opcoes) ? data.opcoes : []))
      .catch(() => setOpcoesParcelamento([]))
      .finally(() => setSimulacaoLoading(false));
  }, [planoId]);

  useEffect(() => {
    const cobrancaId = searchParams.get('cobranca');
    if (!cobrancaId || !token) {
      setCarregandoExistente(false);
      return;
    }

    apiGet('/pagamentos/meu-plano', token)
      .then(data => {
        const pagamentos = Array.isArray(data?.pagamentos) ? data.pagamentos : [];
        const cobranca = pagamentos.find((pagamento: any) => pagamento.id === cobrancaId);
        if (!cobranca) throw new Error('Cobranca pendente nao encontrada.');
        setResultado(cobranca);
        setReused(true);
      })
      .catch(err => {
        try {
          const parsed = JSON.parse(err.message);
          setError(parsed.message || 'Nao foi possivel carregar a cobranca.');
        } catch {
          setError(err.message || 'Nao foi possivel carregar a cobranca.');
        }
      })
      .finally(() => setCarregandoExistente(false));
  }, [searchParams, token]);

  useEffect(() => {
    if (resultado?.status !== 'pago') return;
    if (!planRequiresInstallation(resultado.plano || planoId) || !resultado.bikeId) return;

    const timer = window.setTimeout(() => {
      navigate(`/instalacao/agendar/${resultado.bikeId}`);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [resultado, planoId, navigate]);

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
        parcelasCartao: cartaoAnual ? parcelasCartao : 1,
        codigoParceiro: partnerStore?.codigo_parceiro || codigoParceiroUrl,
      }, token);
      setResultado(res.pagamento);
      setReused(Boolean(res.reused));
      setReplaced(Boolean(res.replaced));
      setAlterandoForma(false);
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
                {formatDailyProtectionPrice(valorAnual)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white text-xl font-bold">{formatPlanPrice(valorFinal)}</p>
              <p className="text-slate-500 text-xs">
                {frequencia === 'mensal'
                  ? '/mes'
                  : cartaoAnual && parcelasCartao > 1
                    ? `total em ${parcelasCartao}x`
                    : '/ano'}
              </p>
            </div>
          </div>
        </motion.div>

        {carregandoExistente && (
          <div className="glass-card p-5 mb-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando cobranca pendente...
          </div>
        )}

        {partnerStore && !resultado && (
          <div className="glass-card border border-emerald-400/20 bg-emerald-400/5 p-3 mb-4">
            <p className="text-emerald-300 text-xs font-semibold">Venda vinculada a loja parceira</p>
            <p className="text-slate-400 text-[11px] mt-1">
              Origem: {partnerStore.nome_fantasia || partnerStore.codigo_parceiro}
            </p>
          </div>
        )}

        {!resultado && !carregandoExistente && (
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
              {metodo === 'cartao' && (
                <div className="glass-card border border-blue-400/20 bg-blue-400/5 p-3 mt-3">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    Os dados do cartao serao preenchidos na pagina segura do Asaas e nao ficam armazenados no Bike Segura BC.
                    {frequencia === 'mensal'
                      ? ' A cobranca sera renovada mensalmente.'
                      : ' Voce pode pagar o ano a vista ou parcelar em ate 12 vezes.'}
                  </p>
                </div>
              )}

              {cartaoAnual && (
                <div className="glass-card border border-amber-400/20 p-4 mt-3">
                  <label htmlFor="parcelas-cartao" className="text-white font-semibold text-sm block mb-2">
                    Parcelamento no cartao
                  </label>
                  <select
                    id="parcelas-cartao"
                    value={parcelasCartao}
                    onChange={event => setParcelasCartao(Number(event.target.value))}
                    disabled={simulacaoLoading || !opcoesParcelamento.length}
                    className="w-full rounded-xl border border-white/10 bg-[#11192c] px-3 py-3 text-white text-sm outline-none focus:border-amber-400 disabled:opacity-50"
                  >
                    {opcoesParcelamento.map(opcao => (
                      <option key={opcao.parcelas} value={opcao.parcelas}>
                        {opcao.parcelas}x a partir de {formatPlanPrice(opcao.valorParcela / 100)}
                        {opcao.parcelas === 1 ? ' (a vista no cartao)' : ''}
                      </option>
                    ))}
                  </select>

                  {opcaoCartao && (
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3 text-slate-400">
                        <span>Plano anual</span>
                        <span>{formatPlanPrice(opcaoCartao.valorBase / 100)}</span>
                      </div>
                      <div className="flex justify-between gap-3 text-slate-400">
                        <span>Encargos do cartao</span>
                        <span>{formatPlanPrice(opcaoCartao.valorEncargos / 100)}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-white/10 pt-2 text-white font-bold">
                        <span>Total no cartao</span>
                        <span>{formatPlanPrice(opcaoCartao.valorCobrado / 100)}</span>
                      </div>
                      {opcaoCartao.parcelas > 1 && opcaoCartao.valorUltimaParcela !== opcaoCartao.valorParcela && (
                        <p className="text-slate-500 text-[10px]">
                          {opcaoCartao.parcelas - 1}x de {formatPlanPrice(opcaoCartao.valorParcela / 100)}
                          {' '}e ultima parcela de {formatPlanPrice(opcaoCartao.valorUltimaParcela / 100)}.
                        </p>
                      )}
                      <p className="text-slate-500 text-[10px] leading-relaxed pt-1">
                        Os encargos de processamento sao pagos pelo cliente. O Bike Segura BC recebe integralmente o valor do plano.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {alterandoForma && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-amber-400/20 p-4 mb-4">
                <p className="text-amber-400 text-xs font-semibold mb-1">Troca da forma de pagamento</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ao gerar a nova forma de pagamento, a cobranca anterior sera cancelada no Asaas para evitar duplicidade.
                </p>
              </motion.div>
            )}
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
            <div className="glass-card border-amber-400/20 p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-3">
                {resultado.status === 'pago'
                  ? <Check className="w-7 h-7 text-emerald-400" />
                  : <Clock3 className="w-7 h-7 text-amber-400" />}
              </div>
              <h3 className="text-white font-bold text-lg mb-1">
                {resultado.status === 'pago'
                  ? 'Pagamento confirmado'
                  : replaced
                    ? 'Forma de pagamento alterada'
                    : reused
                      ? 'Cobranca pendente'
                      : 'Cobranca criada!'}
              </h3>
              <p className="text-slate-400 text-xs">
                {reused
                  ? 'Esta cobranca ja estava vinculada ao equipamento. Use a opcao abaixo para realizar o pagamento.'
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
                  {resultado.status === 'pago'
                    ? 'Seu equipamento ja esta ativo no Bike Segura BC. Enquanto aguarda a instalacao, voce ja pode utilizar o cadastro antifurto, QR Code, passaporte digital, alerta de furto e rede de apoio.'
                    : 'A protecao deste equipamento sera ativada automaticamente quando o Asaas confirmar o pagamento.'}
                </p>
              </div>
            </div>

            {resultado.status === 'pago' && planRequiresInstallation(resultado.plano || planoId) && resultado.bikeId && (
              <button
                type="button"
                onClick={() => navigate(`/instalacao/agendar/${resultado.bikeId}`)}
                className="w-full py-3.5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                AGENDAR INSTALAÇÃO
              </button>
            )}

            {['pendente', 'atrasado'].includes(resultado.status) && (
              <button
                type="button"
                onClick={() => {
                  setResultado(null);
                  setReused(false);
                  setReplaced(false);
                  setAlterandoForma(true);
                  setMetodo(String(resultado.metodoPagamento || '').toLowerCase() === 'pix' ? 'boleto' : 'pix');
                }}
                className="w-full py-3.5 rounded-2xl border border-amber-400/30 bg-amber-400/5 text-amber-400 font-bold text-sm"
              >
                TROCAR FORMA DE PAGAMENTO
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm"
            >
              VOLTAR PARA O INICIO
            </button>
          </motion.div>
        )}

        {!resultado && !carregandoExistente && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              onClick={handleCriarCobranca}
              disabled={loading || pricesLoading || bikesLoading || simulacaoLoading || !bikeId || !!pricesError}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading || pricesLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
                : cartaoAnual && parcelasCartao > 1 && opcaoCartao
                  ? `PAGAR EM ${parcelasCartao}X NO CARTAO`
                  : `PAGAR ${formatPlanPrice(valorFinal)}${frequencia === 'mensal' ? '/MES' : ''}`}
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
