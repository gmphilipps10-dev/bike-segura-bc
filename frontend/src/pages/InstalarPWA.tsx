import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, QrCode, CheckCircle, Smartphone, Shield, MapPin,
  Radio, Eye, Bike, AlertTriangle, ChevronRight
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/* ===== Dados ===== */
const beneficios = [
  {
    icon: Shield,
    title: 'Protecao Completa',
    desc: 'Cadastre sua bike com fotos, numero de serie e caracteristicas. Seu equipamento protegido 24h.'
  },
  {
    icon: QrCode,
    title: 'QR Code Identificador',
    desc: 'Cada bike recebe um adesivo QR Code unico. Quem encontrar sua bike, acessa os dados de contato instantaneamente.'
  },
  {
    icon: AlertTriangle,
    title: 'Alerta de Furto',
    desc: 'Marque sua bike como furtada em segundos. O alerta e ativado imediatamente para toda a comunidade.'
  },
  {
    icon: Eye,
    title: 'Consulta Publica',
    desc: 'Qualquer pessoa que escanear o QR Code da sua bike pode ver se ela esta registrada como furtada e ajudar na recuperacao.'
  },
  {
    icon: MapPin,
    title: 'Rastreamento',
    desc: 'Integre com TAGs e rastreadores GPS. Acompanhe a localizacao do seu equipamento em tempo real.'
  },
  {
    icon: Radio,
    title: 'Comunidade Ativa',
    desc: 'Participe de uma rede de ciclistas que se protegem mutuamente. Juntos, somos mais fortes contra os furtos.'
  }
];

