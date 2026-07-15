import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  Bike as BikeIcon,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Search,
  Shield,
  Siren,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

type PortalView = 'login' | 'dashboard' | 'consulta' | 'alertas' | 'historico';

type InstitutionalUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'institucional_gm' | 'institucional_pm' | 'admin_bike_segura';
  institution: 'GMBC' | 'PMBC' | 'BIKE_SEGURA';
  department?: string;
  status?: string;
};

type DashboardData = {
  cards: {
    totalEquipamentos: number;
    alertasFurto: number;
    recuperados: number;
    consultasHoje: number;
    novosUltimos7Dias: number;
    acionamentosAbertos: number;
  };
};

type EquipmentSummary = {
  id: string;
  status: 'normal' | 'furto' | 'recuperada';
  type: string;
  brand: string;
  model: string;
  color: string;
  photo?: string | null;
  serieMasked: string;
  cityUf: string;
  createdAt?: string;
  updatedAt?: string;
  alert: boolean;
  guidance: string;
  qr?: {
    stickerNumber?: string;
    status?: string;
  };
  alertDetails?: {
    serie?: string;
    alertDate?: string;
    boNumber?: string;
    location?: string;
    caracteristicas?: string;
    rastreamento?: string;
    plataformaTag?: string;
  };
  operationalDetails?: {
    caracteristicas?: string;
    rastreamento?: string;
    plataformaTag?: string;
  };
  similarity?: number;
  imageSimilarity?: number;
  matchedTerms?: string[];
  matchReason?: string;
};

type OwnerData = {
  name: string;
  phone: string;
  email: string;
  cpfMasked: string;
  notes: string;
};

type AccessLog = {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  institution: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  searchTerm?: string;
  searchType?: string;
  reason?: string;
  reasonText?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type ReasonOption = {
  value: string;
  label: string;
};

type ReasonModalState = {
  mode: 'owner' | 'trigger';
  equipment: EquipmentSummary;
};

type NavItem = {
  view: Exclude<PortalView, 'login'>;
  label: string;
  path: string;
  icon: LucideIcon;
};

type LoginContext = {
  eyebrow: string;
  title: string;
  message: string;
  badgeClass: string;
};

const TOKEN_KEY = 'bike_segura_institutional_token';
const USER_KEY = 'bike_segura_institutional_user';

const DEFAULT_NAV_ITEM: NavItem = { view: 'dashboard', label: 'Dashboard', path: '/institucional/dashboard', icon: BarChart3 };

const NAV_ITEMS: NavItem[] = [
  DEFAULT_NAV_ITEM,
  { view: 'consulta', label: 'Consulta', path: '/institucional/consulta', icon: Search },
  { view: 'alertas', label: 'Alertas', path: '/institucional/alertas', icon: AlertTriangle },
  { view: 'historico', label: 'Histórico', path: '/institucional/historico', icon: History },
];

const OWNER_REASON_OPTIONS: ReasonOption[] = [
  { value: 'recuperacao', label: 'Recuperação de equipamento' },
  { value: 'abandonado', label: 'Equipamento abandonado' },
  { value: 'averiguacao_operacional', label: 'Averiguação operacional' },
  { value: 'contato_autorizado', label: 'Contato autorizado pelo proprietário' },
  { value: 'outro', label: 'Outro motivo operacional' },
];

const TRIGGER_REASON_OPTIONS: ReasonOption[] = [
  { value: 'recuperacao', label: 'Apoio em recuperação' },
  { value: 'alerta_furto', label: 'Alerta de furto ativo' },
  { value: 'contato_proprietario', label: 'Contato com proprietário' },
  { value: 'suporte_operacional', label: 'Suporte operacional' },
  { value: 'outro', label: 'Outro motivo operacional' },
];

const SEARCH_TYPES = [
  { value: 'geral', label: 'Geral' },
  { value: 'similaridade', label: 'Similaridade visual' },
  { value: 'foto', label: 'Foto + detalhes' },
  { value: 'qr', label: 'QR/adesivo' },
  { value: 'serie', label: 'Quadro/série' },
  { value: 'rastreador', label: 'TAG/GPS' },
  { value: 'marca', label: 'Marca' },
  { value: 'modelo', label: 'Modelo' },
  { value: 'cor', label: 'Cor' },
  { value: 'caracteristicas', label: 'Características' },
  { value: 'tipo', label: 'Tipo' },
];

const IMAGE_SIGNATURE_SIZE = 48;
const IMAGE_SIGNATURE_BUCKETS = 4;

function loadComparableImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Imagem indisponivel para comparacao.'));
    image.src = source;
  });
}

