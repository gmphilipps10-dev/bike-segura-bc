import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Shield, MapPin, Radio, Eye, Bike, ChevronRight,
  CircleCheck, ScanLine
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const installUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/instalar` : 'https://www.bikesegurabc.com.br/instalar';

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CircleCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-lg">App Instalado!</h2>
          <p className="text-slate-400 text-sm mt-2">Bike Segura BC esta no seu dispositivo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1222] via-[#1a1500] to-[#0c1222]" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251,191,36,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.1) 0%, transparent 40%)'
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Esquerda: Texto */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-oficial.jpg" alt="" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">Bike Segura BC</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-5">
                SUA BIKE<br />
                <span className="text-amber-400">PROTEGIDA</span><br />
                24 HORAS
              </h1>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 max-w-md">
                Ate 70% das bikes furtadas <span className="text-red-400 font-bold">NUNCA</span> sao recuperadas.
                Aqui em BC, a gente muda esse jogo. Cadastre, proteja e rastreie sua bicicleta agora.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleInstall}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/20 cursor-pointer">
                  <Download className="w-4 h-4" />
                  BAIXAR O APP
                </button>
                <button onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/20 hover:border-amber-400/50 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer">
                  <ScanLine className="w-4 h-4" />
                  IMPRIMIR CARTAZ
                </button>
              </div>
            </motion.div>

            {/* Direita: QR Code em destaque */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="flex flex-col items-center">
              <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-amber-400/10">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(installUrl)}`}
                  alt="QR Code" className="w-52 h-52 md:w-64 md:h-64" />
              </div>
              <p className="text-amber-400 font-bold text-sm mt-4 tracking-wider">
                APONTE A CAMERA E BAIXE
              </p>
              <p className="text-slate-500 text-xs mt-1">www.bikesegurabc.com.br/instalar</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PAINEL DE ESTATISTICAS ===== */}
      <section className="relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '70%', txt: 'das bikes furtadas nunca voltam' },
            { num: '100%', txt: 'protecao com QR Code' },
            { num: '24h', txt: 'monitoramento continuo' },
            { num: '0', txt: 'para comecar a proteger' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-black text-2xl md:text-3xl font-black">{s.num}</p>
              <p className="text-black/70 text-xs font-semibold mt-1 uppercase tracking-wide">{s.txt}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="py-16 md:py-20 bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">Em 3 Passos</p>
            <h2 className="text-3xl md:text-4xl font-black">COMO <span className="text-amber-400">PROTEGER</span> SUA BIKE</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Bike, n: '01', tit: 'Cadastre', desc: 'Fotos, numero de serie e caracteristicas da sua bike. Tudo documentado.' },
              { icon: Shield, n: '02', tit: 'Receba o QR Code', desc: 'Um adesivo identificador exclusivo. Cole no quadro da sua bike.' },
              { icon: Radio, n: '03', tit: 'Fique Protegido', desc: 'Se alguem escanear, ve seus dados. Se for furtada, a comunidade inteira e alertada.' },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="relative bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <span className="absolute top-4 right-4 text-4xl font-black text-white/5">{p.n}</span>
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{p.tit}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== POR QUE USAR ===== */}
      <section className="py-16 md:py-20 bg-black">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">Vantagens</p>
            <h2 className="text-3xl md:text-4xl font-black">POR QUE O <span className="text-amber-400">BIKE SEGURA BC</span>?</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Shield, tit: 'Alerta Imediato de Furto', desc: 'Marque sua bike como furtada em segundos. Todos que escanearem o QR Code serao avisados.' },
              { icon: Eye, tit: 'Consulta Publica', desc: 'Qualquer pessoa pode verificar se uma bike e furtada ao escanear o QR Code. Comunidade ativa.' },
              { icon: MapPin, tit: 'Rastreamento por TAG/GPS', desc: 'Integre dispositivos de rastreamento e acompanhe sua bike em tempo real pelo app.' },
              { icon: Radio, tit: 'Rede de Protecao Local', desc: 'Uma rede de ciclistas de Balneario Camboriu que se protegem mutuamente.' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{b.tit}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1222] to-[#1a1500]" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.2) 0%, transparent 60%)'
        }} />

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              NAO ESPESE ACONTECER.<br />
              <span className="text-amber-400">PROTEJA AGORA.</span>
            </h2>
            <p className="text-slate-300 text-base mb-8">
              Sua bike vale muito mais do que dinheiro. E liberdade, saude e prazer.
              Nao deixe ninguem tirar isso de voce.
            </p>

            <div className="flex flex-col items-center gap-4">
              <button onClick={handleInstall}
                className="inline-flex items-center gap-3 px-10 py-4 bg-amber-400 hover:bg-amber-300 text-black font-black text-base rounded-2xl transition-all shadow-xl shadow-amber-400/20 cursor-pointer">
                <Download className="w-5 h-5" />
                QUERO PROTEGER MINHA BIKE
              </button>

              {/* QR Code pequeno */}
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-white rounded-xl p-2">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(installUrl)}`}
                    alt="QR" className="w-20 h-20" />
                </div>
                <div className="text-left">
                  <p className="text-amber-400 font-bold text-xs">ESCANEIE E INSTALE</p>
                  <p className="text-slate-500 text-[10px]">Apenas 1 minuto</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== RODAPE ===== */}
      <footer className="border-t border-white/5 py-6 bg-[#0a0f1a]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo-oficial.jpg" alt="" className="w-6 h-6 rounded" />
            <span className="text-white font-bold text-sm">BIKE SEGURA BC</span>
          </div>
          <p className="text-slate-500 text-xs">www.bikesegurabc.com.br | Balneario Camboriu - SC</p>
        </div>
      </footer>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
