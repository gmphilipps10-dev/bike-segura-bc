import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Bike,
  QrCode,
  ShieldAlert,
  TrendingUp,
  Activity,
  XCircle,
  CreditCard,
  AlertTriangle,
  Clock,
  Shield,
  Download,
  CheckCircle,
} from '../components/Icons'
import Sidebar from '../components/Sidebar'
import {
  EmptyState,
  FunnelChart,
  LoadingDashboard,
  MetricCard,
  RankingList,
  SectionCard,
  StatusBadge,
  formatCurrency,
  formatDateTime,
  formatNumber,
} from '../components/dashboard/DashboardWidgets'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

type DashboardData = {
  resumoPrincipal: {
    clientesTotais: number
    equipamentosCadastrados: number
    assinaturasAtivas: number
    receitaMensal: number
    alertasFurto: number
    equipamentosRecuperados: number
  }
  analytics: {
    acessosHoje: number
    acessosUltimos7Dias: number
    acessosUltimos30Dias: number
    usuariosUnicos: number
    paginasMaisAcessadas: any[]
    cliquesPorBotao: any[]
  }
  funilComercial: {
    visitantes: number
    cadastros: number
    equipamentosCadastrados: number
    assinaturasRealizadas: number
    taxaConversao: number
  }
  financeiro: {
    receitaMes: number
    receitaAno: number
    pagamentosPendentes: number
    pagamentosVencidos: number
    assinaturasAtivas: number
    assinaturasCanceladas: number
  }
  atividadeRecente: { type: string; title: string; description: string; date: string }[]
  alertasAdministrativos: Record<string, number>
  centralPendencias: {
    total: number
    urgentes: number
    atencao: number
    hoje: number
    items: {
      key: string
      label: string
      quantidade: number
      prioridade: 'verde' | 'amarelo' | 'vermelho' | string
      rota: string
    }[]
  }
  indicacoes: {
    totalIndicacoes: number
    indicacoesConvertidas: number
    ranking: { usuario: string; total: number; convertidas: number; descontoAcumulado: number }[]
  }
  sinistros: {
    alertasFurtoEmitidos: number
    alertasEmAberto: number
    equipamentosRecuperados: number
    taxaRecuperacao: number
    tempoMedioRecuperacaoHoras: number
  }
  statusSistema: {
    api: string
    mongodb: string
    armazenamentoImagens: string
    whatsapp: string
    ultimaAtualizacao: string
  }
  relatorios: string[]
}

const emptyData: DashboardData = {
  resumoPrincipal: {
    clientesTotais: 0,
    equipamentosCadastrados: 0,
    assinaturasAtivas: 0,
    receitaMensal: 0,
    alertasFurto: 0,
    equipamentosRecuperados: 0,
  },
  analytics: {
    acessosHoje: 0,
    acessosUltimos7Dias: 0,
    acessosUltimos30Dias: 0,
    usuariosUnicos: 0,
    paginasMaisAcessadas: [],
    cliquesPorBotao: [],
  },
  funilComercial: {
    visitantes: 0,
    cadastros: 0,
    equipamentosCadastrados: 0,
    assinaturasRealizadas: 0,
    taxaConversao: 0,
  },
  financeiro: {
    receitaMes: 0,
    receitaAno: 0,
    pagamentosPendentes: 0,
    pagamentosVencidos: 0,
    assinaturasAtivas: 0,
    assinaturasCanceladas: 0,
  },
  atividadeRecente: [],
  alertasAdministrativos: {},
  centralPendencias: { total: 0, urgentes: 0, atencao: 0, hoje: 0, items: [] },
  indicacoes: { totalIndicacoes: 0, indicacoesConvertidas: 0, ranking: [] },
  sinistros: {
    alertasFurtoEmitidos: 0,
    alertasEmAberto: 0,
    equipamentosRecuperados: 0,
    taxaRecuperacao: 0,
    tempoMedioRecuperacaoHoras: 0,
  },
  statusSistema: {
    api: 'offline',
    mongodb: 'desconectado',
    armazenamentoImagens: '0',
    whatsapp: '0',
    ultimaAtualizacao: '',
  },
  relatorios: [],
}

