import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Shield, MapPin, Radio, Eye, Bike,
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

  // QR Code aponta DIRETO para a HOME do app (nao para /instalar)
  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : 'https://www.bikesegurabc.com.br/';

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
    <>
      {/* ===== VERSAO DIGITAL ===== */}
      <div className="screen-only min-h-screen bg-black text-white overflow-x-hidden">

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1222] via-[#1a1500] to-[#0c1222]" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251,191,36,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.1) 0%, transparent 40%)'
          }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24">
            <div className="grid md:grid-cols-2 gap-10 items-center">

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
                  Aqui em BC, a gente muda esse jogo.
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

              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                className="flex flex-col items-center">
                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-amber-400/10">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(appUrl)}`}
                    alt="QR Code" className="w-52 h-52 md:w-64 md:h-64" />
                </div>
                <p className="text-amber-400 font-bold text-sm mt-4 tracking-wider">
                  APONTE A CAMERA E BAIXE
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ESTATISTICAS */}
        <section className="relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-8">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '70%', txt: 'das bikes furtadas nunca voltam' },
              { num: '100%', txt: 'protecao com QR Code' },
              { num: '24h', txt: 'monitoramento continuo' },
              { num: 'R$ 0', txt: 'para comecar agora' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="text-black text-2xl md:text-3xl font-black">{s.num}</p>
                <p className="text-black/70 text-xs font-semibold mt-1 uppercase tracking-wide">{s.txt}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-16 md:py-20 bg-[#0a0f1a]">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">Em 3 Passos</p>
              <h2 className="text-3xl md:text-4xl font-black">COMO <span className="text-amber-400">PROTEGER</span> SUA BIKE</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Bike, n: '01', tit: 'Cadastre', desc: 'Fotos, numero de serie e caracteristicas. Tudo documentado.' },
                { icon: Shield, n: '02', tit: 'Receba o QR Code', desc: 'Um adesivo identificador exclusivo para o quadro da sua bike.' },
                { icon: Radio, n: '03', tit: 'Fique Protegido', desc: 'Se for furtada, a comunidade inteira e alertada na hora.' },
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

        {/* VANTAGENS */}
        <section className="py-16 md:py-20 bg-black">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">Vantagens</p>
              <h2 className="text-3xl md:text-4xl font-black">POR QUE O <span className="text-amber-400">BIKE SEGURA BC</span>?</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Shield, tit: 'Alerta Imediato de Furto', desc: 'Marque sua bike como furtada em segundos. Todos serao avisados ao escanear o QR Code.' },
                { icon: Eye, tit: 'Consulta Publica', desc: 'Qualquer pessoa pode verificar se uma bike e furtada ao escanear. Comunidade ativa.' },
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

        {/* CTA FINAL */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1222] to-[#1a1500]" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.2) 0%, transparent 60%)'
          }} />

          <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                NAO ESPERE.<br />
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

                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white rounded-xl p-2">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(appUrl)}`}
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

        {/* RODAPE */}
        <footer className="border-t border-white/5 py-6 bg-[#0a0f1a]">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/logo-oficial.jpg" alt="" className="w-6 h-6 rounded" />
              <span className="text-white font-bold text-sm">BIKE SEGURA BC</span>
            </div>
            <p className="text-slate-500 text-xs">www.bikesegurabc.com.br | Balneario Camboriu - SC</p>
          </div>
        </footer>
      </div>

      {/* ===== VERSAO CARTAZ (apenas print) ===== */}
      <div className="print-only">
        <div className="cartaz-container">

          {/* CABECALHO */}
          <div className="cartaz-topo">
            <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="cartaz-topo-logo" />
            <div>
              <h1 className="cartaz-topo-titulo">BIKE SEGURA BC</h1>
              <p className="cartaz-topo-slogan">Protecao e rastreamento de bicicletas</p>
            </div>
          </div>

          {/* HEADLINE */}
          <div className="cartaz-headline-box">
            <h2 className="cartaz-headline-h2">
              SUA BIKE<br />
              <span className="cartaz-headline-destaque">PROTEGIDA 24h</span>
            </h2>
            <p className="cartaz-headline-sub">
              Ate <strong className="cartaz-headline-strong">70%</strong> das bikes furtadas <strong className="cartaz-headline-strong">NUNCA</strong> sao recuperadas.<br />
              Em Balneario Camboriu, a gente muda esse numero.
            </p>
          </div>

          {/* PASSOS */}
          <div className="cartaz-passos">
            <div className="cartaz-passo">
              <div className="cartaz-passo-num">1</div>
              <p className="cartaz-passo-txt"><strong>Cadastre</strong> sua bike com fotos e numero de serie</p>
            </div>
            <div className="cartaz-passo">
              <div className="cartaz-passo-num">2</div>
              <p className="cartaz-passo-txt"><strong>Receba</strong> um adesivo QR Code exclusivo</p>
            </div>
            <div className="cartaz-passo">
              <div className="cartaz-passo-num">3</div>
              <p className="cartaz-passo-txt"><strong>Fique protegido</strong> com alertas e rastreamento</p>
            </div>
          </div>

          {/* QR CODE DESTAQUE */}
          <div className="cartaz-qr-area">
            <div className="cartaz-qr-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(appUrl)}`}
                alt="QR Code"
                className="cartaz-qr-img"
              />
            </div>
            <div className="cartaz-qr-info">
              <p className="cartaz-qr-chamada">BAIXE O APP AGORA!</p>
              <p className="cartaz-qr-sub">Aponte a camera do celular<br/>para o QR Code</p>
              <div className="cartaz-qr-instrucoes">
                <p><span className="cartaz-qr-dot" /> Escaneie o QR Code</p>
                <p><span className="cartaz-qr-dot" /> Toque em "Adicionar a tela inicial"</p>
                <p><span className="cartaz-qr-dot" /> Pronto! Sua bike esta protegida</p>
              </div>
            </div>
          </div>

          {/* BENEFICIOS */}
          <div className="cartaz-beneficios-row">
            <div className="cartaz-beneficio">
              <Shield className="cartaz-beneficio-icone" />
              <span>Alerta de Furto</span>
            </div>
            <div className="cartaz-beneficio">
              <Eye className="cartaz-beneficio-icone" />
              <span>Consulta Publica</span>
            </div>
            <div className="cartaz-beneficio">
              <MapPin className="cartaz-beneficio-icone" />
              <span>Rastreamento GPS</span>
            </div>
            <div className="cartaz-beneficio">
              <Radio className="cartaz-beneficio-icone" />
              <span>Comunidade Ativa</span>
            </div>
          </div>

          {/* RODAPE */}
          <div className="cartaz-rodape">
            <p><strong>www.bikesegurabc.com.br</strong> &middot; Balneario Camboriu - SC</p>
            <p style={{fontSize:'8pt', marginTop:'2mm', opacity:0.7}}>Proteja o que e seu. Cadastre sua bike hoje mesmo.</p>
          </div>

        </div>
      </div>

      {/* ===== ESTILOS PRINT ===== */}
      <style>{`{`
        `@media print {`
          `  @page { size: A4 portrait; margin: 0; }`
          `  body { background: #0c1222 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`
          `}`

          `.screen-only { display: block; }`
          `.print-only { display: none; }`

          `@media print {`
          `  .screen-only { display: none !important; }`
          `  .print-only { display: block !important; }`
          `}`

          /* === CARTAZ A4 === */
          `.cartaz-container {`
          `  width: 210mm;`
          `  min-height: 297mm;`
          `  padding: 12mm 14mm;`
          `  box-sizing: border-box;`
          `  background: linear-gradient(180deg, #0c1222 0%, #111827 100%);`
          `  color: #fff;`
          `  font-family: 'Inter', system-ui, -apple-system, sans-serif;`
          `  display: flex;`
          `  flex-direction: column;`
          `}`

          `.cartaz-topo {`
          `  display: flex;`
          `  align-items: center;`
          `  gap: 4mm;`
          `  padding-bottom: 5mm;`
          `  border-bottom: 2px solid #d4a017;`
          `  margin-bottom: 6mm;`
          `}`
          `.cartaz-topo-logo {`
          `  width: 16mm;`
          `  height: 16mm;`
          `  border-radius: 3mm;`
          `  object-fit: cover;`
          `}`
          `.cartaz-topo-titulo {`
          `  font-size: 16pt;`
          `  font-weight: 900;`
          `  color: #fff;`
          `  margin: 0;`
          `  letter-spacing: 0.5px;`
          `}`
          `.cartaz-topo-slogan {`
          `  font-size: 8pt;`
          `  color: #d4a017;`
          `  margin: 0;`
          `  font-weight: 600;`
          `}`

          `.cartaz-headline-box {`
          `  text-align: center;`
          `  margin-bottom: 7mm;`
          `}`
          `.cartaz-headline-h2 {`
          `  font-size: 30pt;`
          `  font-weight: 900;`
          `  color: #fff;`
          `  margin: 0 0 3mm;`
          `  line-height: 1.15;`
          `  letter-spacing: -0.5px;`
          `}`
          `.cartaz-headline-destaque {`
          `  color: #fbbf24;`
          `}`
          `.cartaz-headline-sub {`
          `  font-size: 10.5pt;`
          `  color: #cbd5e1;`
          `  margin: 0;`
          `  line-height: 1.5;`
          `}`
          `.cartaz-headline-strong {`
          `  color: #fbbf24;`
          `}`

          `.cartaz-passos {`
          `  display: flex;`
          `  gap: 4mm;`
          `  margin-bottom: 8mm;`
          `}`
          `.cartaz-passo {`
          `  flex: 1;`
          `  background: rgba(255,255,255,0.04);`
          `  border: 1px solid rgba(255,255,255,0.08);`
          `  border-radius: 3mm;`
          `  padding: 4mm;`
          `  text-align: center;`
          `}`
          `.cartaz-passo-num {`
          `  width: 8mm;`
          `  height: 8mm;`
          `  border-radius: 50%;`
          `  background: #fbbf24;`
          `  color: #0c1222;`
          `  font-weight: 900;`
          `  font-size: 11pt;`
          `  display: flex;`
          `  align-items: center;`
          `  justify-content: center;`
          `  margin: 0 auto 2mm;`
          `}`
          `.cartaz-passo-txt {`
          `  font-size: 8.5pt;`
          `  color: #e2e8f0;`
          `  margin: 0;`
          `  line-height: 1.4;`
          `}`
          `.cartaz-passo-txt strong {`
          `  color: #fff;`
          `}`

          `.cartaz-qr-area {`
          `  display: flex;`
          `  align-items: center;`
          `  gap: 8mm;`
          `  background: linear-gradient(135deg, #0f172a, #1a1500);`
          `  border: 2px solid rgba(251,191,36,0.3);`
          `  border-radius: 5mm;`
          `  padding: 8mm;`
          `  margin-bottom: 6mm;`
          `}`
          `.cartaz-qr-wrapper {`
          `  background: #fff;`
          `  border-radius: 4mm;`
          `  padding: 3mm;`
          `  flex-shrink: 0;`
          `}`
          `.cartaz-qr-img {`
          `  width: 42mm;`
          `  height: 42mm;`
          `  display: block;`
          `}`
          `.cartaz-qr-info {`
          `  flex: 1;`
          `}`
          `.cartaz-qr-chamada {`
          `  font-size: 18pt;`
          `  font-weight: 900;`
          `  color: #fbbf24;`
          `  margin: 0 0 2mm;`
          `}`
          `.cartaz-qr-sub {`
          `  font-size: 10pt;`
          `  color: #cbd5e1;`
          `  margin: 0 0 4mm;`
          `  line-height: 1.4;`
          `}`
          `.cartaz-qr-instrucoes p {`
          `  font-size: 9pt;`
          `  color: #fff;`
          `  margin: 0 0 2mm;`
          `  display: flex;`
          `  align-items: center;`
          `  gap: 2mm;`
          `}`
          `.cartaz-qr-dot {`
          `  width: 3mm;`
          `  height: 3mm;`
          `  border-radius: 50%;`
          `  background: #fbbf24;`
          `  display: inline-block;`
          `  flex-shrink: 0;`
          `}`

          `.cartaz-beneficios-row {`
          `  display: flex;`
          `  justify-content: space-around;`
          `  gap: 3mm;`
          `  margin-bottom: 6mm;`
          `}`
          `.cartaz-beneficio {`
          `  display: flex;`
          `  flex-direction: column;`
          `  align-items: center;`
          `  gap: 1.5mm;`
          `  font-size: 8pt;`
          `  color: #e2e8f0;`
          `  font-weight: 600;`
          `  text-align: center;`
          `}`
          `.cartaz-beneficio-icone {`
          `  width: 5mm;`
          `  height: 5mm;`
          `  color: #fbbf24;`
          `}`

          `.cartaz-rodape {`
          `  margin-top: auto;`
          `  text-align: center;`
          `  padding-top: 4mm;`
          `  border-top: 1px solid rgba(255,255,255,0.1);`
          `}`
          `.cartaz-rodape p {`
          `  font-size: 9pt;`
          `  color: #94a3b8;`
          `  margin: 0;`
          `}`
        `}`}</style>
    </>
  );
}
