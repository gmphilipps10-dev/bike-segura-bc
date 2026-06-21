// @ts-nocheck
import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, AlertTriangle, XCircle, Download, FileText, Table, Trash2 } from '../components/Icons'
import Sidebar from '../components/Sidebar'
import { exportarCSV, exportarPDF, exportarExcel } from '../utils/exportar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0, pagos: 0, pendentes: 0, atrasados: 0, cancelados: 0,
    faturamentoTotal: 0, faturamentoPendente: 0, faturamentoAtrasado: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pago' | 'pendente' | 'atrasado' | 'cancelado'>('todos')
  const [modalExcluir, setModalExcluir] = useState<{ aberto: boolean, pagamento: any | null }>({ aberto: false, pagamento: null })
  const [motivo, setMotivo] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro', msg: string } | null>(null)
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
    const headers = ['Usuario', 'Equipamento', 'Serie', 'Plano', 'Cobranca', 'Valor', 'Status', 'Metodo', 'Data Vencimento', 'Data Pagamento', 'Asaas ID']
    const rows = filtrados.map(p => [
      p.userName || '-',
      p.bikeName || 'Legado sem vinculo',
      p.bikeSerie || '-',
      p.plano || '-',
      p.frequencia || 'legado',
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

  const abrirModalExcluir = (pagamento: any) => {
    setModalExcluir({ aberto: true, pagamento })
    setMotivo('')
  }

  const fecharModalExcluir = () => {
    setModalExcluir({ aberto: false, pagamento: null })
    setMotivo('')
  }

  const handleExcluir = async () => {
    if (!modalExcluir.pagamento) return
    if (!motivo.trim() || motivo.trim().length < 5) {
      setToast({ tipo: 'erro', msg: 'Informe um motivo com pelo menos 5 caracteres.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setExcluindo(true)
    try {
      const res = await fetch(`${API_BASE}/pagamentos/${modalExcluir.pagamento._id}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motivo: motivo.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir cobranca.')

      setToast({ tipo: 'sucesso', msg: 'Cobranca excluida com sucesso!' })
      fecharModalExcluir()
      fetchData()
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      setToast({ tipo: 'erro', msg: `Erro: ${err.message || 'Falha na conexão'}` })
    } finally {
      setExcluindo(false)
      setTimeout(() => setToast(null), 5000)
    }
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

            <div className="glass-card overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Equipamento</th>
                    <th className="text-left p-3">Plano</th>
                    <th className="text-left p-3">Cobranca</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Metodo</th>
                    <th className="text-left p-3">Vencimento</th>
                    <th className="text-left p-3">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr><td colSpan={9} className="p-6 text-center text-slate-500">Nenhum pagamento encontrado</td></tr>
                  )}
                  {filtrados.map(p => {
                    const cfg = statusConfig[p.status] || statusConfig.pendente
                    const Icon = cfg.icon
                    return (
                      <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-medium">{p.userName || '-'}</td>
                        <td className="p-3">
                          <p className="text-white text-xs">{p.bikeName || 'Legado sem vinculo'}</p>
                          <p className="text-slate-500 text-[10px]">{p.bikeSerie || '-'}</p>
                        </td>
                        <td className="p-3 text-slate-400 capitalize">{p.plano || '-'}</td>
                        <td className="p-3 text-slate-400 capitalize text-xs">{p.frequencia || 'legado'}</td>
                        <td className="p-3 text-white">R${((p.valor || 0) / 100).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`${cfg.bg} ${cfg.cor} text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 uppercase text-xs">{p.metodoPagamento || '-'}</td>
                        <td className="p-3 text-slate-500 text-xs">{p.dataVencimento ? new Date(p.dataVencimento).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="p-3">
                          {p.status === 'pendente' && (
                            <button
                              onClick={() => abrirModalExcluir(p)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-500/10"
                              title="Excluir cobranca"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {p.status !== 'pendente' && (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal de confirmacao de exclusao */}
            {modalExcluir.aberto && modalExcluir.pagamento && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Excluir cobranca</h3>
                      <p className="text-slate-400 text-xs">Esta acao nao pode ser desfeita.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4 space-y-1">
                    <p className="text-slate-300 text-sm"><strong className="text-white">Usuario:</strong> {modalExcluir.pagamento.userName}</p>
                    <p className="text-slate-300 text-sm"><strong className="text-white">Equipamento:</strong> {modalExcluir.pagamento.bikeName || 'N/A'}</p>
                    <p className="text-slate-300 text-sm"><strong className="text-white">Plano:</strong> {modalExcluir.pagamento.plano} | <strong className="text-white">Valor:</strong> R${((modalExcluir.pagamento.valor || 0) / 100).toFixed(2)}</p>
                    <p className="text-slate-300 text-sm"><strong className="text-white">Asaas ID:</strong> <span className="text-slate-500 text-xs">{modalExcluir.pagamento.asaasId}</span></p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Motivo da exclusao *</label>
                    <textarea
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                      placeholder="Ex: Cliente desistiu, cobranca duplicada, erro no valor..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 resize-none"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-slate-500 text-[10px] mt-1 text-right">{motivo.length}/200 caracteres</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={fecharModalExcluir}
                      disabled={excluindo}
                      className="flex-1 btn-secondary py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleExcluir}
                      disabled={excluindo || !motivo.trim() || motivo.trim().length < 5}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {excluindo ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" /> Excluir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Toast */}
            {toast && (
              <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
                toast.tipo === 'sucesso'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {toast.msg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
