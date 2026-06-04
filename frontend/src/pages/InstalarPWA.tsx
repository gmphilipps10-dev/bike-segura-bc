import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, QrCode, CheckCircle, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // Detecta se ja esta instalado
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    // Detecta iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detecta quando o app eh instalado
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
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // URL para o QR Code de instalacao
  const installUrl = `${window.location.origin}/instalar`;

  // Se ja estiver instalado
  if (isInstalled) {
    return (
      <div className="min-h-screen bg-[#0c1222] relative flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">App Instalado!</h2>
          <p className="text-slate-400 text-sm">
            O Bike Segura BC ja esta instalado no seu dispositivo.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1222] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/bg-pattern.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-[#0c1222]/95 to-[#0c1222]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-8 flex flex-col items-center min-h-screen">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img
            src="/logo-oficial.jpg"
            alt="Bike Segura BC"
            className="w-20 h-20 rounded-2xl object-cover shadow-xl shadow-amber-500/20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gradient-gold">BIKE SEGURA BC</h1>
          <p className="text-slate-400 text-xs mt-1">Protecao Completa para Sua Bike</p>
        </motion.div>

        {/* Pergunta Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 w-full text-center mb-6 border border-amber-400/20"
        >
          <h2
            className="text-white text-lg md:text-xl leading-relaxed mb-4"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
          >
            Quer instalar Bike Segura BC na sua area de trabalho?
          </h2>

          <button
            onClick={handleInstall}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Download className="w-5 h-5 text-[#0c1222]" />
            <span className="text-[#0c1222] font-bold text-sm tracking-wide">
              {isIOS ? 'VER COMO INSTALAR' : 'INSTALAR AGORA'}
            </span>
          </button>

          {!deferredPrompt && !isIOS && (
            <p className="text-slate-500 text-[10px] mt-3">
              Se o botao nao funcionar, use o menu do navegador {'>'} "Instalar app" ou "Adicionar a tela inicial"
            </p>
          )}
        </motion.div>

        {/* QR Code para compartilhar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 w-full text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-amber-400" />
            <p className="text-amber-400 font-bold text-xs tracking-wider">QR CODE PARA INSTALACAO</p>
          </div>
          <p className="text-slate-400 text-[10px] mb-3">
            Escaneie para instalar em outro dispositivo
          </p>
          <div className="bg-white rounded-xl p-3 inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(installUrl)}`}
              alt="QR Code Instalacao"
              className="w-36 h-36"
            />
          </div>
          <p className="text-slate-500 text-[10px] mt-2 font-mono">{installUrl}</p>
        </motion.div>

        {/* Instrucoes iOS */}
        {showIOSHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-5 w-full mb-6 border border-amber-400/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <p className="text-amber-400 font-bold text-xs">INSTALAR NO iPhone/iPad</p>
            </div>
            <ol className="text-slate-300 text-xs space-y-2 text-left list-decimal list-inside">
              <li>Toque no botao <strong className="text-white">Compartilhar</strong> (icone de seta para cima) no Safari</li>
              <li>Role para baixo e toque em <strong className="text-white">"Adicionar a Tela de Inicio"</strong></li>
              <li>Toque em <strong className="text-white">"Adicionar"</strong> no canto superior direito</li>
              <li>Pronto! O app estara na sua tela inicial</li>
            </ol>
          </motion.div>
        )}

        {/* Instrucoes Android/PC */}
        {!isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5 w-full mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-amber-400" />
              <p className="text-amber-400 font-bold text-xs">OUTROS DISPOSITIVOS</p>
            </div>
            <div className="text-slate-300 text-xs space-y-2 text-left">
              <p><strong className="text-white">Android Chrome:</strong> Menu {'>'} "Adicionar a tela inicial" ou "Instalar app"</p>
              <p><strong className="text-white">Computador Chrome:</strong> Clique no icone de install na barra de endereco</p>
              <p><strong className="text-white">Edge:</strong> Menu {'>'} Apps {'>'} "Instalar este site como um app"</p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-600 text-[10px] mt-auto"
        >
          www.bikesegurabc.com.br
        </motion.p>
      </div>
    </div>
  );
}
