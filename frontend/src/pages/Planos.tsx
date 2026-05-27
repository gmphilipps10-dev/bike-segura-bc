import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, Shield, Crown, Gem, Medal,
  HelpCircle, Bike
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const plans = [
  {
    id: 'prata',
    name: 'Prata',
    subtitle: 'TAG (iOS ou Android)',
    icon: Medal,
    price: 'R$ 150,00',
    period: '/ano',
    color: 'from-slate-400 to-slate-500',
    borderColor: 'border-slate-400/30',
    popular: false,
    features: [
      'Acesso ao App Bike Segura BC',
      'Suporte via WhatsApp',
      'Botão de alerta de furto',
      'Acionamento via ACT (Acordo de Cooperação Técnica)',
      'Instalação de TAG (iOS ou Android)',
    ],
  },
  {
    id: 'ouro',
    name: 'Ouro',
    subtitle: 'Rastreador GPS 4G',
    icon: Crown,
    price: 'R$ 300,00',
    period: '/ano',
    color: 'from-amber-400 to-yellow-500',
    borderColor: 'border-amber-400/50',
    popular: true,
    features: [
      'Acesso ao App Bike Segura BC',
      'Suporte via WhatsApp',
      'Botão de alerta de furto',
      'Acionamento via ACT (Acordo de Cooperação Técnica)',
      'Instalação de rastreador GPS 4G',
    ],
  },
  {
    id: 'diamante',
    name: 'Diamante',
    subtitle: 'TAG + Rastreador GPS 4G',
    icon: Gem,
    price: 'R$ 450,00',
    period: '/ano',
    color: 'from-blue-400 to-cyan-400',
    borderColor: 'border-blue-400/30',
    popular: false,
    features: [
      'Acesso ao App Bike Segura BC',
      'Suporte via WhatsApp',
      'Botão de alerta de furto',
      'Acionamento das forças de segurança via ACT',
      'Instalação de TAG (iOS ou Android) + rastreador GPS 4G',
    ],
  },
];

export default function Planos() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);

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

        {/* Plans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3 mb-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;

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
                  <div className="mb-1">
                    <span className={`text-3xl font-bold ${plan.popular ? 'text-gradient-gold' : 'text-white'}`}>{plan.price}</span>
                    <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                  </div>
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
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm tracking-wide cursor-pointer transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] shadow-lg shadow-amber-500/20'
                        : 'glass-card text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {plan.popular ? 'ASSINAR AGORA' : 'ESCOLHER PLANO'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Select Bike Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bike className="w-4 h-4 text-amber-400" />
            <h3 className="text-amber-400 font-bold text-sm">Selecione a bike para proteger</h3>
          </div>
          <p className="text-slate-500 text-xs mb-4">Escolha qual equipamento deseja vincular ao plano</p>
          <Link to="/cadastrar">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm cursor-pointer shadow-lg shadow-amber-500/20"
            >
              CADASTRAR BIKE
            </motion.button>
          </Link>
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
                <p className="text-slate-400 text-xs leading-relaxed">Sim. O cancelamento pode ser solicitado a qualquer momento, sem burocracia. Como os planos são anuais, não realizamos reembolso do valor proporcional do período restante.</p>
              </div>
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">Os equipamentos de rastreamento estão incluídos no plano?</p>
                <p className="text-slate-400 text-xs leading-relaxed">Não. O valor do plano é referente à assinatura anual do serviço Bike Segura BC. Os equipamentos de rastreamento (TAG e/ou Rastreador GPS 4G) são cobrados à parte e passam a ser de propriedade do usuário. Não realizamos compra de equipamentos usados.</p>
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