async function imageSignatureFromSource(source: string): Promise<number[]> {
  const image = await loadComparableImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_SIGNATURE_SIZE;
  canvas.height = IMAGE_SIGNATURE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Nao foi possivel ler a imagem.');

  context.drawImage(image, 0, 0, IMAGE_SIGNATURE_SIZE, IMAGE_SIGNATURE_SIZE);
  const { data } = context.getImageData(0, 0, IMAGE_SIGNATURE_SIZE, IMAGE_SIGNATURE_SIZE);
  const bins = new Array(IMAGE_SIGNATURE_BUCKETS ** 3).fill(0);

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 40) continue;
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;
    if (brightness < 8 || brightness > 248) continue;

    const redBucket = Math.min(IMAGE_SIGNATURE_BUCKETS - 1, Math.floor(red / 64));
    const greenBucket = Math.min(IMAGE_SIGNATURE_BUCKETS - 1, Math.floor(green / 64));
    const blueBucket = Math.min(IMAGE_SIGNATURE_BUCKETS - 1, Math.floor(blue / 64));
    const bucketIndex = redBucket * 16 + greenBucket * 4 + blueBucket;
    bins[bucketIndex] += 1;
  }

  const total = bins.reduce((sum, value) => sum + value, 0) || 1;
  return bins.map(value => value / total);
}

function compareImageSignatures(source: number[], candidate: number[]) {
  const intersection = source.reduce((sum, value, index) => sum + Math.min(value, candidate[index] || 0), 0);
  return Math.round(intersection * 100);
}

async function rankResultsByImageSimilarity(results: EquipmentSummary[], imageDataUrl: string) {
  const sourceSignature = await imageSignatureFromSource(imageDataUrl);
  const scored = await Promise.all(results.map(async equipment => {
    let imageSimilarity = 0;
    if (equipment.photo) {
      try {
        const candidateSignature = await imageSignatureFromSource(equipment.photo);
        imageSimilarity = compareImageSignatures(sourceSignature, candidateSignature);
      } catch {
        imageSimilarity = 0;
      }
    }

    const textSimilarity = equipment.similarity || 0;
    const combinedSimilarity = Math.max(imageSimilarity, Math.round((imageSimilarity * 0.7) + (textSimilarity * 0.3)));
    return {
      ...equipment,
      imageSimilarity,
      similarity: combinedSimilarity || textSimilarity || undefined,
      matchedTerms: imageSimilarity > 0
        ? Array.from(new Set(['foto', ...(equipment.matchedTerms || [])])).slice(0, 5)
        : equipment.matchedTerms,
      matchReason: imageSimilarity > 0
        ? `Semelhanca visual pela foto cadastrada (${imageSimilarity}%).${equipment.matchReason ? ` ${equipment.matchReason}` : ''}`
        : equipment.matchReason,
    };
  }));

  return scored
    .filter(equipment => (equipment.imageSimilarity || 0) >= 24 || (equipment.similarity || 0) >= 45)
    .sort((a, b) => {
      if (a.status === 'furto' && b.status !== 'furto') return -1;
      if (a.status !== 'furto' && b.status === 'furto') return 1;
      return (b.similarity || 0) - (a.similarity || 0);
    })
    .slice(0, 25);
}

function loginContextFromParam(value: string | null): LoginContext {
  if (value === 'gm') {
    return {
      eyebrow: 'Guarda Municipal',
      title: 'Acesso GMBC',
      message: 'Entrada exclusiva para operadores autorizados da Guarda Municipal.',
      badgeClass: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
    };
  }

  if (value === 'pm') {
    return {
      eyebrow: 'Polícia Militar',
      title: 'Acesso PMSC',
      message: 'Entrada exclusiva para operadores autorizados da Polícia Militar.',
      badgeClass: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
    };
  }

  if (value === 'admin') {
    return {
      eyebrow: 'Bike Segura BC',
      title: 'Admin Institucional',
      message: 'Entrada administrativa para gestao institucional, auditoria e acompanhamento operacional.',
      badgeClass: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
    };
  }

  return {
    eyebrow: 'Forças de Segurança',
    title: 'Portal Institucional',
    message: 'Acesso exclusivo para operadores autorizados da Guarda Municipal, Polícia Militar e Bike Segura BC.',
    badgeClass: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  };
}

