import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, ChevronDown, ChevronUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatDailyProtectionPrice,
  formatPlanPrice,
  getMonthlyPlanPrice,
  usePlanPrices,
} from '../hooks/usePlanPrices';

const FAQS = [
  {
    pergunta: 'Como cadastrar minha bicicleta?',
    resposta: 'Acesse o menu "Cadastrar Novo" na tela inicial. Preencha os dados do equipamento (marca, modelo, cor, número de série), adicione fotos e informe o tipo de rastreamento desejado.',
  },
  {
    pergunta: 'O que fazer em caso de furto ou roubo?',
    resposta: 'Toque no botão vermelho "Emitir Alerta de Furto" na tela inicial. Selecione o equipamento furtado e envie o alerta pelo WhatsApp. Nossa equipe responderá com instruções e acionará as forças de segurança.',
  },
  {
    pergunta: 'Como funciona a Recuperação Assistida?',
    resposta: 'A Recuperação Assistida opera em duas frentes: acionamento imediato das forças de segurança (Guarda Municipal e Polícia Militar) com compartilhamento do link de rastreamento, e atuação da nossa equipe própria de recuperação com acompanhamento estratégico.',
  },
  {
    pergunta: 'Quais são os planos disponíveis?',
    resposta: 'Consulte os valores atualizados dos planos.',
  },
  {
    pergunta: 'Posso cancelar minha assinatura?',
    resposta: 'Sim. No pagamento mensal, as cobrancas futuras podem ser canceladas. No pagamento anual, a protecao permanece valida pelo periodo contratado.',
  },
  {
    pergunta: 'Como funciona o sistema de indicações?',
    resposta: 'Cada amigo que indicar e contratar o Bike Segura BC te dá 10% de desconto no próximo plano. O desconto é cumulativo até 100%. Após usar, a contagem zera e recomeça.',
  },
  {
    pergunta: 'O equipamento de rastreamento está incluído no plano?',
    resposta: 'Nao. O valor do plano se refere ao servico, com pagamento mensal ou do ano completo. TAG e Rastreador GPS 4G sao cobrados a parte.',
  },
  {
    pergunta: 'Como anunciar meu equipamento para venda?',
    resposta: 'Acesse "Anuncie Aqui" no menu. Você só pode anunciar equipamentos já cadastrados no app. Preencha o preço, condição e descrição para publicar.',
  },
];

export default function AjudaSuporte() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { prices } = usePlanPrices();
  const whatsappNumber = '5547992458380';
  const resumoPlano = (nome: string, valorAnual: number) => (
    `${nome}: ${formatPlanPrice(getMonthlyPlanPrice(valorAnual))}/mes ou ${formatPlanPrice(valorAnual)}/ano (${formatDailyProtectionPrice(valorAnual)})`
  );
  const faqs = FAQS.map((faq, index) => index === 3 ? {
    ...faq,
    resposta: `Valores: ${resumoPlano('Bronze', prices.bronze)}, ${resumoPlano('Prata', prices.prata)}, ${resumoPlano('Ouro', prices.ouro)} e ${resumoPlano('Diamante', prices.diamante)}.`,
  } : faq);

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-8">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Link to="/perfil" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Ajuda e Suporte</h1>
            <p className="text-xs text-slate-400"> Tire suas dúvidas </p>
          </div>
        </motion.header>

        {/* Contact Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 mb-6">
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="glass-card p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-emerald-400/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">WhatsApp</p>
              <p className="text-slate-500 text-[10px]">Resposta rápida</p>
            </div>
          </a>
          <div className="glass-card p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Atendimento</p>
              <p className="text-slate-500 text-[10px]">Seg-Sex 8h-18h</p>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-amber-400 font-bold text-sm mb-3">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-white text-sm flex-1 pr-3">{faq.pergunta}</span>
                  {openIndex === i ? (
                    <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <p className="text-slate-400 text-xs leading-relaxed">{faq.resposta}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 mb-8"
        >
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm tracking-wide">FALAR NO WHATSAPP</span>
          </a>
        </motion.div>

      </div>
    </div>
  );
}
