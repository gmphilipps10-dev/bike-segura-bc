import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, Shield, Crown, Gem, Medal, Award,
  HelpCircle, Bike, Clock3, FileText, QrCode, CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  formatDailyProtectionPrice,
  formatPlanPrice,
  getAnnualPlanPrice,
  getMonthlyPlanPrice,
  usePlanPrices,
} from '../hooks/usePlanPrices';
import { useBikes } from '../context/BikeContext';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../config/api';

type CobrancaPendente = {
  id: string;
  plano: string;
  bikeId: string;
  bikeName: string;
  frequencia: 'mensal' | 'anual';
  valor: number;
  status: 'pendente' | 'atrasado';
  cobrancaAtiva: boolean;
  metodoPagamento: string;
  boletoUrl?: string;
  pixPayload?: string;
  linkPagamento?: string;
  dataVencimento?: string;
};

const plans = [
  {
    id: 'bronze',
    name: 'Bronze',
    subtitle: 'Identificação + Alerta de Furto',
    icon: Award,
    period: '/mes',
    color: 'from-amber-600 to-amber-700',
    borderColor: 'border-amber-600/30',
    popular: false,
    features: [
      'Acesso ao App Bike Segura BC',
      'Cadastro do proprietário e do equipamento',
      'Botão Emitir Alerta de Furto',
      'Acionamento via ACT (Acordo de Cooperação Técnica)',
      'Adesivo ultradestrutivel identificador',
      'Consulta pública por QR Code',
      'Proteção inicial com identificação e acionamento rápido',
    ],
  },
  {
    id: 'prata',
    name: 'Prata',
    subtitle: 'TAG Bluetooth + identificação',
    icon: Medal,
    period: '/mes',
    color: 'from-slate-400 to-slate-500',
    borderColor: 'border-slate-400/30',
    popular: false,
    features: [
      'Tudo do plano Bronze',
      'Suporte via WhatsApp',
      'Instalação de TAG Bluetooth (iOS ou Android)',
      'Apoio na localização por rede Bluetooth',
      'Recuperação assistida quando houver indício de localização',
    ],
  },
  {
    id: 'ouro',
    name: 'Ouro',
    subtitle: 'GPS 4G + Geocerca',
    icon: Crown,
    period: '/mes',
    color: 'from-amber-400 to-yellow-500',
    borderColor: 'border-amber-400/50',
    popular: true,
    features: [
      'Tudo do plano Bronze',
      'Suporte via WhatsApp',
      'Instalação de rastreador GPS 4G',
      'Botão Ativar Proteção no app',
      'Geocerca temporária com raio configurável',
      'Alerta de movimentação após 10 segundos fora da área',
      'Sirene, vibração e aviso no aplicativo',
      'Recuperação assistida com localização GPS',
    ],
  },
  {
    id: 'diamante',
    name: 'Diamante',
    subtitle: 'TAG + GPS + Proteção máxima',
    icon: Gem,
    period: '/mes',
    color: 'from-blue-400 to-cyan-400',
    borderColor: 'border-blue-400/30',
    popular: false,
    features: [
      'Tudo do plano Ouro',
      'Suporte via WhatsApp',
      'Instalação de TAG Bluetooth + rastreador GPS 4G',
      'Ativar Proteção com geocerca temporária',
      'Dupla camada: localização GPS + apoio por TAG',
      'Alerta de movimentação no app com localização atual',
      'Prioridade operacional na recuperação assistida',
      'Proteção premium para quem quer o pacote completo',
    ],
  },
];

