import { useState, useEffect } from 'react'
import { Receipt, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

const mockFaturamento = [
  { mes: 'Jan', valor: 0 }, { mes: 'Fev', valor: 0 }, { mes: 'Mar', valor: 0 },
  { mes: 'Abr', valor: 0 }, { mes: 'Mai', valor: 0 }, { mes: 'Jun', valor: 0 },
]

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0, pagos: 0, pendentes: 0, atrasados: 0, cancelados: 0,
    faturamentoTotal: 0, faturamentoPendente: 0, faturamentoAtrasado: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'atrasado' | 'cancelado'>('todos')
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    Promise.all([
      window.fetch(`${API_BASE}/pagamentos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).catch(() => []),
      window.fetch(`${API_BASE}/pagamentos/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]).then(([pags, st]: [any, any]) => {
      setPagamentos(Array.isArray(pags) ? pags : [])
      setStats({
        total: st?.total || 0, pagos: st?.pagos || 0, pendentes: st?.pendentes || 0,
        atrasados: st?.atrasados || 0, cancelados: st?.cancelados || 0,
        faturamentoTotal: (st?.faturamentoTotal || 0) / 100,
        faturamentoPendente: (st?.faturamentoPendente || 0) / 100,
        faturamentoAtrasado: (st?.faturamentoAtrasado || 0) / 100,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  let filtrados = pagamentos
  if (filtroStatus !== 'todos') filtrados = filtrados.filter(p => p.status === filtroStatus)

  const statusConfig: any = {
    pago: { icon: CheckCircle, cor: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'PAGO' },
    pendente: { icon: Clock, cor: 'text-amber-400', bg: 'bg-amber-400/10', label: 'PENDENTE' },
    atrasado: { icon: AlertTriangle, cor: 'text-red-400', bg: 'bg-red-400/10', label: 'ATRASADO' },
    cancelado: { icon: XCircle, cor: 'text-slate-400', bg: 'bg-slate-400/10', label: 'CANCELADO' },
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
              <p className="text-slate-400 text-sm">{stats.total} cobrancas registradas</p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${stats.total > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {stats.total > 0 ? 'Asaas conectado' : 'Aguardando Asaas'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card text-center"><Receipt className="w-5 h-5 text-blue-400 mx-auto mb-2" /><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-slate-500 text-xs">Total cobrancas</p></div>
          <div className="stat-card text-center"><CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" /><p className="text-2xl font-bold text-emerald-400">{stats.pagos}</p><p className="text-slate-500 text-xs">Pagos</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" /><p className="text-2xl font-bold text-amber-400">R${stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-slate-500 text-xs">Faturamento total</p></div>
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" /><p className="text-2xl font-bold text-red-400">{stats.atrasados}</p><p className="text-slate-500 text-xs">Atrasados</p></div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card text-center"><p className="text-lg font-bold text-white">{stats.pendentes}</p><p className="text-slate-500 text-[10px]">Pendentes</p></div>
          <div className="stat-card text-center"><p className="text-lg font-bold text-amber-400">R${stats.faturamentoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-slate-500 text-[10px]">A receber</p></div>
          <div className="stat-card text-center"><p className="text-lg font-bold text-red-400">R${stats.faturamentoAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-slate-500 text-[10px]">Inadimplencia</p></div>
        </div>

        <div className="glass-panel p-5 mb-6">
          <h3 className="text-white font-semibold text-sm mb-4">Evolucao de Faturamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockFaturamento}>
              <defs><linearGradient id="fat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="valor" stroke="#f59e0b" fillOpacity={1} fill="url(#fat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(['todos', 'pago', 'pendente', 'atrasado', 'cancelado'] as const).map(f => (
            <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtroStatus === f ? 'bg-amber-400 text-slate-900' : 'glass-panel text-slate-400'}`}>{f === 'todos' ? 'TODOS' : f.toUpperCase()}</button>
          ))}
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {filtrados.length === 0 && (
              <div className="glass-panel p-8 text-center">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum pagamento registrado ainda.</p>
                <p className="text-slate-600 text-xs mt-1">Os pagamentos aparecerao aqui quando forem criados no Asaas.</p>
              </div>
            )}
            {filtrados.map(p => {
              const cfg = statusConfig[p.status] || statusConfig.pendente
              const StatusIcon = cfg.icon
              return (
                <div key={p._id} className="glass-panel p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusIcon className={`w-4 h-4 ${cfg.cor}`} />
                        <p className="text-white font-medium text-sm">{p.userName || 'Usuario'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.cor}`}>{cfg.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 uppercase">{p.plano || '-'}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{p.userEmail || '-'}</p>
                      <div className="flex gap-4 mt-2 text-[10px] text-slate-500 flex-wrap">
                        <span>Valor: <span className="text-white font-medium">R${((p.valor || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                        <span>Vencimento: {p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '-'}</span>
                        {p.dataPagamento && <span className="text-emerald-400">Pago em: {new Date(p.dataPagamento).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      {p.linkPagamento && <a href={p.linkPagamento} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-[10px] hover:underline mt-1 inline-block">Ver no Asaas</a>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
