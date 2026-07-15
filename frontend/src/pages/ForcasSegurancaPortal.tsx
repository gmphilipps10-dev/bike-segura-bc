import { Building2, ChevronRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

type AccessOption = {
  id: 'gm' | 'pm';
  institution: string;
  title: string;
  description: string;
  emblemSrc: string;
  emblemAlt: string;
  href: string;
  accentClass: string;
};

const accessOptions: AccessOption[] = [
  {
    id: 'gm',
    institution: 'GMBC',
    title: 'Guarda Municipal',
    description: 'Consulta operacional de equipamentos, alertas de furto e acionamentos em campo.',
    emblemSrc: '/escudo-guarda-municipal-bc.png',
    emblemAlt: 'Escudo da Guarda Municipal de Balneario Camboriu',
    href: '/institucional/login?instituicao=gm',
    accentClass: 'border-emerald-300/35 hover:border-emerald-200',
  },
  {
    id: 'pm',
    institution: 'PMSC',
    title: 'Policia Militar',
    description: 'Verificacao segura de bicicletas e equipamentos protegidos, com auditoria de consultas.',
    emblemSrc: '/escudo-policia-militar-sc.png',
    emblemAlt: 'Brasao da Policia Militar de Santa Catarina',
    href: '/institucional/login?instituicao=pm',
    accentClass: 'border-sky-300/35 hover:border-sky-200',
  },
];

function AccessEmblem({ option }: { option: AccessOption }) {
  return (
    <Link
      to={option.href}
      aria-label={`Acessar portal ${option.title}`}
      className={`group flex h-full min-h-[360px] flex-col items-center justify-between rounded-lg border bg-[#151a20] p-6 text-center shadow-xl shadow-black/25 transition ${option.accentClass} hover:-translate-y-0.5 hover:bg-[#192029]`}
    >
      <div className="w-full">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">{option.institution}</p>
        <h2 className="mt-3 text-2xl font-black text-white">{option.title}</h2>
      </div>

      <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-white/15 bg-white p-3 shadow-lg shadow-black/30 transition group-hover:scale-[1.03]">
        <img src={option.emblemSrc} alt={option.emblemAlt} className="h-full w-full object-contain" />
      </div>

      <div className="w-full">
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-300">{option.description}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-black text-[#101318] transition group-hover:bg-amber-300">
          Entrar
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export default function ForcasSegurancaPortal() {
  return (
    <main className="min-h-screen bg-[#101318] text-slate-100">
      <header className="border-b border-white/10 bg-[#151a20]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="h-12 w-12 rounded-lg object-cover" />
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
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col px-5 py-8 lg:min-h-[calc(100vh-81px)] lg:justify-center lg:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
            <ShieldCheck className="h-4 w-4" />
            Acesso restrito e auditado
          </div>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
            Portal das Forcas de Seguranca
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            Ambiente exclusivo para consulta operacional de bicicletas e equipamentos protegidos pelo Bike Segura BC.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {accessOptions.map(option => (
            <AccessEmblem key={option.id} option={option} />
          ))}
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-emerald-300" />
            Consultas por QR, alerta, serie, caracteristicas e rastreador.
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <LockKeyhole className="mb-2 h-5 w-5 text-cyan-200" />
            Dados sensiveis somente mediante motivo registrado.
          </div>
        </div>

        <Link
          to="/institucional/login?instituicao=admin"
          className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-300 hover:border-amber-300/40 hover:text-amber-100 sm:hidden"
        >
          <Building2 className="h-4 w-4" />
          Admin Bike Segura
        </Link>

        <footer className="pt-7 text-center text-[11px] leading-relaxed text-slate-500">
          Toda consulta, visualizacao de dados e acionamento ficam registrados para auditoria.
        </footer>
      </section>
    </main>
  );
}
