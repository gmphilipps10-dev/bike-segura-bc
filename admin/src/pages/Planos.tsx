import { useState, useEffect } from 'react'
import { Star, Shield, Gem, CheckCircle } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

const PLANOS = [
  { id: 'bronze', nome: 'Bronze', cor: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Star, desc: 'QR Code + alerta de furto, sem geocerca' },
  { id: 'prata', nome: 'Prata', cor: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Shield, desc: 'TAG Bluetooth para localização assistida' },
  { id: 'ouro', nome: 'Ouro', cor: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Gem, desc: 'GPS 4G + geocerca + Ativar Protecao' },
  { id: 'diamante', nome: 'Diamante', cor: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Gem, desc: 'TAG + GPS + protecao premium completa' },
]

type PlanoId = 'bronze' | 'prata' | 'ouro' | 'diamante'
type Precos = Record<PlanoId, number>

const PRECOS_PADRAO: Precos = { bronze: 50, prata: 150, ouro: 300, diamante: 450 }
const PRECOS_MENSAIS_LEGADOS: Precos = { bronze: 4.17, prata: 12.5, ouro: 25, diamante: 37.5 }

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function mensalidadeDoAnual(valorAnual: number) {
  return Number(((valorAnual || 0) / 12).toFixed(2))
}

function diariaDoAnual(valorAnual: number) {
  return Number(((valorAnual || 0) / 365).toFixed(2))
}

export default function Planos() {
  const [stats, setStats] = useState({
    totalBronze: 0, totalPrata: 0, totalOuro: 0, totalDiamante: 0, totalGeral: 0
  })
  const [precos, setPrecos] = useState<Precos>(PRECOS_PADRAO)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/pagamentos/planos`),
    ])
      .then(async ([usersRes, precosRes]) => {
        const users = usersRes.ok ? await usersRes.json() : []
        const config = precosRes.ok ? await precosRes.json() : null
        const u = Array.isArray(users) ? users : []
        setStats({
          totalBronze: u.filter((x: any) => x.plano === 'bronze').length,
          totalPrata: u.filter((x: any) => x.plano === 'prata').length,
          totalOuro: u.filter((x: any) => x.plano === 'ouro').length,
          totalDiamante: u.filter((x: any) => x.plano === 'diamante').length,
          totalGeral: u.length,
        })
        if (config?.precosAnuais) setPrecos({ ...PRECOS_PADRAO, ...config.precosAnuais })
        else if (config?.precos && config.periodicidade === 'mensal') {
          setPrecos(Object.fromEntries(
            Object.entries({ ...PRECOS_MENSAIS_LEGADOS, ...config.precos }).map(([plano, valor]) => [
              plano,
              Number((Number(valor) * 12).toFixed(2)),
            ])
          ) as Precos)
        } else if (config?.precos) setPrecos({ ...PRECOS_PADRAO, ...config.precos })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const alterarPreco = (id: PlanoId, valor: string) => {
    setPrecos(atual => ({ ...atual, [id]: Number(valor) }))
    setMensagem('')
    setErro('')
  }

  const salvar = async () => {
    setSalvando(true)
    setMensagem('')
    setErro('')
    try {
      const res = await fetch(`${API_BASE}/pagamentos/planos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ precos }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Nao foi possivel salvar.')
      setPrecos({ ...PRECOS_PADRAO, ...(data.precosAnuais || data.precos) })
      setMensagem('Valores anuais atualizados com sucesso.')
    } catch (error: any) {
      setErro(error.message || 'Nao foi possivel salvar os precos.')
    } finally {
      setSalvando(false)
    }
  }

  const planoStats = [
    { label: 'Bronze', value: stats.totalBronze, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Prata', value: stats.totalPrata, icon: Shield, color: 'text-slate-300', bg: 'bg-slate-400/10' },
    { label: 'Ouro', value: stats.totalOuro, icon: Gem, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Diamante', value: stats.totalDiamante, icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-slate-400 text-sm">Gerenciamento de planos e assinaturas</p>
        </header>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {planoStats.map(p => (
                <div key={p.label} className={`${p.bg} border border-white/5 rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                    <span className="text-slate-300 text-sm font-medium">{p.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${p.color}`}>{p.value}</p>
                  <p className="text-slate-500 text-xs mt-1">assinantes</p>
                </div>
              ))}
            </div>

            <h2 className="text-white font-bold text-lg mb-4">Detalhes dos Planos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {PLANOS.map(plano => (
                <div key={plano.nome} className={`glass-card p-5 border ${plano.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${plano.bg} flex items-center justify-center`}>
                        <plano.icon className={`w-5 h-5 ${plano.cor}`} />
                      </div>
                      <div>
                        <h3 className={`text-white font-bold ${plano.cor}`}>{plano.nome}</h3>
                        <p className="text-slate-500 text-xs">{plano.desc}</p>
                      </div>
                    </div>
                    <div className="w-36">
                      <label htmlFor={`preco-${plano.id}`} className="block text-slate-500 text-xs mb-1">Valor anual</label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">R$</span>
                        <input
                          id={`preco-${plano.id}`}
                          type="number"
                          min="0.01"
                          max="100000"
                          step="0.01"
                          value={precos[plano.id as PlanoId]}
                          onChange={event => alterarPreco(plano.id as PlanoId, event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-right text-white outline-none focus:border-amber-400"
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatCurrency(mensalidadeDoAnual(precos[plano.id as PlanoId]))}/mes
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        Menos de {formatCurrency(diariaDoAnual(precos[plano.id as PlanoId]))} por dia
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {mensagem && <p className="text-emerald-400 text-sm">{mensagem}</p>}
                {erro && <p className="text-red-400 text-sm">{erro}</p>}
              </div>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar valores anuais'}
              </button>
            </div>

            <div className="mt-8 glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-2">Informacoes</h2>
              <p className="text-slate-400 text-sm">
                Nao ha plano gratuito. Todos os usuarios devem assinar um dos planos para proteger suas bikes.
                Cada assinatura pertence a um equipamento. Aqui voce define o valor anual oficial.
                No app, o cliente escolhe se paga o total do ano ou em 12 cobrancas mensais.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
