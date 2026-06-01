import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Eye, Lock, Database, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: FileText,
    title: 'Termos de Uso',
    content: `O Bike Segura BC é um serviço de proteção e rastreamento de equipamentos autopropelidos (bicicletas, patinetes, entre outros) operado em Balneário Camboriú/SC.

Ao utilizar o aplicativo, você concorda em:
• Fornecer informações verdadeiras e atualizadas
• Manter seus dados de contato atualizados
• Utilizar o serviço apenas para fins lícitos
• Não compartilhar sua senha ou dados de acesso
• Respeitar as diretrizes da comunidade

O serviço é oferecido sem garantia de recuperação do equipamento, embora trabalhemos ativamente para auxiliar nesse processo.`
  },
  {
    icon: Shield,
    title: 'Política de Privacidade',
    content: `Coletamos apenas os dados necessários para o funcionamento do serviço:
• Dados pessoais: nome, e-mail, telefone, CPF
• Dados do equipamento: fotos, número de série, marca, modelo
• Localização: para rastreamento em tempo real (quando ativado)

Seus dados são:
• Armazenados de forma segura
• Nunca vendidos a terceiros
• Compartilhados apenas com forças de segurança em caso de furto/roubo
• Utilizados para acionamento do protocolo de Recuperação Assistida`
  },
  {
    icon: Eye,
    title: 'Uso de Dados',
    content: `Utilizamos seus dados para:
• Cadastro e identificação de equipamentos
• Acionamento das forças de segurança em caso de furto
• Contato da equipe de Recuperação Assistida
• Comunicação sobre status de ocorrências
• Melhorias no serviço

Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato pelo WhatsApp do Bike Segura BC.`
  },
  {
    icon: Lock,
    title: 'Segurança',
    content: `Adotamos medidas de segurança para proteger seus dados:
• Criptografia de dados sensíveis
• Acesso restrito a equipe autorizada
• Monitoramento contínuo de atividades suspeitas
• Backups regulares

Recomendamos que você mantenha seu app atualizado e utilize senhas fortes.`
  },
  {
    icon: Database,
    title: 'Retenção de Dados',
    content: `Mantemos seus dados pelo período necessário para:
• Prestação do serviço contratado
• Cumprimento de obrigações legais
• Resolução de disputas

Após o cancelamento da conta, seus dados pessoais são anonimizados em até 90 dias, exceto quando houver obrigação legal de retenção.`
  },
  {
    icon: Share2,
    title: 'Compartilhamento',
    content: `Compartilhamos dados apenas com:
• Guarda Municipal de Balneário Camboriú
• Polícia Militar de Santa Catarina
• Equipe própria de Recuperação Assistida

Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing.`
  },
];

export default function TermosPoliticas() {
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
            <h1 className="text-xl font-bold text-white">Termos e Políticas</h1>
            <p className="text-xs text-slate-400">Última atualização: Maio 2025</p>
          </div>
        </motion.header>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-500/20 flex items-center justify-center shrink-0">
                  <section.icon className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-amber-400 font-bold text-sm">{section.title}</h2>
              </div>
              <div className="text-slate-400 text-xs leading-relaxed whitespace-pre-line pl-0.5">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center pb-4"
        >
          <p className="text-slate-600 text-[10px]">
            Dúvidas? Entre em contato pelo WhatsApp +55 47 99245-8380
          </p>
        </motion.div>

      </div>
    </div>
  );
}
