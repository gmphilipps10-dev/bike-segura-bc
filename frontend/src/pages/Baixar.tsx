import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Smartphone, Monitor, Share2, ChevronRight, Shield,
  QrCode, Eye, Radio, MapPin
} from 'lucide-react';
import './Baixar.print.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BENEFICIOS = [
  { icon: Shield, titulo: 'Protecao Total', desc: 'Cadastro completo com fotos e QR Code identificador.' },
  { icon: Eye, titulo: 'Alerta de Furto', desc: 'A comunidade e alertada assim que voce reportar.' },
  { icon: Radio, titulo: 'Rastreamento', desc: 'Integracao com TAGs e GPS em tempo real.' },
  { icon: MapPin, titulo: 'Consulta Publica', desc: 'Qualquer pessoa pode verificar uma bike escaneando o QR.' },
];

export default function Baixar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setDeferredPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) return;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  // QR Code do cartaz aponta para esta mesma pagina /baixar
  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/baixar`
    : 'https://www.bikesegurabc.com.br/baixar';

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">App Instalado!</h2>
          <p className="text-slate-400 text-sm">O Bike Segura BC ja esta no seu dispositivo.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ============================================================
          VERSAO DIGITAL (tela)
          ============================================================ */}
      <div className="screen-only min-h-screen bg-[#0c1222] text-white overflow-x-hidden">

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1222] via-[#1a1500] to-[#0c1222]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-10 text-center">

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-xl shadow-amber-500/20" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black leading-[1.05] mb-4">
              BAIXE O APP E<br />
              <span className="text-amber-400">PROTEJA SUA BIKE</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-slate-300 text-base mb-8 max-w-sm mx-auto">
              A unica plataforma de protecao e rastreamento de bicicletas de <strong className="text-white">Balneario Camboriu</strong>.
            </motion.p>

            {/* Botao Principal */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <button onClick={handleInstall}
                className="w-full max-w-sm mx-auto py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-400/20 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform">
                <Download className="w-6 h-6" />
                BAIXE AGORA!
              </button>

              {!deferredPrompt && !isIOS && (
                <p className="text-slate-500 text-xs mt-3">
                  Toque no botao acima para instalar diretamente no seu dispositivo.
                </p>
              )}
            </motion.div>

            {/* Dispositivos */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-6 mt-6 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span>Celular</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span>Computador</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* COMO INSTALAR */}
        <section className="py-10 bg-black/30">
          <div className="max-w-lg mx-auto px-6">
            <h2 className="text-center text-amber-400 font-bold text-xs tracking-widest uppercase mb-6">Como Instalar</h2>

            {isIOS ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card p-5 border border-amber-400/20">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <p className="text-white font-bold text-sm">iPhone / iPad</p>
                </div>
                <ol className="text-slate-300 text-sm space-y-3 list-decimal list-inside">
                  <li>Toque no botao <strong className="text-white">Compartilhar</strong> no Safari</li>
                  <li>Toque em <strong className="text-white">&quot;Adicionar a Tela de Inicio&quot;</strong></li>
                  <li>Toque em <strong className="text-white">&quot;Adicionar&quot;</strong> no canto superior direito</li>
                </ol>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Download, passo: 'Toque no botao "BAIXE AGORA!" acima' },
                  { icon: ChevronRight, passo: 'Toque em "Instalar" ou "Adicionar a tela inicial"' },
                  { icon: Shield, passo: 'Pronto! Sua bike agora esta protegida' },
                ].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3 glass-card p-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-slate-300 text-sm">{p.passo}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="py-10">
          <div className="max-w-lg mx-auto px-6">
            <h2 className="text-center text-amber-400 font-bold text-xs tracking-widest uppercase mb-6">Por que usar?</h2>
            <div className="grid grid-cols-2 gap-3">
              {BENEFICIOS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                    className="glass-card p-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-white text-xs font-bold mb-1">{b.titulo}</p>
                    <p className="text-slate-400 text-[10px] leading-relaxed">{b.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-12 bg-gradient-to-t from-amber-400/5 to-transparent">
          <div className="max-w-lg mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                NAO ESPERE ACONTECER.<br />
                <span className="text-amber-400">INSTALE AGORA.</span>
              </h2>
              <button onClick={handleInstall}
                className="w-full max-w-sm mx-auto py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-400/20 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform mt-6">
                <Download className="w-6 h-6" />
                BAIXE AGORA!
              </button>
            </motion.div>
          </div>
        </section>

        {/* Rodape */}
        <footer className="border-t border-white/5 py-6 bg-[#0a0f1a]">
          <div className="max-w-lg mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img src="/logo-oficial.jpg" alt="" className="w-5 h-5 rounded" />
              <span className="text-white font-bold text-xs">BIKE SEGURA BC</span>
            </div>
            <p className="text-slate-600 text-[10px]">www.bikesegurabc.com.br | Balneario Camboriu - SC</p>
          </div>
        </footer>
      </div>

      {/* ============================================================
          VERSAO CARTAZ (apenas print)
          ============================================================ */}
      <div className="print-only">
        <div className="ctz-container">

          {/* Faixa degrade topo */}
          <div className="ctz-top-stripe" />

          {/* Cabecalho */}
          <div className="ctz-header">
            <div className="ctz-header-left">
              <img src="/logo-oficial.jpg" alt="" className="ctz-header-logo" />
              <div>
                <p className="ctz-header-brand">BIKE SEGURA BC</p>
                <p className="ctz-header-tagline">Protecao e rastreamento de bicicletas</p>
              </div>
            </div>
            <div className="ctz-header-right">
              <p className="ctz-header-url">www.bikesegurabc.com.br</p>
            </div>
          </div>

          {/* Hero / Headline */}
          <div className="ctz-hero">
            <h2 className="ctz-hero-headline">
              SUA BIKE<br />
              <span>PROTEGIDA 24H</span>
            </h2>
            <div className="ctz-hero-line" />
            <p className="ctz-hero-sub">
              Ate <strong>70%</strong> das bikes furtadas <strong>NUNCA</strong> sao recuperadas.<br />
              Em Balneario Camboriu, a gente muda esse numero.
            </p>
          </div>

          {/* Estatisticas */}
          <div className="ctz-stats-bar">
            <div className="ctz-stat-item">
              <p className="ctz-stat-num">70%</p>
              <p className="ctz-stat-label">Nao recuperadas</p>
            </div>
            <div className="ctz-stat-item">
              <p className="ctz-stat-num">100%</p>
              <p className="ctz-stat-label">Protecao QR Code</p>
            </div>
            <div className="ctz-stat-item">
              <p className="ctz-stat-num">24h</p>
              <p className="ctz-stat-label">Monitoramento</p>
            </div>
            <div className="ctz-stat-item">
              <p className="ctz-stat-num">R$0</p>
              <p className="ctz-stat-label">Para comecar</p>
            </div>
          </div>

          {/* QR Code Destaque */}
          <div className="ctz-qr-section">
            <div className="ctz-qr-wrapper">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pageUrl)}`}
                alt="QR Code" className="ctz-qr-img" />
            </div>
            <div className="ctz-qr-content">
              <p className="ctz-qr-cta">BAIXE O APP<br />AGORA!</p>
              <p className="ctz-qr-sub">Aponte a camera do celular para o QR Code e instale o app em segundos.</p>
              <div className="ctz-steps">
                <div className="ctz-step">
                  <span className="ctz-step-num">1</span> Escaneie o QR Code
                </div>
                <div className="ctz-step">
                  <span className="ctz-step-num">2</span> Toque em &quot;Instalar&quot;
                </div>
                <div className="ctz-step">
                  <span className="ctz-step-num">3</span> Proteja sua bike!
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="ctz-benefits">
            <div className="ctz-benefit">
              <div className="ctz-benefit-icon">
                <Shield style={{width:'4.5mm', height:'4.5mm'}} />
              </div>
              <div className="ctz-benefit-text">
                <h4>Alerta de Furto</h4>
                <p>A comunidade e alertada imediatamente quando voce reportar.</p>
              </div>
            </div>
            <div className="ctz-benefit">
              <div className="ctz-benefit-icon">
                <QrCode style={{width:'4.5mm', height:'4.5mm'}} />
              </div>
              <div className="ctz-benefit-text">
                <h4>QR Code Unico</h4>
                <p>Cada bike recebe um adesivo identificador exclusivo.</p>
              </div>
            </div>
            <div className="ctz-benefit">
              <div className="ctz-benefit-icon">
                <Radio style={{width:'4.5mm', height:'4.5mm'}} />
              </div>
              <div className="ctz-benefit-text">
                <h4>Rastreamento GPS</h4>
                <p>Acompanhe a localizacao da sua bike em tempo real.</p>
              </div>
            </div>
            <div className="ctz-benefit">
              <div className="ctz-benefit-icon">
                <Eye style={{width:'4.5mm', height:'4.5mm'}} />
              </div>
              <div className="ctz-benefit-text">
                <h4>Consulta Publica</h4>
                <p>Qualquer pessoa pode verificar uma bike pelo QR Code.</p>
              </div>
            </div>
          </div>

          {/* Banner Urgencia */}
          <div className="ctz-urgency">
            <p>NAO DEIXE SUA BIKE NA MAO DE LADROES — PROTEJA AGORA!</p>
          </div>

          {/* Rodape */}
          <div className="ctz-footer">
            <div className="ctz-footer-left">
              <img src="/logo-oficial.jpg" alt="" className="ctz-footer-logo" />
              <span className="ctz-footer-brand">BIKE SEGURA BC</span>
            </div>
            <span className="ctz-footer-url">www.bikesegurabc.com.br</span>
          </div>

        </div>
      </div>
    </>
  );
}