export default function InstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSHelp(true); return; }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const installUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/instalar`
    : 'https://www.bikesegurabc.com.br/instalar';

  // Se ja instalado
  if (isInstalled) {
    return (
      <div className="min-h-screen bg-[#0c1222] relative flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">App Instalado!</h2>
          <p className="text-slate-400 text-sm">O Bike Segura BC ja esta no seu dispositivo.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">

      {/* ===== VERSAO DIGITAL (tela) ===== */}
      <div className="print:hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-8">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="w-24 h-24 rounded-2xl object-cover shadow-xl shadow-amber-500/20 mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white leading-tight">
              PROTEJA SUA <span className="text-amber-400">BIKE</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2">A unica plataforma de protecao e rastreamento de bicicletas de <span className="text-amber-400 font-semibold">Balneario Camboriu</span></p>
          </motion.div>

          {/* Pergunta + Botao */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-6 text-center mb-6 border border-amber-400/20">
            <p className="text-white/90 text-lg leading-relaxed mb-5" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
              Quer instalar Bike Segura BC na sua area de trabalho?
            </p>
            <button onClick={handleInstall}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 cursor-pointer">
              <Download className="w-5 h-5 text-[#0c1222]" />
              <span className="text-[#0c1222] font-bold text-sm tracking-wide">
                {isIOS ? 'VER COMO INSTALAR' : 'INSTALAR AGORA'}
              </span>
            </button>
            {!deferredPrompt && !isIOS && (
              <p className="text-slate-500 text-[10px] mt-3">Use o menu do navegador &gt; "Instalar app" se o botao nao funcionar</p>
            )}
          </motion.div>

          {/* QR Code */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-5 text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-amber-400" />
              <p className="text-amber-400 font-bold text-xs tracking-wider">ESCANEIE PARA INSTALAR</p>
            </div>
            <div className="bg-white rounded-xl p-3 inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(installUrl)}`}
                alt="QR Code" className="w-36 h-36" />
            </div>
            <p className="text-slate-500 text-[10px] mt-2 font-mono">{installUrl}</p>
          </motion.div>

          {/* iOS Help */}
          {showIOSHelp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="glass-card p-5 mb-6 border border-amber-400/20">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <p className="text-amber-400 font-bold text-xs">INSTALAR NO iPhone/iPad</p>
              </div>
              <ol className="text-slate-300 text-xs space-y-2 list-decimal list-inside">
                <li>Toque em <strong className="text-white">Compartilhar</strong> no Safari</li>
                <li>Toque em <strong className="text-white">"Adicionar a Tela de Inicio"</strong></li>
                <li>Toque em <strong className="text-white">"Adicionar"</strong></li>
              </ol>
            </motion.div>
          )}

          {/* Beneficios */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <p className="text-amber-400 font-bold text-xs tracking-wider">POR QUE USAR?</p>
            </div>
            <div className="space-y-2">
              {beneficios.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="glass-card p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">{b.title}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Botao Imprimir Cartaz */}
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={() => window.print()}
            className="w-full mt-6 py-3 rounded-xl glass-card border border-white/10 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.06]">
            <Download className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-xs tracking-wide">IMPRIMIR CARTAZ</span>
          </motion.button>

          <p className="text-slate-600 text-[10px] text-center mt-4">www.bikesegurabc.com.br</p>
        </div>
      </div>

      {/* ===== VERSAO CARTAZ (apenas print) ===== */}
      <div className="hidden print:block">
        <div className="cartaz-page">

          {/* Topo: Logo + Slogan */}
          <div className="cartaz-header">
            <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="cartaz-logo" />
            <div className="cartaz-titulo">
              <h1>BIKE SEGURA BC</h1>
              <p className="cartaz-slogan">Sua bike protegida!</p>
            </div>
          </div>

          {/* Headline */}
          <div className="cartaz-headline">
            <h2>NAO DEIXE SUA BIKE<br/>NA MAO DE LADROES!</h2>
            <p className="cartaz-sub">A unica plataforma de <strong>protecao e rastreamento</strong> de bicicletas<br/>de <strong>Balneario Camboriu</strong> e regiao.</p>
          </div>

          {/* Beneficios em grid */}
          <div className="cartaz-beneficios">
            {beneficios.slice(0, 4).map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="cartaz-beneficio-item">
                  <div className="cartaz-beneficio-icon">
                    <Icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="cartaz-beneficio-titulo">{b.title}</p>
                  <p className="cartaz-beneficio-desc">{b.desc}</p>
                </div>
              );
            })}
          </div>

          {/* QR Code em destaque */}
          <div className="cartaz-qr-section">
            <div className="cartaz-qr-box">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(installUrl)}`}
                alt="QR Code" className="cartaz-qr-img" />
            </div>
            <div className="cartaz-qr-texto">
              <p className="cartaz-qr-chamada">BAIXE O APP AGORA!</p>
              <p className="cartaz-qr-instrucao">Aponte a camera do seu celular<br/>para o QR Code e instale o app.</p>
              <div className="cartaz-qr-passo">
                <span>1</span> Escaneie o QR Code
              </div>
              <div className="cartaz-qr-passo">
                <span>2</span> Toque em "Instalar"
              </div>
              <div className="cartaz-qr-passo">
                <span>3</span> Proteja sua bike!
              </div>
            </div>
          </div>

          {/* Rodape */}
          <div className="cartaz-footer">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-500" />
              <span className="font-bold">www.bikesegurabc.com.br</span>
            </div>
            <p>Proteja o que e seu. Cadastre sua bike hoje mesmo.</p>
          </div>

        </div>
      </div>

      <style>{`
        /* ===== ESTILOS DO CARTAZ (apenas impressao) ===== */
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; color: #000 !important; }
        }

        .cartaz-page {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .cartaz-header {
          display: flex;
          align-items: center;
          gap: 4mm;
          margin-bottom: 6mm;
          padding-bottom: 4mm;
          border-bottom: 2px solid #d4a017;
        }

        .cartaz-logo {
          width: 18mm;
          height: 18mm;
          border-radius: 3mm;
          object-fit: cover;
        }

        .cartaz-titulo h1 {
          font-size: 16pt;
          font-weight: 900;
          color: #000;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .cartaz-slogan {
          font-size: 9pt;
          color: #d4a017;
          font-weight: 700;
          margin: 0;
          margin-top: 1mm;
        }

        .cartaz-headline {
          text-align: center;
          margin-bottom: 8mm;
        }

        .cartaz-headline h2 {
          font-size: 28pt;
          font-weight: 900;
          color: #000;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .cartaz-headline h2::after {
          content: '';
          display: block;
          width: 40mm;
          height: 2px;
          background: #d4a017;
          margin: 3mm auto;
        }

        .cartaz-sub {
          font-size: 11pt;
          color: #444;
          margin: 0;
          line-height: 1.5;
        }

        .cartaz-sub strong {
          color: #000;
        }

        .cartaz-beneficios {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          margin-bottom: 8mm;
        }

        .cartaz-beneficio-item {
          border: 1px solid #e5e5e5;
          border-radius: 3mm;
          padding: 4mm;
          text-align: center;
        }

        .cartaz-beneficio-icon {
          width: 10mm;
          height: 10mm;
          border-radius: 2mm;
          background: rgba(212, 160, 23, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2mm;
        }

        .cartaz-beneficio-titulo {
          font-size: 9pt;
          font-weight: 800;
          color: #000;
          margin: 0 0 1mm;
        }

        .cartaz-beneficio-desc {
          font-size: 7.5pt;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }

        .cartaz-qr-section {
          display: flex;
          align-items: center;
          gap: 8mm;
          background: linear-gradient(135deg, #0c1222 0%, #1a2332 100%);
          border-radius: 4mm;
          padding: 8mm;
          margin-bottom: 6mm;
          color: #fff;
        }

        .cartaz-qr-box {
          background: #fff;
          border-radius: 3mm;
          padding: 3mm;
          flex-shrink: 0;
        }

        .cartaz-qr-img {
          width: 45mm;
          height: 45mm;
        }

        .cartaz-qr-texto {
          flex: 1;
        }

        .cartaz-qr-chamada {
          font-size: 18pt;
          font-weight: 900;
          color: #fbbf24;
          margin: 0 0 3mm;
          letter-spacing: 0.5px;
        }

        .cartaz-qr-instrucao {
          font-size: 10pt;
          color: #cbd5e1;
          margin: 0 0 4mm;
          line-height: 1.4;
        }

        .cartaz-qr-passo {
          display: flex;
          align-items: center;
          gap: 2mm;
          font-size: 9pt;
          color: #fff;
          margin-bottom: 2mm;
        }

        .cartaz-qr-passo span {
          width: 6mm;
          height: 6mm;
          border-radius: 50%;
          background: #fbbf24;
          color: #0c1222;
          font-weight: 800;
          font-size: 8pt;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cartaz-footer {
          margin-top: auto;
          text-align: center;
          padding-top: 4mm;
          border-top: 1px solid #e5e5e5;
        }

        .cartaz-footer div {
          justify-content: center;
          font-size: 10pt;
          color: #d4a017;
          margin-bottom: 1mm;
        }

        .cartaz-footer p {
          font-size: 8pt;
          color: #888;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