function activityColor(type: string) {
  const map: Record<string, string> = {
    cliente: 'bg-blue-400',
    equipamento: 'bg-amber-400',
    pagamento: 'bg-emerald-400',
    sinistro: 'bg-red-400',
    recuperacao: 'bg-purple-400',
    qr: 'bg-cyan-400',
  }
  return map[type] || 'bg-slate-400'
}

function priorityClasses(priority: string) {
  if (priority === 'vermelho') return 'border-red-400/20 bg-red-400/10 text-red-300'
  if (priority === 'amarelo') return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
  return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError('')
        const res = await fetch(`${API_BASE}/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Nao foi possivel carregar o dashboard.')
        setData({ ...emptyData, ...json })
      } catch (err: any) {
        setError(err.message || 'Nao foi possivel carregar o dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

  const resumo = data.resumoPrincipal
  const analytics = data.analytics
  const funil = data.funilComercial
  const financeiro = data.financeiro
  const sinistros = data.sinistros

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Painel operacional</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">Dashboard Bike Segura BC</h1>
            <p className="text-slate-400 text-sm mt-1">Gestao comercial, financeira, operacional e de seguranca em um unico lugar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/analytics" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-amber-400/40 hover:text-amber-300 transition-colors">
              Ver estatisticas
            </Link>
            <Link to="/relatorios" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-300 transition-colors">
              Relatorios
            </Link>
          </div>
        </header>

        {loading ? (
          <LoadingDashboard />
        ) : error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-200 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              <MetricCard title="Clientes totais" value={formatNumber(resumo.clientesTotais)} icon={Users} color="text-blue-400" bg="bg-blue-400/10" link="/clientes" />
              <MetricCard title="Equipamentos cadastrados" value={formatNumber(resumo.equipamentosCadastrados)} icon={Bike} color="text-amber-400" bg="bg-amber-400/10" link="/equipamentos" />
              <MetricCard title="Assinaturas ativas" value={formatNumber(resumo.assinaturasAtivas)} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-400/10" link="/planos" />
              <MetricCard title="Receita mensal" value={formatCurrency(resumo.receitaMensal)} icon={CreditCard} color="text-purple-400" bg="bg-purple-400/10" link="/pagamentos" />
              <MetricCard title="Alertas de furto" value={formatNumber(resumo.alertasFurto)} icon={ShieldAlert} color="text-red-400" bg="bg-red-400/10" link="/sinistros" />
              <MetricCard title="Recuperados" value={formatNumber(resumo.equipamentosRecuperados)} icon={Shield} color="text-cyan-400" bg="bg-cyan-400/10" link="/sinistros" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <SectionCard title="Analytics do app" subtitle="Eventos agregados sem CPF, endereco ou localizacao precisa">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard title="Acessos hoje" value={formatNumber(analytics.acessosHoje)} icon={Activity} color="text-emerald-400" bg="bg-emerald-400/10" />
                  <MetricCard title="Ultimos 7 dias" value={formatNumber(analytics.acessosUltimos7Dias)} icon={TrendingUp} color="text-blue-400" bg="bg-blue-400/10" />
                  <MetricCard title="Ultimos 30 dias" value={formatNumber(analytics.acessosUltimos30Dias)} icon={Clock} color="text-amber-400" bg="bg-amber-400/10" />
                  <MetricCard title="Usuarios unicos" value={formatNumber(analytics.usuariosUnicos)} icon={Users} color="text-purple-400" bg="bg-purple-400/10" />
                </div>
              </SectionCard>

              <SectionCard title="Funil comercial" subtitle="Conversao dos ultimos 30 dias">
                <FunnelChart items={[
                  { label: 'Visitantes', value: funil.visitantes },
                  { label: 'Cadastros', value: funil.cadastros },
                  { label: 'Equipamentos cadastrados', value: funil.equipamentosCadastrados },
                  { label: 'Assinaturas realizadas', value: funil.assinaturasRealizadas },
                ]} />
                <div className="mt-4 rounded-xl bg-amber-400/10 border border-amber-400/20 p-3">
                  <p className="text-amber-300 text-xs">Taxa de conversao</p>
                  <p className="text-white text-2xl font-bold">{funil.taxaConversao}%</p>
                </div>
              </SectionCard>

              <SectionCard title="Financeiro" subtitle="Receita e cobrancas">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard title="Receita do mes" value={formatCurrency(financeiro.receitaMes)} icon={CreditCard} color="text-emerald-400" bg="bg-emerald-400/10" />
                  <MetricCard title="Receita anual" value={formatCurrency(financeiro.receitaAno)} icon={TrendingUp} color="text-amber-400" bg="bg-amber-400/10" />
                  <MetricCard title="Pendentes" value={formatNumber(financeiro.pagamentosPendentes)} icon={Clock} color="text-blue-400" bg="bg-blue-400/10" />
                  <MetricCard title="Vencidos" value={formatNumber(financeiro.pagamentosVencidos)} icon={AlertTriangle} color="text-red-400" bg="bg-red-400/10" />
                  <MetricCard title="Ativas" value={formatNumber(financeiro.assinaturasAtivas)} icon={CheckCircle} color="text-purple-400" bg="bg-purple-400/10" />
                  <MetricCard title="Canceladas" value={formatNumber(financeiro.assinaturasCanceladas)} icon={XCircle} color="text-slate-300" bg="bg-slate-400/10" />
                </div>
              </SectionCard>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionCard title="Atividade recente" subtitle="Ultimos eventos operacionais">
                {!data.atividadeRecente.length ? <EmptyState text="Nenhuma atividade recente registrada." /> : (
                  <div className="space-y-3">
                    {data.atividadeRecente.map((item, index) => (
                      <div key={`${item.type}-${item.date}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <div className={`w-2.5 h-2.5 rounded-full mt-2 ${activityColor(item.type)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="text-white text-sm font-semibold">{item.title}</p>
                            <span className="text-slate-500 text-xs">{formatDateTime(item.date)}</span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1 truncate">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Central de Pendências" subtitle="Itens que precisam de decisão operacional">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-slate-500 text-[11px]">Total</p>
                    <p className="text-white text-2xl font-bold">{formatNumber(data.centralPendencias.total)}</p>
                  </div>
                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3">
                    <p className="text-red-300 text-[11px]">Urgentes</p>
                    <p className="text-red-300 text-2xl font-bold">{formatNumber(data.centralPendencias.urgentes)}</p>
                  </div>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                    <p className="text-amber-300 text-[11px]">Atenção</p>
                    <p className="text-amber-300 text-2xl font-bold">{formatNumber(data.centralPendencias.atencao)}</p>
                  </div>
                  <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3">
                    <p className="text-blue-300 text-[11px]">Hoje</p>
                    <p className="text-blue-300 text-2xl font-bold">{formatNumber(data.centralPendencias.hoje)}</p>
                  </div>
                </div>

                {!data.centralPendencias.items.length ? <EmptyState text="Nenhuma pendência configurada." /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.centralPendencias.items.map(item => (
                      <Link
                        key={item.key}
                        to={item.rota}
                        className="rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:border-amber-400/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-slate-300 text-sm">{item.label}</p>
                            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${priorityClasses(item.prioridade)}`}>
                              {item.prioridade}
                            </span>
                          </div>
                          <span className={`text-xl font-bold ${Number(item.quantidade) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{formatNumber(Number(item.quantidade))}</span>
                        </div>
                        <div className="mt-3 inline-flex rounded-lg border border-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
                          Abrir →
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <SectionCard title="Indique e Ganhe" subtitle="Performance das indicacoes">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <MetricCard title="Total de indicacoes" value={formatNumber(data.indicacoes.totalIndicacoes)} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
                  <MetricCard title="Convertidas" value={formatNumber(data.indicacoes.indicacoesConvertidas)} icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-400/10" />
                </div>
                {!data.indicacoes.ranking.length ? <EmptyState text="Ainda nao ha indicacoes registradas." /> : (
                  <div className="space-y-2">
                    {data.indicacoes.ranking.map((item, index) => (
                      <div key={`${item.usuario}-${index}`} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-semibold">{index + 1}. {item.usuario}</p>
                          <p className="text-amber-400 text-sm font-bold">{item.descontoAcumulado}%</p>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{item.total} indicacoes • {item.convertidas} convertidas</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Sinistros" subtitle="Alertas e recuperacao">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard title="Alertas emitidos" value={formatNumber(sinistros.alertasFurtoEmitidos)} icon={ShieldAlert} color="text-red-400" bg="bg-red-400/10" link="/sinistros" />
                  <MetricCard title="Em aberto" value={formatNumber(sinistros.alertasEmAberto)} icon={AlertTriangle} color="text-amber-400" bg="bg-amber-400/10" link="/sinistros" />
                  <MetricCard title="Recuperados" value={formatNumber(sinistros.equipamentosRecuperados)} icon={Shield} color="text-emerald-400" bg="bg-emerald-400/10" link="/sinistros" />
                  <MetricCard title="Taxa recuperacao" value={`${sinistros.taxaRecuperacao}%`} icon={TrendingUp} color="text-purple-400" bg="bg-purple-400/10" link="/sinistros" />
                </div>
                <p className="mt-4 text-slate-500 text-xs">Tempo medio ate recuperacao: {sinistros.tempoMedioRecuperacaoHoras || 0}h</p>
              </SectionCard>

              <SectionCard title="Status do sistema" subtitle="Saude operacional">
                <div className="space-y-3">
                  {[
                    ['API', data.statusSistema.api],
                    ['MongoDB', data.statusSistema.mongodb],
                    ['Armazenamento de imagens', data.statusSistema.armazenamentoImagens],
                    ['WhatsApp', data.statusSistema.whatsapp],
                  ].map(([label, status]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                      <p className="text-slate-300 text-sm">{label}</p>
                      <StatusBadge status={status} />
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-4">Ultima atualizacao: {formatDateTime(data.statusSistema.ultimaAtualizacao)}</p>
              </SectionCard>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionCard title="Paginas mais acessadas" subtitle="Analytics dos ultimos 30 dias">
                <RankingList items={analytics.paginasMaisAcessadas || []} labelKey="page" empty="Ainda nao ha paginas registradas." />
              </SectionCard>

              <SectionCard title="Botoes mais clicados" subtitle="Eventos button_click dos ultimos 30 dias">
                <RankingList items={analytics.cliquesPorBotao || []} labelKey="button" empty="Ainda nao ha cliques registrados." />
              </SectionCard>
            </section>

            <SectionCard title="Relatorios e LGPD" subtitle="Estrutura preparada para CSV/PDF">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(data.relatorios || []).map(item => (
                    <Link key={item} to="/relatorios" className="rounded-xl border border-white/5 bg-white/[0.03] p-4 hover:border-amber-400/30 transition-colors">
                      <Download className="w-4 h-4 text-amber-400 mb-2" />
                      <p className="text-white text-sm capitalize">{item.replace(/_/g, ' ')}</p>
                      <p className="text-slate-500 text-[11px] mt-1">CSV/PDF</p>
                    </Link>
                  ))}
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-white font-bold">Seguranca e LGPD</h3>
                      <p className="text-emerald-100/80 text-sm mt-2">
                        O Dashboard trabalha com indicadores agregados. Analytics nao coleta CPF, endereco completo,
                        localizacao precisa nem dados sensiveis, e listas administrativas devem manter dados pessoais mascarados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  )
}
