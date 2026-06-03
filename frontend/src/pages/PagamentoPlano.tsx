import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, Copy, QrCode, CreditCard, FileText,
  Shield, Award, Medal, Crown, Gem, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../config/api';

const planosConfig = {
  bronze: { name: 'Bronze', price: 50, icon: Award, color: 'text-amber-600', bg: 'bg-amber-500/10', desc: 'Protecao basica' },
  prata: { name: 'Prata', price: 150, icon: Medal, color: 'text-slate-300', bg: 'bg-slate-400/10', desc: 'TAG iOS ou Android' },
  ouro: { name: 'Ouro', price: 300, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'Rastreador GPS 4G' },
  diamante: { name: 'Diamante', price: 450, icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'TAG + Rastreador GPS 4G' },
};

export default function PagamentoPlano() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useAuth();

  const planoId = searchParams.get('plano') || 'bronze';
  const plano = planosConfig[planoId as keyof typeof planosConfig] || planosConfig.bronze;

  const [metodo, setMetodo] = useState<'pix' | 'boleto' | 'cartao'>('pix');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCriarCobranca = async () => {
    if (!isLoggedIn || !token) {
      setError('Faca login para continuar com o pagamento.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/pagamentos/criar-minha-cobranca', {
        plano: planoId,
        valor: plano.price,
        metodoPagamento: metodo,
      }, token);
      setResultado(res.pagamento);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar cobranca. Tente novamente.');
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
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/planos')} className="w-10 h-10 rounded-xl glass-card flex items-center justify-center shrink-0 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-amber-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Pagamento</h1>
            <p className="text-xs text-slate-400">Finalize sua assinatura</p>
          </div>
        </motion.header>

        {/* Plano selecionado */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${plano.bg} flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${plano.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${plano.color}`}>{plano.name}</h2>
              <p className="text-slate-400 text-xs">{plano.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-bold">R${plano.price}</p>
              <p className="text-slate-500 text-xs">/ano</p>
            </div>
          </div>
        </motion.div>

        {/* Metodo de pagamento */}
        {!resultado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">Forma de pagamento</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'pix', label: 'PIX', icon: QrCode },
                { id: 'boleto', label: 'Boleto', icon: FileText },
                { id: 'cartao', label: 'Cartao', icon: CreditCard },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id as any)}
                  className={`glass-card p-3 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    metodo === m.id ? 'border-amber-400/50 bg-amber-400/5' : 'border-white/5'
                  }`}
                >
                  <m.icon className={`w-5 h-5 ${metodo === m.id ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-medium ${metodo === m.id ? 'text-amber-400' : 'text-slate-400'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-red-500/20 p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            {!isLoggedIn && (
              <button onClick={() => navigate('/login')} className="mt-2 text-amber-400 text-xs font-bold hover:underline cursor-pointer">
                Fazer login
              </button>
            )}
          </motion.div>
        )}

        {/* Resultado - cobranca criada */}
        {resultado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Sucesso */}
            <div className="glass-card border-emerald-500/20 p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Cobranca criada!</h3>
              <p className="text-slate-400 text-xs">Efetue o pagamento para ativar seu plano.</p>
            </div>

            {/* PIX QR Code */}
            {metodo === 'pix' && resultado.pixQrCode && (
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

            {/* Boleto */}
            {metodo === 'boleto' && resultado.boletoUrl && (
              <div className="glass-card p-5 text-center">
                <h4 className="text-white font-semibold text-sm mb-3">Boleto Bancario</h4>
                <a href={resultado.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-[#0c1222] font-bold text-sm cursor-pointer">
                  <FileText className="w-4 h-4" /> Visualizar Boleto
                </a>
              </div>
            )}

            {/* Cartao */}
            {metodo === 'cartao' && resultado.linkPagamento && (
              <div className="glass-card p-5 text-center">
                <h4 className="text-white font-semibold text-sm mb-3">Cartao de Credito</h4>
                <a href={resultado.linkPagamento} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 text-[#0c1222] font-bold text-sm cursor-pointer">
                  <CreditCard className="w-4 h-4" /> Pagar com Cartao
                </a>
              </div>
            )}

            {/* Link geral */}
            {resultado.linkPagamento && (
              <div className="glass-card p-4 text-center">
                <p className="text-slate-400 text-xs mb-2">Ou acesse o link de pagamento:</p>
                <a href={resultado.linkPagamento} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-xs hover:underline break-all">
                  {resultado.linkPagamento}
                </a>
              </div>
            )}

            {/* Info */}
            <div className="glass-card p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  Assim que o pagamento for confirmado, seu plano sera ativado automaticamente.
                  Voce recebera uma notificacao e podera aproveitar todos os recursos do Bike Segura BC.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm cursor-pointer"
            >
              VOLTAR PARA O INICIO
            </button>
          </motion.div>
        )}

        {/* Botao pagar */}
        {!resultado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              onClick={handleCriarCobranca}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#0c1222] font-bold text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando cobranca...</> : `PAGAR R$${plano.price},00`}
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