function readStoredUser(): InstitutionalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as InstitutionalUser : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

async function institutionalRequest<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {},
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload.message || 'Operação não concluída.');
  }
  return payload as T;
}

function roleLabel(role: string) {
  if (role === 'institucional_gm') return 'Guarda Municipal';
  if (role === 'institucional_pm') return 'Polícia Militar';
  if (role === 'admin_bike_segura') return 'Admin Bike Segura';
  return role;
}

function institutionLabel(institution: string) {
  if (institution === 'GMBC') return 'GMBC';
  if (institution === 'PMBC') return 'PMSC';
  if (institution === 'BIKE_SEGURA') return 'Bike Segura BC';
  return institution;
}

function statusLabel(status: string) {
  if (status === 'furto') return 'Alerta de furto';
  if (status === 'recuperada') return 'Recuperado';
  return 'Regular';
}

function statusClass(status: string) {
  if (status === 'furto') return 'border-red-500/40 bg-red-500/10 text-red-200';
  if (status === 'recuperada') return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200';
  return 'border-slate-500/35 bg-slate-500/10 text-slate-200';
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    login_success: 'Login',
    login_failed: 'Falha de login',
    logout: 'Saída',
    dashboard: 'Dashboard',
    search: 'Consulta',
    view_equipment: 'Detalhe',
    view_owner_data: 'Dados do proprietário',
    trigger_bike_segura: 'Acionamento',
    view_alerts: 'Alertas',
    view_logs: 'Histórico',
    admin_create_institutional_user: 'Criou operador',
    admin_update_institutional_user: 'Atualizou operador',
  };
  return labels[action] || action;
}

function formatDate(value?: string) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(Number(date))) return 'Não informado';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function equipmentTitle(equipment: EquipmentSummary) {
  return `${equipment.brand || 'Equipamento'} ${equipment.model || ''}`.trim();
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-100">{value || 'Não informado'}</p>
    </div>
  );
}

