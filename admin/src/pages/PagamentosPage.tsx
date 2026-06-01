import { useState, useEffect } from 'react'
import { Receipt, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0, pagos: 0, pendentes: 0, atrasados: 0, cancelados: 0,
    faturamentoTotal: 0, faturamentoPendente: 0, faturamentoAtrasado: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'atrasado' | 'cancelado'>('todos')
  const token = localStorage.getItem('admin_token') || ''

  const fetchData = async () => {
    try {
      const [pagRes, stRes] = await Promise.all([
        fetch(`${API_BASE}/pagamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/pagamentos/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (pagRes.ok) {
        const data = await pagRes.json()
        setPagamentos(Array.isArray(data) ? data : [])
      }
      if (stRes.ok) {
        const data = await stRes.json()
        setStats({
          total: data.total || 0,
          pagos: data.pagos || 0,
          pendentes: data.pendentes || 0,
          atrasados: data.atrasados || 0,
          cancelados: data.cancelados || 0,
          faturamentoTotal: (data.faturamentoTotal || 0) / 100,
          faturamentoPendente: (data.faturamentoPendente || 0) / 100,
          faturamentoAtrasado: (data.faturamentoAtrasado || 0) / 100,
        })
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [token])

  let filtrados = pagamentos
  if (filtroStatus !== 'todos') {
    filtrados = filtrados.filter(p => p.status === filtroStatus)
  }

  const statusConfig = {
    pago: { icon: CheckCircle, cor: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'PAGO' },
    pendente: { icon: Clock, cor: 'text-amber-400', bg: 'bg-amber-400/10', label: 'PENDENTE' },
    atrasado: { icon: AlertTriangle, cor: 'text-red-400', bg: 'bg-red-400/10', label: 'ATRASADO' },
    cancelado: { icon: XCircle, cor: 'text-slate-400', bg: 'bg-slate-400/10', label: 'CANCELADO' },
  }

  const asaasConfigurado = stats.total > 0 || pagamentos.length > 0

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
              <p className="text-slate-400 text-sm">{stats.total} cobrancas registradas</p>
            </div>
            <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${asaasConfigurado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {asaasConfigurado ? 'Asaas conectado' : 'Aguardando dados do Asaas'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <Receipt className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-500 text-xs">Total cobrancas</p>
          </div>
          <div className="glass-card p-4 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{stats.pagos}</p>
            <p className="text-slate-500 text-xs">Pagos</p>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">R${stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-slate-500 text-xs">Faturamento total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{stats.atrasados}</p>
            <p className="text-slate-500 text-xs">Atrasados</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-white">{stats.pendentes}</p>
            <p className="text-slate-500 text-[10px]">Pendentes</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-amber-400">R${stats.faturamentoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-slate-500 text-[10px]">A receber</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-red-400">R${stats.faturamentoAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-slate-500 text-[10px]">Inadimplencia</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(['todos', 'pago', 'pendente', 'atrasado', 'cancelado'] as const).map(f => (
            <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtroStatus === f ? 'bg-amber-400 text-slate-900' : 'glass-card text-slate-400'}`}>{f === 'todos' ? 'TODOS' : f.toUpperCase()}</button>
          ))}
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {filtrados.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum pagamento registrado ainda.</p>
                <p className="text-slate-600 text-xs mt-1">Os pagamentos aparecerao aqui quando forem criados no Asaas.</p>
              </div>
            )}
            {filtrados.map(p => {
              const cfg = statusConfig[p.status as keyof typeof statusConfig] || statusConfig.pendente
              const StatusIcon = cfg.icon
              return (
                <div key={p._id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`w-4 h-4 ${cfg.cor}`} />
                        <p className="text-white font-medium text-sm">{p.userName || 'Usuario'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.cor}`}>{cfg.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase">{p.plano || '-'}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{p.userEmail || '-'}</p>
                      <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                        <span>Valor: <span className="text-white font-medium">R${((p.valor || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                        <span>Vencimento: {p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '-'}</span>
                        <span>Metodo: {p.metodoPagamento || '-'}</span>
                        {p.dataPagamento && <span className="text-emerald-400">Pago em: {new Date(p.dataPagamento).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      {p.linkPagamento && (
                        <a href={p.linkPagamento} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-[10px] hover:underline mt-1 inline-block">Ver no Asaas</a>
                      )}
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
