import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Activity, Eye, Users, Clock, Shield, TrendingUp } from '../components/Icons'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

type RankingItem = {
  total: number
  button?: string
  page?: string
}

type AdvertiserClickItem = {
  advertiser_id?: string
  advertiser_name?: string
  total: number
  hoje: number
  ultimoCliqueEm?: string
}

type AnalyticsSummary = {
  acessosHoje: number
  acessosUltimos7Dias: number
  acessosUltimos30Dias: number
  usuariosUnicos: number
  cliquesPorBotao: RankingItem[]
  cliquesAnunciantes: AdvertiserClickItem[]
  totalCliquesAnunciantes: number
  paginasMaisAcessadas: RankingItem[]
  janela: string
  lgpd?: {
    coletaDadosSensiveis: boolean
    observacao: string
  }
}

const resumoInicial: AnalyticsSummary = {
  acessosHoje: 0,
  acessosUltimos7Dias: 0,
  acessosUltimos30Dias: 0,
  usuariosUnicos: 0,
  cliquesPorBotao: [],
  cliquesAnunciantes: [],
  totalCliquesAnunciantes: 0,
  paginasMaisAcessadas: [],
  janela: 'ultimos_30_dias',
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function friendlyPage(page: string) {
  const value = page || '/'
  if (value === '/') return 'Início'
  return value
    .replace(/^\//, '')
    .replace(/-/g, ' ')
    .replace(/\//g, ' / ')
}

function formatDateTime(value?: string) {
  if (!value) return 'Ainda sem clique'
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function RankingList({
  title,
  empty,
  items,
  getLabel,
}: {
  title: string
  empty: string
  items: RankingItem[]
  getLabel: (item: RankingItem) => string
}) {
  const max = Math.max(...items.map(item => item.total), 1)

  return (
    <div className="glass-card p-5">
      <h2 className="text-white font-bold text-lg mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${getLabel(item)}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-slate-200 text-sm font-medium truncate">{getLabel(item)}</p>
                <span className="text-amber-400 text-sm font-bold">{formatNumber(item.total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  style={{ width: `${Math.max(6, (item.total / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdvertiserClicksList({ items }: { items: AdvertiserClickItem[] }) {
  const max = Math.max(...items.map(item => item.total), 1)

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-white font-bold text-lg">Cliques nos banners dos anunciantes</h2>
          <p className="text-slate-500 text-sm">Ranking dos parceiros no carrossel da tela inicial, nos ultimos 30 dias.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-300 text-xs font-semibold">
          Material para demonstrar resultado comercial
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">Ainda nao ha cliques registrados nos banners dos anunciantes.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={`${item.advertiser_id || item.advertiser_name}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{item.advertiser_name || 'Anunciante sem nome'}</p>
                  <p className="text-slate-500 text-xs">Ultimo clique: {formatDateTime(item.ultimoCliqueEm)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-400/10 px-3 py-1 text-amber-300 text-xs font-bold">
                    {formatNumber(item.total)} em 30 dias
                  </span>
                  <span className="rounded-lg bg-emerald-400/10 px-3 py-1 text-emerald-300 text-xs font-bold">
                    {formatNumber(item.hoje)} hoje
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500"
                  style={{ width: `${Math.max(6, (item.total / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary>(resumoInicial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setError('')
        const res = await fetch(`${API_BASE}/admin/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar as estatisticas.')
        setSummary({
          ...resumoInicial,
          ...data,
          cliquesPorBotao: Array.isArray(data.cliquesPorBotao) ? data.cliquesPorBotao : [],
          cliquesAnunciantes: Array.isArray(data.cliquesAnunciantes) ? data.cliquesAnunciantes : [],
          totalCliquesAnunciantes: Number(data.totalCliquesAnunciantes || 0),
          paginasMaisAcessadas: Array.isArray(data.paginasMaisAcessadas) ? data.paginasMaisAcessadas : [],
        })
      } catch (err: any) {
        setError(err.message || 'Nao foi possivel carregar as estatisticas.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [token])

  const cards = [
    {
      title: 'Acessos hoje',
      value: summary.acessosHoje,
      icon: Eye,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      title: 'Ultimos 7 dias',
      value: summary.acessosUltimos7Dias,
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: 'Ultimos 30 dias',
      value: summary.acessosUltimos30Dias,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      title: 'Usuarios unicos',
      value: summary.usuariosUnicos,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      title: 'Cliques em banners',
      value: summary.totalCliquesAnunciantes,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Estatisticas do App</h1>
              <p className="text-slate-400 text-sm">Acessos, paginas visitadas e cliques mais importantes</p>
            </div>
          </div>
        </header>

        {loading ? (
          <p className="text-slate-500">Carregando estatisticas...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
              {cards.map(card => (
                <div key={card.title} className="glass-card p-5">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-white">{formatNumber(card.value)}</p>
                  <p className="text-slate-500 text-xs mt-1">{card.title}</p>
                </div>
              ))}
            </section>

            <AdvertiserClicksList items={summary.cliquesAnunciantes} />

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <RankingList
                title="Cliques por botao"
                empty="Ainda nao ha cliques registrados."
                items={summary.cliquesPorBotao}
                getLabel={item => item.button || 'Botao sem nome'}
              />
              <RankingList
                title="Paginas mais acessadas"
                empty="Ainda nao ha paginas registradas."
                items={summary.paginasMaisAcessadas}
                getLabel={item => friendlyPage(item.page || '/')}
              />
            </section>

            <section className="mt-6 glass-card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Boas praticas LGPD</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Este modulo nao coleta CPF, endereco, localizacao precisa ou dados sensiveis.
                    Ele usa apenas eventos tecnicos necessarios para entender o uso do app.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300 text-xs">
                    <Clock className="w-3 h-3" />
                    Janela dos rankings: ultimos 30 dias
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