export default function Planos() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { prices } = usePlanPrices();
  const { bikes, loading: bikesLoading } = useBikes();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedBike, setSelectedBike] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [showFaq, setShowFaq] = useState(false);
  const [cobrancasPendentes, setCobrancasPendentes] = useState<CobrancaPendente[]>([]);

  useEffect(() => {
    if (!token) return;

    apiGet('/pagamentos/meu-plano', token)
      .then(data => {
        const pagamentos = Array.isArray(data?.pagamentos) ? data.pagamentos : [];
        setCobrancasPendentes(pagamentos.filter((pagamento: CobrancaPendente) => (
          pagamento.cobrancaAtiva
          && ['pendente', 'atrasado'].includes(pagamento.status)
        )));
      })
      .catch(() => setCobrancasPendentes([]));
  }, [token]);

  const handleAssinar = (planId: string, frequencia: 'mensal' | 'anual') => {
    if (!selectedBike) {
      setSelectionError('Escolha primeiro o equipamento que recebera a protecao.');
      document.getElementById('selecionar-equipamento')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    navigate(`/pagamento?plano=${planId}&bike=${selectedBike}&frequencia=${frequencia}`);
  };

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        <div className="absolute top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-4">
          <Link to="/" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Planos Bike Segura BC</h1>
            <p className="text-xs text-slate-400">Escolha o plano ideal para proteger sua bike</p>
          </div>
        </motion.header>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-3.5 mb-5 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">2.400+ bikes recuperadas</p>
            <p className="text-slate-400 text-[11px]">Taxa de recuperação de 94% em Balneário Camboriú</p>
          </div>
        </motion.div>

        {cobrancasPendentes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="mb-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-bold text-sm">Pagamento pendente</h2>
            </div>

            {cobrancasPendentes.map(cobranca => {
              const metodo = String(cobranca.metodoPagamento || '').toLowerCase();
              const MetodoIcon = metodo === 'boleto' ? FileText : metodo === 'pix' ? QrCode : CreditCard;
              const vencimento = cobranca.dataVencimento
                ? new Intl.DateTimeFormat('pt-BR').format(new Date(cobranca.dataVencimento))
                : '';

              return (
                <div key={cobranca.id} className="glass-card border border-amber-400/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                      <MetodoIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">
                        Plano {cobranca.plano?.charAt(0).toUpperCase() + cobranca.plano?.slice(1)}
                      </p>
                      <p className="text-slate-400 text-xs truncate">{cobranca.bikeName || 'Equipamento cadastrado'}</p>
                      <p className="text-amber-400 text-sm font-bold mt-1">
                        {formatPlanPrice(Number(cobranca.valor || 0) / 100)}
                        <span className="text-slate-500 text-[10px] font-normal ml-1">
                          {cobranca.frequencia === 'mensal' ? 'mensal' : 'ano completo'}
                        </span>
                      </p>
                      {vencimento && (
                        <p className={`text-[10px] mt-1 ${cobranca.status === 'atrasado' ? 'text-red-400' : 'text-slate-500'}`}>
                          {cobranca.status === 'atrasado' ? 'Vencido em' : 'Vence em'} {vencimento}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/pagamento?plano=${cobranca.plano}&bike=${cobranca.bikeId}&frequencia=${cobranca.frequencia}&cobranca=${cobranca.id}`)}
                      className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 text-[#0c1222] text-xs font-bold"
                    >
                      {metodo === 'boleto' ? 'ABRIR BOLETO' : metodo === 'pix' ? 'VER PIX' : 'ABRIR PAGAMENTO'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/pagamento?plano=${cobranca.plano}&bike=${cobranca.bikeId}&frequencia=${cobranca.frequencia}&alterar=1`)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white text-xs font-bold"
                    >
                      TROCAR FORMA DE PAGAMENTO
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.section>
        )}

        <motion.div
          id="selecionar-equipamento"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card p-4 mb-5 border border-amber-400/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bike className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-bold text-sm">1. Escolha o equipamento</h2>
          </div>
          <p className="text-slate-400 text-xs mb-3">
            Toda assinatura fica vinculada a um unico equipamento.
          </p>

          {bikesLoading ? (
            <p className="text-slate-500 text-xs">Carregando seus equipamentos...</p>
          ) : bikes.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {bikes.map(bike => (
                <button
                  key={bike.id}
                  type="button"
                  onClick={() => {
                    setSelectedBike(bike.id);
                    setSelectionError('');
                  }}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedBike === bike.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <p className="text-white text-sm font-semibold">{bike.name}</p>
                  <p className="text-slate-500 text-[11px]">{bike.brand} • Serie {bike.serie}</p>
                </button>
              ))}
            </div>
          ) : (
            <Link
              to="/cadastrar"
              className="block w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-center text-sm font-bold text-[#0c1222]"
            >
              CADASTRAR EQUIPAMENTO
            </Link>
          )}
          {selectionError && <p role="alert" className="text-red-400 text-xs mt-3">{selectionError}</p>}
        </motion.div>

        {/* Plans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3 mb-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const valorAnual = getAnnualPlanPrice(prices[plan.id as keyof typeof prices]);
            const mensalidade = getMonthlyPlanPrice(valorAnual);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: i === 0 ? -20 : i === 2 ? 20 : 0, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
                  isSelected ? plan.borderColor + ' border-2 ring-1 ring-offset-0' : 'border border-white/5'
                } ${plan.popular ? 'ring-1 ring-amber-400/30' : ''}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-4 z-10">
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] text-[10px] font-bold px-3 py-1 rounded-b-lg shadow-lg">
                      MAIS POPULAR
                    </div>
                  </div>
                )}

                <div className="glass-card p-5">
                  {/* Plan Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                      <p className="text-slate-400 text-xs">{plan.subtitle}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-gradient-gold' : 'text-white'}`}>{formatPlanPrice(mensalidade)}</span>
                    <span className="text-slate-500 text-sm ml-1">/mes</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-1">
                    ou {formatPlanPrice(valorAnual)} no pagamento anual
                  </p>
                  <p className="text-emerald-400 text-[11px] font-semibold mb-1">
                    {formatDailyProtectionPrice(valorAnual)}
                  </p>
                  <p className="text-slate-600 text-[10px] mb-4">Equipamentos de rastreamento vendidos à parte</p>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAssinar(plan.id, 'mensal');
                      }}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-white text-xs font-bold cursor-pointer hover:border-white/20"
                    >
                      MENSAL
                      <span className="block text-[10px] font-normal text-slate-400">{formatPlanPrice(mensalidade)}/mes</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAssinar(plan.id, 'anual');
                      }}
                      className={`rounded-xl px-3 py-3 text-xs font-bold cursor-pointer ${
                        plan.popular
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] shadow-lg shadow-amber-500/20'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222]'
                      }`}
                    >
                      ANUAL
                      <span className="block text-[10px] font-normal opacity-80">{formatPlanPrice(valorAnual)}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Indique e Ganhe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-6"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span className="text-[#0c1222] font-bold text-sm tracking-wide">INDIQUE E GANHE R$</span>
          </motion.button>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5 mb-8"
        >
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="flex items-center gap-2 mb-3 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-bold text-sm">Perguntas Frequentes</h3>
          </button>

          {showFaq && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">Como funciona a Recuperação Assistida?</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A Recuperação Assistida opera em duas frentes integradas: Acionamento imediato das forças de segurança competentes, com compartilhamento do link de rastreamento em tempo real para apoio operacional da Guarda Municipal e Polícia Militar; Atuação da equipe própria de recuperação, responsável pelo acompanhamento estratégico da ocorrência e suporte nas ações de localização e recuperação do bem.
                </p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">Posso cancelar a qualquer momento?</p>
                <p className="text-slate-400 text-xs leading-relaxed">Sim. No pagamento mensal, as cobrancas futuras podem ser canceladas. No pagamento anual, a protecao permanece valida pelo periodo ja contratado.</p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">Os equipamentos de rastreamento estão incluídos no plano?</p>
                <p className="text-slate-400 text-xs leading-relaxed">Nao. O valor do plano se refere ao servico Bike Segura BC, com opcao de cobranca mensal ou pagamento do ano completo. TAG e Rastreador GPS 4G sao cobrados a parte.</p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">O que é Ativar Proteção com geocerca?</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  É um modo antifurto para equipamentos com GPS. Ao ativar, o app cria uma área protegida temporária ao redor da bike. Se ela sair dessa área por tempo suficiente, o proprietário recebe alerta de movimentação no aplicativo. Por depender de localização GPS, esse recurso está nos planos Ouro e Diamante.
                </p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">O que é o ACT?</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  ACT significa Acordo de Cooperação Técnica. É o protocolo que ativa a Guarda Municipal e a Polícia Militar repassando em tempo real o link de rastreamento do equipamento.
                </p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">A TAG funciona em qualquer smartphone?</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Sim! A TAG é compatível com dispositivos iOS (Apple) e Android. Basta ter o Bluetooth ativado.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>

      <BottomNav />
    </div>
  );
}
