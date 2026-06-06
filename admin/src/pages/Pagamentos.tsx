import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, AlertTriangle, XCircle, Download, FileText, Table } from '../components/Icons'
import Sidebar from '../components/Sidebar'
import { exportarCSV, exportarPDF, exportarExcel } from '../utils/exportar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0, pagos: 0, pendentes: 0, atrasados: 0, cancelados: 0,
    faturamentoTotal: 0, faturamentoPendente: 0, faturamentoAtrasado: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pago' | 'pendente' | 'atrasado' | 'cancelado'>('todos')
  const token = localStorage.getItem('admin_token') || ''

  const fetchData = () => {
    Promise.all([
      fetch(`${API_BASE}/pagamentos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/pagamentos/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}),
    ])
      .then(([pags, st]) => {
        setPagamentos(Array.isArray(pags) ? pags : [])
        setStats({
          total: st.total || 0,
          pagos: st.pagos || 0,
          pendentes: st.pendentes || 0,
          atrasados: st.atrasados || 0,
          cancelados: st.cancelados || 0,
          faturamentoTotal: st.faturamentoTotal || 0,
          faturamentoPendente: st.faturamentoPendente || 0,
          faturamentoAtrasado: st.faturamentoAtrasado || 0,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [token])

  const filtrados = filtro === 'todos' ? pagamentos : pagamentos.filter(p => p.status === filtro)

  const statusConfig: Record<string, { label: string, cor: string, bg: string, icon: any }> = {
    pago: { label: 'PAGO', cor: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
    pendente: { label: 'PENDENTE', cor: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
    atrasado: { label: 'ATRASADO', cor: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
    cancelado: { label: 'CANCELADO', cor: 'text-slate-400', bg: 'bg-slate-500/10', icon: XCircle },
  }

  const getExportData = () => {
    const headers = ['Usuario', 'Plano', 'Valor', 'Status', 'Metodo', 'Data Vencimento', 'Data Pagamento', 'Asaas ID']
    const rows = filtrados.map(p => [
      p.userName || '-',
      p.plano || '-',
      `R$ ${((p.valor || 0) / 100).toFixed(2)}`,
      p.status || '-',
      p.metodoPagamento || '-',
      p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '-',
      p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString('pt-BR') : '-',
      p.asaasId || '-',
    ])
    return { headers, rows }
  }

  const handleExportarCSV = () => {
    const { headers, rows } = getExportData()
    exportarCSV(`pagamentos-${filtro}`, headers, rows)
  }

  const handleExportarPDF = () => {
    const { headers, rows } = getExportData()
    exportarPDF(
      'Relatorio de Pagamentos',
      `Filtro: ${filtro.toUpperCase()} | Total: ${filtrados.length} registros`,
      headers, rows,
      [
        { label: 'Total cobrancas', value: String(stats.total) },
        { label: 'Pagos', value: `R$ ${(stats.faturamentoTotal / 100).toFixed(2)}` },
        { label: 'Pendentes', value: `R$ ${(stats.faturamentoPendente / 100).toFixed(2)}` },
        { label: 'Atrasados', value: `R$ ${(stats.faturamentoAtrasado / 100).toFixed(2)}` },
      ]
    )
  }

  const handleExportarExcel = () => {
    const { headers, rows } = getExportData()
    exportarExcel(`pagamentos-${filtro}`, 'Pagamentos', headers, rows, [
      { label: 'Total cobrancas', value: String(stats.total) },
      { label: 'Pagos', value: `R$ ${(stats.faturamentoTotal / 100).toFixed(2)}` },
      { label: 'Pendentes', value: `R$ ${(stats.faturamentoPendente / 100).toFixed(2)}` },
      { label: 'Atrasados', value: `R$ ${(stats.faturamentoAtrasado / 100).toFixed(2)}` },
    ])
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
          <p className="text-slate-400 text-sm">Gestao de cobrancas e faturamento</p>
        </header>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <p className="text-slate-500 text-xs">Total Cobrancas</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="glass-card p-4 border-emerald-500/10">
                <p className="text-emerald-400 text-xs">Pagos</p>
                <p className="text-emerald-400 text-2xl font-bold">{stats.pagos}</p>
                <p className="text-slate-500 text-[10px]">R${(stats.faturamentoTotal / 100).toFixed(2)}</p>
              </div>
              <div className="glass-card p-4 border-amber-500/10">
                <p className="text-amber-400 text-xs">Pendentes</p>
                <p className="text-amber-400 text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-slate-500 text-[10px]">R${(stats.faturamentoPendente / 100).toFixed(2)}</p>
              </div>
              <div className="glass-card p-4 border-red-500/10">
                <p className="text-red-400 text-xs">Atrasados</p>
                <p className="text-red-400 text-2xl font-bold">{stats.atrasados}</p>
                <p className="text-slate-500 text-[10px]">R${(stats.faturamentoAtrasado / 100).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'pago', 'pendente', 'atrasado', 'cancelado'] as const).map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${filtro === f ? 'bg-amber-400 text-slate-900' : 'glass-card text-slate-400'}`}>
                    {f === 'todos' ? 'TODOS' : f.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportarCSV} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar CSV">
                  <Download className="w-3 h-3" />CSV
                </button>
                <button onClick={handleExportarPDF} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar PDF">
                  <FileText className="w-3 h-3" />PDF
                </button>
                <button onClick={handleExportarExcel} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar Excel">
                  <Table className="w-3 h-3" />Excel
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Plano</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Metodo</th>
                    <th className="text-left p-3">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhum pagamento encontrado</td></tr>
                  )}
                  {filtrados.map(p => {
                    const cfg = statusConfig[p.status] || statusConfig.pendente
                    const Icon = cfg.icon
                    return (
                      <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-medium">{p.userName || '-'}</td>
                        <td className="p-3 text-slate-400 capitalize">{p.plano || '-'}</td>
                        <td className="p-3 text-white">R${((p.valor || 0) / 100).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`${cfg.bg} ${cfg.cor} text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 uppercase text-xs">{p.metodoPagamento || '-'}</td>
                        <td className="p-3 text-slate-500 text-xs">{p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