function LoginScreen({
  onLogin,
  context,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  context: LoginContext;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#101318] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${context.badgeClass}`}>
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">{context.eyebrow}</p>
            <h1 className="text-2xl font-black text-white">{context.title}</h1>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-white/10 bg-[#171c22] p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-start gap-3 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
            <p className="text-xs leading-relaxed text-cyan-50">{context.message}</p>
          </div>

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400" htmlFor="institutional-email">
            E-mail institucional
          </label>
          <input
            id="institutional-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="username"
            className="mb-4 w-full rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition focus:border-amber-300"
          />

          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400" htmlFor="institutional-password">
            Senha
          </label>
          <input
            id="institutional-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mb-4 w-full rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition focus:border-amber-300"
          />

          {error && (
            <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-3 text-sm font-black text-[#101318] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Entrar
          </button>
        </form>

        <Link
          to="/forcasdeseguranca"
          className="mt-4 text-center text-xs font-bold text-slate-400 transition hover:text-amber-100"
        >
          Voltar para a escolha da instituicao
        </Link>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
          Uso restrito, auditado e vinculado à finalidade operacional. Dados pessoais são exibidos apenas mediante motivo registrado.
        </p>
      </div>
    </main>
  );
}

function Shell({
  user,
  view,
  onNavigate,
  onLogout,
  children,
}: {
  user: InstitutionalUser;
  view: Exclude<PortalView, 'login'>;
  onNavigate: (item: NavItem) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#101318] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#151a20] px-4 py-5 lg:block">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10">
              <Shield className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Bike Segura BC</p>
              <p className="text-sm font-black text-white">Portal Institucional</p>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = item.view === view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onNavigate(item)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold transition ${
                    active
                      ? 'bg-amber-300 text-[#101318]'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101318]/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {institutionLabel(user.institution)} · {roleLabel(user.role)}
                </p>
                <h2 className="truncate text-lg font-black text-white">{NAV_ITEMS.find(item => item.view === view)?.label}</h2>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-xs font-semibold text-slate-200">{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-200 hover:border-red-400/40 hover:text-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>

            <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = item.view === view;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => onNavigate(item)}
                    className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${
                      active ? 'bg-amber-300 text-[#101318]' : 'border border-white/10 bg-white/[0.03] text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <div className="px-4 py-5 lg:px-6">{children}</div>
          <footer className="border-t border-white/10 px-4 py-4 text-[11px] leading-relaxed text-slate-500 lg:px-6">
            Portal institucional de consulta operacional. Toda busca, visualização de proprietário e acionamento fica registrada com usuário, instituição, IP, data e hora.
          </footer>
        </section>
      </div>
    </main>
  );
}

function DashboardView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const cards = data?.cards;
  const metrics = [
    { label: 'Equipamentos cadastrados', value: cards?.totalEquipamentos ?? 0, icon: BikeIcon },
    { label: 'Alertas de furto', value: cards?.alertasFurto ?? 0, icon: AlertTriangle },
    { label: 'Recuperados', value: cards?.recuperados ?? 0, icon: CheckCircle2 },
    { label: 'Consultas hoje', value: cards?.consultasHoje ?? 0, icon: Search },
    { label: 'Novos em 7 dias', value: cards?.novosUltimos7Dias ?? 0, icon: Clock3 },
    { label: 'Acionamentos abertos', value: cards?.acionamentosAbertos ?? 0, icon: Siren },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-lg border border-white/10 bg-[#171c22] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <Icon className="h-4 w-4 text-amber-300" />
              </div>
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
              ) : (
                <p className="text-3xl font-black text-white">{metric.value}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-[#171c22] p-4">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
          <p className="text-sm leading-relaxed text-slate-300">
            Indicadores agregados não exibem CPF, telefone, endereço ou nome de proprietário.
          </p>
        </div>
      </div>
    </div>
  );
}

function EquipmentCard({
  equipment,
  active,
  onOpen,
}: {
  equipment: EquipmentSummary;
  active: boolean;
  onOpen: (equipment: EquipmentSummary) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(equipment)}
      className={`w-full rounded-lg border p-3 text-left transition ${
        active ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/10 bg-[#171c22] hover:border-white/20'
      }`}
    >
      <div className="flex gap-3">
        <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/20">
          {equipment.photo ? (
            <img src={equipment.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <BikeIcon className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="truncate text-sm font-black text-white">{equipmentTitle(equipment)}</p>
            <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-black uppercase ${statusClass(equipment.status)}`}>
              {statusLabel(equipment.status)}
            </span>
          </div>
          <p className="truncate text-xs text-slate-400">
            {equipment.type} · {equipment.color} · Série {equipment.serieMasked}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{equipment.cityUf}</p>
          {typeof equipment.similarity === 'number' && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-amber-300/15 px-2 py-1 text-[10px] font-black uppercase text-amber-100">
                {equipment.similarity}% similar
              </span>
              {equipment.matchedTerms?.slice(0, 4).map(term => (
                <span key={term} className="rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-100">
                  {term}
                </span>
              ))}
            </div>
          )}
          {equipment.matchReason && (
            <p className="mt-1 text-[11px] leading-snug text-slate-400">{equipment.matchReason}</p>
          )}
        </div>
      </div>
    </button>
  );
}

function OwnerPanel({ owner }: { owner: OwnerData }) {
  return (
    <section className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserRound className="h-4 w-4 text-cyan-100" />
        <h3 className="text-sm font-black text-white">Dados liberados para esta consulta</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <InfoRow label="Nome" value={owner.name} />
        <InfoRow label="CPF" value={owner.cpfMasked || 'Mascarado'} />
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Telefone</p>
          <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
            <Phone className="h-3.5 w-3.5 text-cyan-100" />
            {owner.phone || 'Não informado'}
          </p>
        </div>
        <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">E-mail</p>
          <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
            <Mail className="h-3.5 w-3.5 text-cyan-100" />
            {owner.email || 'Não informado'}
          </p>
        </div>
      </div>
      {owner.notes && (
        <p className="mt-3 rounded-md border border-white/10 bg-black/10 px-3 py-2 text-xs leading-relaxed text-slate-300">
          {owner.notes}
        </p>
      )}
    </section>
  );
}

function EquipmentDetail({
  equipment,
  owner,
  onViewOwner,
  onTrigger,
}: {
  equipment: EquipmentSummary | null;
  owner: OwnerData | null;
  onViewOwner: (equipment: EquipmentSummary) => void;
  onTrigger: (equipment: EquipmentSummary) => void;
}) {
  if (!equipment) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-[#171c22] p-6 text-center text-sm text-slate-500">
        Selecione um resultado para ver os detalhes operacionais.
      </div>
    );
  }

  return (
    <article className="space-y-4 rounded-lg border border-white/10 bg-[#171c22] p-4">
      {equipment.alert && (
        <section className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-200" />
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-red-100">Equipamento com alerta de furto</p>
              <p className="mt-1 text-xs leading-relaxed text-red-100/80">{equipment.guidance}</p>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="h-44 w-full overflow-hidden rounded-lg border border-white/10 bg-black/20 lg:w-60">
          {equipment.photo ? (
            <img src={equipment.photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BikeIcon className="h-8 w-8 text-slate-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${statusClass(equipment.status)}`}>
              {statusLabel(equipment.status)}
            </span>
            {equipment.qr?.stickerNumber && (
              <span className="rounded border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-100">
                {equipment.qr.stickerNumber}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white">{equipmentTitle(equipment)}</h3>
          <p className="mt-1 text-sm text-slate-400">{equipment.type} · {equipment.color} · {equipment.cityUf}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{equipment.guidance}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <InfoRow label="Tipo" value={equipment.type} />
        <InfoRow label="Cor" value={equipment.color} />
        <InfoRow label="Série/quadro" value={equipment.serieMasked} />
        <InfoRow label="Cadastro" value={formatDate(equipment.createdAt)} />
      </div>

      {equipment.alertDetails && (
        <section className="rounded-lg border border-red-500/25 bg-red-500/10 p-4">
          <h4 className="mb-3 text-xs font-black uppercase tracking-wide text-red-100">Detalhes do alerta</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoRow label="BO" value={equipment.alertDetails.boNumber} />
            <InfoRow label="Data do alerta" value={formatDate(equipment.alertDetails.alertDate)} />
            <InfoRow label="Local informado" value={equipment.alertDetails.location} />
            <InfoRow label="Série completa" value={equipment.alertDetails.serie} />
          </div>
          {equipment.alertDetails.caracteristicas && (
            <p className="mt-3 rounded-md border border-white/10 bg-black/10 px-3 py-2 text-xs leading-relaxed text-red-50/85">
              {equipment.alertDetails.caracteristicas}
            </p>
          )}
        </section>
      )}

      {equipment.operationalDetails?.caracteristicas && (
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Características</h4>
          <p className="text-sm leading-relaxed text-slate-300">{equipment.operationalDetails.caracteristicas}</p>
        </section>
      )}

      {owner && <OwnerPanel owner={owner} />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onViewOwner(equipment)}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-50 hover:bg-cyan-400/15"
        >
          <Eye className="h-4 w-4" />
          Dados do proprietário
        </button>
        <button
          type="button"
          onClick={() => onTrigger(equipment)}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-3 text-sm font-black text-[#101318] hover:bg-amber-200"
        >
          <Siren className="h-4 w-4" />
          Acionar Bike Segura BC
        </button>
      </div>
    </article>
  );
}

function ReasonModal({
  state,
  onClose,
  onSubmit,
}: {
  state: ReasonModalState;
  onClose: () => void;
  onSubmit: (reason: string, reasonText: string) => Promise<void>;
}) {
  const options = state.mode === 'owner' ? OWNER_REASON_OPTIONS : TRIGGER_REASON_OPTIONS;
  const [reason, setReason] = useState(options[0].value);
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(reason, reasonText);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Operação não concluída.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-lg border border-white/10 bg-[#171c22] p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              {state.mode === 'owner' ? 'Motivo obrigatório' : 'Acionamento'}
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{equipmentTitle(state.equipment)}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 p-2 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400" htmlFor="reason">
          Motivo
        </label>
        <select
          id="reason"
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="mb-4 w-full rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400" htmlFor="reasonText">
          Observação operacional
        </label>
        <textarea
          id="reasonText"
          value={reasonText}
          onChange={event => setReasonText(event.target.value)}
          rows={4}
          className="mb-4 w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
          placeholder="Informe referência do atendimento, guarnição, ocorrência ou contexto operacional."
        />

        {error && (
          <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-3 text-sm font-black text-[#101318] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Registrar e continuar
        </button>
      </form>
    </div>
  );
}

function ConsultaView({
  searchTerm,
  searchType,
  results,
  selectedEquipment,
  owner,
  loading,
  imagePreview,
  imageName,
  onSearchTerm,
  onSearchType,
  onImageFile,
  onSearch,
  onOpenEquipment,
  onViewOwner,
  onTrigger,
}: {
  searchTerm: string;
  searchType: string;
  results: EquipmentSummary[];
  selectedEquipment: EquipmentSummary | null;
  owner: OwnerData | null;
  loading: boolean;
  imagePreview: string;
  imageName: string;
  onSearchTerm: (value: string) => void;
  onSearchType: (value: string) => void;
  onImageFile: (file: File | null) => void;
  onSearch: (event: FormEvent) => void;
  onOpenEquipment: (equipment: EquipmentSummary) => void;
  onViewOwner: (equipment: EquipmentSummary) => void;
  onTrigger: (equipment: EquipmentSummary) => void;
}) {
  const isSimilaritySearch = searchType === 'similaridade';
  const isPhotoSearch = searchType === 'foto';
  const searchPlaceholder = isSimilaritySearch
    ? 'Ex: arranhão no garfo direito, adesivo hard rock no quadro'
    : isPhotoSearch
      ? 'Detalhes observados na foto: adesivo, arranhão, peça, cor...'
    : 'QR, série, marca, modelo, cor...';

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(320px,430px)_1fr]">
      <section className="space-y-3">
        <form onSubmit={onSearch} className="rounded-lg border border-white/10 bg-[#171c22] p-4">
          <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
            <select
              value={searchType}
              onChange={event => onSearchType(event.target.value)}
              className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
            >
              {SEARCH_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={searchTerm}
                onChange={event => onSearchTerm(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-amber-300"
                placeholder={searchPlaceholder}
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-amber-300 text-[#101318] disabled:opacity-60"
                title="Consultar"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {isPhotoSearch && (
            <div className="mt-3 rounded-md border border-white/10 bg-black/15 p-3">
              <input
                id="institutional-photo-search"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={event => onImageFile(event.target.files?.[0] || null)}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  htmlFor="institutional-photo-search"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-[#101318] transition hover:bg-amber-100"
                >
                  <UploadCloud className="h-4 w-4" />
                  Enviar foto
                </label>
                {imageName ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-100">{imageName}</p>
                    <button type="button" onClick={() => onImageFile(null)} className="mt-1 text-[11px] font-bold text-amber-100">
                      Remover foto
                    </button>
                  </div>
                ) : (
                  <p className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
                    <ImageIcon className="h-4 w-4 shrink-0 text-cyan-200" />
                    A foto será comparada com as imagens cadastradas.
                  </p>
                )}
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="" className="mt-3 h-36 w-full rounded-md object-cover sm:w-56" />
              )}
            </div>
          )}
          {(isSimilaritySearch || isPhotoSearch) && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Descreva marcas visuais, adesivos, peças, lados e cores. A busca considera detalhes parecidos cadastrados no equipamento.
            </p>
          )}
        </form>

        <div className="space-y-2">
          {results.map(equipment => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              active={equipment.id === selectedEquipment?.id}
              onOpen={onOpenEquipment}
            />
          ))}
          {!loading && results.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/15 bg-[#171c22] p-6 text-center text-sm text-slate-500">
              Nenhum resultado carregado.
            </div>
          )}
        </div>
      </section>

      <EquipmentDetail
        equipment={selectedEquipment}
        owner={owner}
        onViewOwner={onViewOwner}
        onTrigger={onTrigger}
      />
    </div>
  );
}

function AlertasView({
  alerts,
  selectedEquipment,
  owner,
  loading,
  onOpenEquipment,
  onViewOwner,
  onTrigger,
}: {
  alerts: EquipmentSummary[];
  selectedEquipment: EquipmentSummary | null;
  owner: OwnerData | null;
  loading: boolean;
  onOpenEquipment: (equipment: EquipmentSummary) => void;
  onViewOwner: (equipment: EquipmentSummary) => void;
  onTrigger: (equipment: EquipmentSummary) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(320px,430px)_1fr]">
      <section className="space-y-2">
        {loading && (
          <div className="rounded-lg border border-white/10 bg-[#171c22] p-4 text-sm text-slate-400">
            Carregando alertas...
          </div>
        )}
        {alerts.map(alert => (
          <EquipmentCard
            key={alert.id}
            equipment={alert}
            active={alert.id === selectedEquipment?.id}
            onOpen={onOpenEquipment}
          />
        ))}
        {!loading && alerts.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/15 bg-[#171c22] p-6 text-center text-sm text-slate-500">
            Nenhum alerta ativo.
          </div>
        )}
      </section>
      <EquipmentDetail
        equipment={selectedEquipment}
        owner={owner}
        onViewOwner={onViewOwner}
        onTrigger={onTrigger}
      />
    </div>
  );
}

function HistoricoView({ logs, loading }: { logs: AccessLog[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#171c22]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-black text-white">Registros de auditoria</p>
      </div>
      <div className="divide-y divide-white/10">
        {loading && (
          <div className="p-4 text-sm text-slate-400">Carregando histórico...</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">Nenhum registro encontrado.</div>
        )}
        {logs.map(log => (
          <div key={log.id} className="grid gap-3 p-4 lg:grid-cols-[170px_1fr_170px]">
            <div>
              <p className="text-xs font-bold text-slate-300">{formatDate(log.createdAt)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{log.institution}</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">{actionLabel(log.action)}</p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {log.searchTerm ? `Busca: ${log.searchTerm}` : log.reasonText || log.resourceId || 'Registro operacional'}
              </p>
            </div>
            <div className="min-w-0 lg:text-right">
              <p className="truncate text-xs font-bold text-slate-300">{log.userName || log.userEmail}</p>
              <p className="mt-1 text-[11px] text-slate-500">{roleLabel(log.role)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function InstitucionalPortal({ view }: { view: PortalView }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<InstitutionalUser | null>(() => readStoredUser());
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('geral');
  const [searchResults, setSearchResults] = useState<EquipmentSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [imageSearchDataUrl, setImageSearchDataUrl] = useState('');
  const [imageSearchName, setImageSearchName] = useState('');
  const [alerts, setAlerts] = useState<EquipmentSummary[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSummary | null>(null);
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [modal, setModal] = useState<ReasonModalState | null>(null);
  const [notice, setNotice] = useState('');

  const authenticatedView = view === 'login' ? 'dashboard' : view;
  const selectedInstitution = searchParams.get('instituicao');
  const loginContext = useMemo(() => loginContextFromParam(selectedInstitution), [selectedInstitution]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await institutionalRequest<{ token: string; user: InstitutionalUser }>('/institutional/login', null, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    navigate('/institucional/dashboard', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    if (token) {
      institutionalRequest('/institutional/logout', token, { method: 'POST' }).catch(() => undefined);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    navigate('/forcasdeseguranca', { replace: true });
  }, [navigate, token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setDashboardLoading(true);
    try {
      const data = await institutionalRequest<DashboardData>('/institutional/dashboard', token);
      setDashboard(data);
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  const loadAlerts = useCallback(async () => {
    if (!token) return;
    setAlertsLoading(true);
    try {
      const data = await institutionalRequest<{ alerts: EquipmentSummary[] }>('/institutional/alerts', token);
      setAlerts(data.alerts || []);
    } finally {
      setAlertsLoading(false);
    }
  }, [token]);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const data = await institutionalRequest<{ logs: AccessLog[] }>('/institutional/logs', token);
      setLogs(data.logs || []);
    } finally {
      setLogsLoading(false);
    }
  }, [token]);

  const openEquipment = useCallback(async (equipment: EquipmentSummary) => {
    if (!token) return;
    const data = await institutionalRequest<{ equipment: EquipmentSummary }>(`/institutional/equipment/${equipment.id}`, token);
    setSelectedEquipment(data.equipment);
    setOwner(null);
  }, [token]);

  const handleImageSearchFile = useCallback((file: File | null) => {
    setImageSearchDataUrl('');
    setImageSearchName('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Envie uma imagem valida para a busca por foto.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSearchDataUrl(String(reader.result || ''));
      setImageSearchName(file.name);
      setNotice('');
    };
    reader.onerror = () => setNotice('Nao foi possivel ler a imagem enviada.');
    reader.readAsDataURL(file);
  }, []);

  const submitSearch = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setNotice('');
    if (searchType === 'foto' && !imageSearchDataUrl) {
      setNotice('Envie uma foto para realizar a busca por imagem.');
      return;
    }

    setSearchLoading(true);
    try {
      if (searchType === 'foto') {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set('q', searchTerm.trim());
        const data = await institutionalRequest<{ results: EquipmentSummary[] }>(`/institutional/image-candidates?${params}`, token);
        const rankedResults = await rankResultsByImageSimilarity(data.results || [], imageSearchDataUrl);
        setSearchResults(rankedResults);
        setSelectedEquipment(null);
        setOwner(null);
        if (!rankedResults.length) {
          setNotice('Nenhum equipamento semelhante foi encontrado com a foto enviada.');
        }
        return;
      }

      const params = new URLSearchParams({ q: searchTerm, type: searchType });
      const data = await institutionalRequest<{ results: EquipmentSummary[] }>(`/institutional/search?${params}`, token);
      setSearchResults(data.results || []);
      setSelectedEquipment(null);
      setOwner(null);
    } catch (searchError) {
      setNotice(searchError instanceof Error ? searchError.message : 'Não foi possível consultar.');
    } finally {
      setSearchLoading(false);
    }
  }, [imageSearchDataUrl, searchTerm, searchType, token]);

  const submitReason = useCallback(async (reason: string, reasonText: string) => {
    if (!token || !modal) return;
    const endpoint = modal.mode === 'owner'
      ? `/institutional/equipment/${modal.equipment.id}/view-owner`
      : `/institutional/equipment/${modal.equipment.id}/trigger-bike-segura`;
    const data = await institutionalRequest<{ owner?: OwnerData; message?: string }>(endpoint, token, {
      method: 'POST',
      body: JSON.stringify({ reason, reasonText }),
    });
    if (modal.mode === 'owner' && data.owner) {
      setOwner(data.owner);
      setNotice('Dados do proprietário liberados e registrados em auditoria.');
    } else {
      setNotice(data.message || 'Acionamento registrado.');
    }
    setModal(null);
  }, [modal, token]);

  useEffect(() => {
    if (view !== 'login' && (!token || !user)) {
      navigate('/institucional/login', { replace: true });
    }
    if (view === 'login' && token && user) {
      navigate('/institucional/dashboard', { replace: true });
    }
  }, [navigate, token, user, view]);

  useEffect(() => {
    if (!token || view === 'login') return;
    if (view === 'dashboard') loadDashboard().catch(() => setNotice('Não foi possível carregar o dashboard.'));
    if (view === 'alertas') loadAlerts().catch(() => setNotice('Não foi possível carregar os alertas.'));
    if (view === 'historico') loadLogs().catch(() => setNotice('Não foi possível carregar o histórico.'));
  }, [loadAlerts, loadDashboard, loadLogs, token, view]);

  const currentNavItem = useMemo(
    () => NAV_ITEMS.find(item => item.view === authenticatedView) || DEFAULT_NAV_ITEM,
    [authenticatedView],
  );

  if (view === 'login' || !token || !user) {
    return <LoginScreen onLogin={login} context={loginContext} />;
  }

  return (
    <Shell
      user={user}
      view={currentNavItem.view}
      onNavigate={item => navigate(item.path)}
      onLogout={logout}
    >
      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice('')} className="text-amber-100/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {view === 'dashboard' && <DashboardView data={dashboard} loading={dashboardLoading} />}
      {view === 'consulta' && (
        <ConsultaView
          searchTerm={searchTerm}
          searchType={searchType}
          results={searchResults}
          selectedEquipment={selectedEquipment}
          owner={owner}
          loading={searchLoading}
          imagePreview={imageSearchDataUrl}
          imageName={imageSearchName}
          onSearchTerm={setSearchTerm}
          onSearchType={setSearchType}
          onImageFile={handleImageSearchFile}
          onSearch={submitSearch}
          onOpenEquipment={openEquipment}
          onViewOwner={equipment => setModal({ mode: 'owner', equipment })}
          onTrigger={equipment => setModal({ mode: 'trigger', equipment })}
        />
      )}
      {view === 'alertas' && (
        <AlertasView
          alerts={alerts}
          selectedEquipment={selectedEquipment}
          owner={owner}
          loading={alertsLoading}
          onOpenEquipment={openEquipment}
          onViewOwner={equipment => setModal({ mode: 'owner', equipment })}
          onTrigger={equipment => setModal({ mode: 'trigger', equipment })}
        />
      )}
      {view === 'historico' && <HistoricoView logs={logs} loading={logsLoading} />}

      {modal && (
        <ReasonModal
          state={modal}
          onClose={() => setModal(null)}
          onSubmit={submitReason}
        />
      )}
    </Shell>
  );
}
