import { ArrowRight, BadgeCheck, Building2, LockKeyhole, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

type AccessOption = {
  id: 'gm' | 'pm';
  title: string;
  subtitle: string;
  description: string;
  tone: string;
  emblemSrc: string;
  emblemAlt: string;
  href: string;
};

const accessOptions: AccessOption[] = [
  {
    id: 'gm',
    title: 'Guarda Municipal',
    subtitle: 'Acesso operacional GMBC',
    description: 'Consulta de equipamentos, alertas de furto e acionamentos registrados para apoio em campo.',
    tone: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:border-emerald-200/55',
    emblemSrc: '/escudo-guarda-municipal-bc.png',
    emblemAlt: 'Escudo da Guarda Municipal de Balneario Camboriu',
    href: '/institucional/login?instituicao=gm',
  },
  {
    id: 'pm',
    title: 'Policia Militar',
    subtitle: 'Acesso operacional PMBC',
    description: 'Verificacao segura de bicicletas e equipamentos protegidos, com auditoria de consultas.',
    tone: 'border-sky-300/25 bg-sky-400/10 text-sky-100 hover:border-sky-200/55',
    emblemSrc: '/escudo-policia-militar-sc.png',
    emblemAlt: 'Escudo da Policia Militar de Santa Catarina',
    href: '/institucional/login?instituicao=pm',
  },
];

function InstitutionalEmblem({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white p-2 shadow-lg shadow-black/25">
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

function AccessCard({ option }: { option: AccessOption }) {
  return (
    <Link
      to={option.href}
      className={`group grid min-h-[220px] gap-5 rounded-lg border p-5 text-left transition ${option.tone} md:grid-cols-[128px_1fr] md:items-center`}
    >
      <InstitutionalEmblem src={option.emblemSrc} alt={option.emblemAlt} />
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">{option.subtitle}</p>
        <h2 className="mt-2 text-2xl font-black text-white">{option.title}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{option.description}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-black text-[#101318] transition group-hover:bg-amber-300">
          Acessar portal
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default function ForcasSegurancaPortal() {
  return (
    <main className="min-h-screen bg-[#101318] text-slate-100">
      <section className="border-b border-white/10 bg-[#151a20]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="h-11 w-11 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Bike Segura BC</p>
              <p className="truncate text-sm font-black text-white">Portal das Forcas de Seguranca</p>
            </div>
          </div>
          <Link
            to="/institucional/login?instituicao=admin"
            className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-300/40 hover:text-amber-100 sm:flex"
          >
            <Building2 className="h-4 w-4" />
            Admin Bike Segura
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-12">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
            <Shield className="h-4 w-4" />
            Uso restrito e auditado
          </div>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
            Portal das Forcas de Seguranca
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Ambiente exclusivo para consulta operacional de bicicletas e equipamentos protegidos pelo Bike Segura BC.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <BadgeCheck className="mb-3 h-5 w-5 text-emerald-300" />
              Consulta por alerta, QR, serie, caracteristicas e rastreador.
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <LockKeyhole className="mb-3 h-5 w-5 text-cyan-200" />
              Acesso a dados sensiveis somente com motivo registrado.
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {accessOptions.map(option => (
            <AccessCard key={option.id} option={option} />
          ))}

          <Link
            to="/institucional/login?instituicao=admin"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300 hover:border-amber-300/40 hover:text-amber-100 sm:hidden"
          >
            <Building2 className="h-4 w-4" />
            Acesso Admin Bike Segura
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-8 text-[11px] leading-relaxed text-slate-500">
        Acesso permitido apenas a operadores autorizados. Toda consulta, visualizacao de dados e acionamento ficam registrados para auditoria.
      </footer>
    </main>
  );
}
