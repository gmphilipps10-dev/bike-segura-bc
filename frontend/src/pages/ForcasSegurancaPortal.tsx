import { Link } from 'react-router-dom';

type AccessOption = {
  id: 'gm' | 'pm';
  title: string;
  emblemSrc: string;
  emblemAlt: string;
  href: string;
};

const accessOptions: AccessOption[] = [
  {
    id: 'gm',
    title: 'GUARDA MUNICIPAL',
    emblemSrc: '/escudo-guarda-municipal-bc.png',
    emblemAlt: 'Escudo da Guarda Municipal de Balneário Camboriú',
    href: '/institucional/login?instituicao=gm',
  },
  {
    id: 'pm',
    title: 'POLÍCIA MILITAR',
    emblemSrc: '/escudo-policia-militar-sc.png',
    emblemAlt: 'Brasão da Polícia Militar de Santa Catarina',
    href: '/institucional/login?instituicao=pm',
  },
];

function AccessEmblem({ option }: { option: AccessOption }) {
  return (
    <Link
      to={option.href}
      aria-label={`Acessar ${option.title}`}
      className="group flex flex-col items-center text-center transition hover:-translate-y-1 focus:outline-none"
    >
      <span className="text-xl font-black uppercase tracking-[0.16em] text-white sm:text-2xl">
        {option.title}
      </span>

      <img
        src={option.emblemSrc}
        alt={option.emblemAlt}
        className="mt-7 h-44 w-44 object-contain transition duration-200 group-hover:scale-105 sm:h-56 sm:w-56"
      />

      <span className="mt-7 text-sm font-black uppercase tracking-[0.22em] text-amber-300 transition group-hover:text-amber-200">
        ENTRAR
      </span>
    </Link>
  );
}

export default function ForcasSegurancaPortal() {
  return (
    <main className="min-h-screen bg-[#101318] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-center gap-3">
          <img src="/logo-oficial.jpg" alt="Bike Segura BC" className="h-12 w-12 rounded-lg object-cover" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Bike Segura BC</p>
            <p className="text-sm font-black text-white">Portal das Forças de Segurança</p>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="text-center text-4xl font-black uppercase leading-tight text-white sm:text-5xl">
            Portal das Forças de Segurança
          </h1>
          <p className="mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-300">
            Acesso operacional exclusivo para instituições autorizadas.
          </p>

          <div className="mt-14 grid w-full max-w-4xl gap-14 sm:grid-cols-2 sm:gap-10">
            {accessOptions.map(option => (
              <AccessEmblem key={option.id} option={option} />
            ))}
          </div>
        </div>

        <footer className="pt-8 text-center text-[11px] leading-relaxed text-slate-500">
          Toda consulta, visualização de dados e acionamento ficam registrados para auditoria.
        </footer>
      </section>
    </main>
  );
}
