// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import {
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Table,
  Plus,
  TrendingUp,
  Trash2,
} from '../components/Icons'
import { exportarCSV, exportarPDF } from '../utils/exportar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

const emptyForm = {
  nome_fantasia: '',
  razao_social: '',
  cnpj: '',
  responsavel: '',
  telefone_whatsapp: '',
  email: '',
  endereco: '',
  cidade: 'Balneario Camboriu',
  codigo_parceiro: '',
  percentual_comissao: 10,
  status: 'ativa',
}

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dateBR(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ativa: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    inativa: 'bg-slate-500/10 text-slate-300 border-slate-400/20',
    pago: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    pending: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    cancelled: 'bg-red-500/10 text-red-300 border-red-400/20',
    pendente: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    atrasado: 'bg-red-500/10 text-red-300 border-red-400/20',
    cancelado: 'bg-slate-500/10 text-slate-300 border-slate-400/20',
  }
  return `inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] || map.pendente}`
}

export default function LojasParceiras() {
  const [tab, setTab] = useState('cadastro')
  const [lojas, setLojas] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ total_vendido: 0, total_comissao_pendente: 0, total_comissao_paga: 0, comissao_por_loja: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [manualStore, setManualStore] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState({
    storeId: '',
    from: '',
    to: '',
    plan: '',
    payment_status: '',
    commission_status: '',
  })
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7))
  const [reportRows, setReportRows] = useState<any[]>([])
  const token = localStorage.getItem('admin_token') || ''

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const query = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return params.toString()
  }, [filters])

  const loadStores = async () => {
    const res = await fetch(`${API_BASE}/partner-stores`, { headers: authHeaders })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar as lojas.')
    setLojas(Array.isArray(data) ? data : [])
  }

  const loadSales = async () => {
    const res = await fetch(`${API_BASE}/partner-stores/sales${query ? `?${query}` : ''}`, { headers: authHeaders })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar as vendas.')
    setVendas(Array.isArray(data.items) ? data.items : [])
  }

  const loadSummary = async () => {
    const res = await fetch(`${API_BASE}/partner-stores/commissions/summary${query ? `?${query}` : ''}`, { headers: authHeaders })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar as comissoes.')
    setSummary({
      total_vendido: data.total_vendido || 0,
      total_comissao_pendente: data.total_comissao_pendente || 0,
      total_comissao_paga: data.total_comissao_paga || 0,
      comissao_por_loja: Array.isArray(data.comissao_por_loja) ? data.comissao_por_loja : [],
    })
  }

  const loadAll = async () => {
    try {
      setError('')
      await Promise.all([loadStores(), loadSales(), loadSummary()])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar modulo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [token, query])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const resetForm = () => {
    setEditingId('')
    setForm(emptyForm)
  }

  const saveStore = async () => {
    setSaving(true)
    try {
      const url = editingId ? `${API_BASE}/partner-stores/${editingId}` : `${API_BASE}/partner-stores`
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar loja.')
      resetForm()
      await loadStores()
      showToast(editingId ? 'Loja atualizada.' : 'Loja cadastrada.')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar loja.')
    } finally {
      setSaving(false)
    }
  }

  const editStore = (loja: any) => {
    setEditingId(loja.id)
    setForm({
      ...emptyForm,
      ...loja,
      percentual_comissao: Number(loja.percentual_comissao || 10),
    })
    setTab('cadastro')
  }

  const deleteStore = async (loja: any) => {
    const confirmou = window.confirm(`Excluir a loja parceira "${loja.nome_fantasia}"? Esta acao nao pode ser desfeita.`)
    if (!confirmou) return

    setDeletingId(loja.id)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/partner-stores/${loja.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir loja.')
      if (editingId === loja.id) resetForm()
      await Promise.all([loadStores(), loadSales(), loadSummary()])
      showToast('Loja parceira excluida.')
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir loja.')
    } finally {
      setDeletingId('')
    }
  }

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link)
    showToast('Link copiado.')
  }

  const openQrCode = (link: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(link)}`
    window.open(qrUrl, '_blank', 'noopener,noreferrer')
  }

  const markPaid = async (sale: any) => {
    const observation = window.prompt('Observacao do pagamento da comissao:', 'Comissao paga manualmente')
    if (observation === null) return
    const res = await fetch(`${API_BASE}/partner-stores/sales/${sale.id}/commission/paid`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ payment_observation: observation }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Erro ao marcar comissao como paga.')
      return
    }
    await Promise.all([loadSales(), loadSummary()])
    showToast('Comissao marcada como paga.')
  }

  const updateSaleStore = async (sale: any) => {
    const partner_store_id = manualStore[sale.id]
    if (!partner_store_id) return
    const observation = window.prompt('Motivo da alteracao manual:', 'Ajuste administrativo da origem da venda')
    if (observation === null) return
    const res = await fetch(`${API_BASE}/partner-stores/sales/${sale.id}/store`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ partner_store_id, observation }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Erro ao alterar loja vinculada.')
      return
    }
    await Promise.all([loadSales(), loadSummary()])
    showToast('Loja vinculada alterada.')
  }

  const generateMonthlyReport = async () => {
    const res = await fetch(`${API_BASE}/partner-stores/reports/monthly?month=${reportMonth}${filters.storeId ? `&storeId=${filters.storeId}` : ''}`, { headers: authHeaders })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Erro ao gerar relatorio.')
      return
    }
    setReportRows(Array.isArray(data.rows) ? data.rows : [])
    showToast('Relatorio mensal gerado.')
  }

  const exportReportCSV = () => {
    const headers = ['Loja', 'Periodo', 'Qtd vendas', 'Vendas por plano', 'Total vendido', 'Comissao 10%', 'Comissoes pagas', 'Saldo pendente']
    const rows = reportRows.map(row => [
      row.nome_loja,
      reportMonth,
      row.quantidade_vendas,
      row.vendas_por_plano || '-',
      money(row.valor_total_vendido),
      money(row.comissao_total),
      money(row.comissoes_pagas),
      money(row.saldo_pendente),
    ])
    exportarCSV(`lojas-parceiras-${reportMonth}`, headers, rows)
  }

  const exportReportPDF = () => {
    const headers = ['Loja', 'Qtd', 'Por plano', 'Vendido', 'Comissao', 'Pago', 'Pendente']
    const rows = reportRows.map(row => [
      row.nome_loja,
      row.quantidade_vendas,
      row.vendas_por_plano || '-',
      money(row.valor_total_vendido),
      money(row.comissao_total),
      money(row.comissoes_pagas),
      money(row.saldo_pendente),
    ])
    exportarPDF('Relatorio de Lojas Parceiras', `Periodo: ${reportMonth}`, headers, rows)
  }

  const pendingSales = vendas.filter(venda => venda.sale_status === 'confirmed' && venda.commission_status === 'pending')

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        <header className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Canal comercial</p>
            <h1 className="text-2xl font-bold text-white mt-2">Lojas Parceiras</h1>
            <p className="text-slate-400 text-sm mt-1">Vendas por link/QR Code exclusivo, com comissao automatica de 10%.</p>
          </div>
          <button onClick={() => { resetForm(); setTab('cadastro') }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova loja
          </button>
        </header>

        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-300 text-sm mb-4">{error}</div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-white text-sm font-semibold shadow-2xl">{toast}</div>}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4"><p className="text-slate-500 text-xs">Lojas cadastradas</p><p className="text-white text-2xl font-bold">{lojas.length}</p></div>
          <div className="glass-card p-4"><p className="text-slate-500 text-xs">Vendas filtradas</p><p className="text-amber-400 text-2xl font-bold">{vendas.length}</p></div>
          <div className="glass-card p-4"><p className="text-slate-500 text-xs">Comissao pendente</p><p className="text-red-300 text-2xl font-bold">{money(summary.total_comissao_pendente)}</p></div>
          <div className="glass-card p-4"><p className="text-slate-500 text-xs">Comissao paga</p><p className="text-emerald-300 text-2xl font-bold">{money(summary.total_comissao_paga)}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            ['cadastro', 'Cadastro de lojas'],
            ['vendas', 'Vendas por loja'],
            ['comissoes', 'Comissoes'],
            ['relatorios', 'Relatorios'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === id ? 'bg-amber-400 text-slate-950' : 'glass-card text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <>
            {tab === 'cadastro' && (
              <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
                <div className="glass-card p-5">
                  <h2 className="text-white font-bold mb-4">{editingId ? 'Editar loja' : 'Cadastrar loja'}</h2>
                  <div className="grid gap-3">
                    {[
                      ['nome_fantasia', 'Nome fantasia *'],
                      ['razao_social', 'Razao social'],
                      ['cnpj', 'CNPJ'],
                      ['responsavel', 'Responsavel'],
                      ['telefone_whatsapp', 'WhatsApp'],
                      ['email', 'E-mail'],
                      ['endereco', 'Endereco'],
                      ['cidade', 'Cidade'],
                      ['codigo_parceiro', 'Codigo parceiro'],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="text-slate-400 text-xs">{label}</span>
                        <input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50" />
                      </label>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <label>
                        <span className="text-slate-400 text-xs">Comissao %</span>
                        <input type="number" min="0" max="100" value={form.percentual_comissao} onChange={e => setForm({ ...form, percentual_comissao: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50" />
                      </label>
                      <label>
                        <span className="text-slate-400 text-xs">Status</span>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50">
                          <option value="ativa">Ativa</option>
                          <option value="inativa">Inativa</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveStore} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar loja'}</button>
                      {editingId && <button onClick={resetForm} className="btn-secondary">Cancelar</button>}
                    </div>
                  </div>
                </div>

                <div className="glass-card overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                      <tr><th className="text-left p-3">Loja</th><th className="text-left p-3">Responsavel</th><th className="text-left p-3">Codigo</th><th className="text-left p-3">Comissao</th><th className="text-left p-3">Status</th><th className="text-left p-3">Link / QR</th><th className="text-left p-3">Acoes</th></tr>
                    </thead>
                    <tbody>
                      {lojas.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Nenhuma loja parceira cadastrada.</td></tr>}
                      {lojas.map(loja => (
                        <tr key={loja.id} className="border-t border-white/5">
                          <td className="p-3"><p className="text-white font-semibold">{loja.nome_fantasia}</p><p className="text-slate-500 text-xs">{loja.cidade}</p></td>
                          <td className="p-3 text-slate-400"><p>{loja.responsavel || '-'}</p><p className="text-xs">{loja.email_mascarado || '-'}</p></td>
                          <td className="p-3 text-amber-300 font-mono text-xs">{loja.codigo_parceiro}</td>
                          <td className="p-3 text-white">{loja.percentual_comissao}%</td>
                          <td className="p-3"><span className={statusBadge(loja.status)}>{loja.status}</span></td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <button onClick={() => copyLink(loja.link)} className="text-amber-300 text-xs hover:text-amber-200 text-left">Copiar link</button>
                              <button onClick={() => openQrCode(loja.link)} className="text-cyan-300 text-xs hover:text-cyan-200 text-left">Abrir QR Code</button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => editStore(loja)} className="text-slate-300 text-xs hover:text-white">Editar</button>
                              <button
                                onClick={() => deleteStore(loja)}
                                disabled={deletingId === loja.id}
                                className="inline-flex items-center gap-1 text-red-300 text-xs hover:text-red-200 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                {deletingId === loja.id ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'vendas' && (
              <section className="space-y-4">
                <Filters filters={filters} setFilters={setFilters} lojas={lojas} />
                <div className="glass-card overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-sm">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                      <tr><th className="text-left p-3">Loja</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Equipamento</th><th className="text-left p-3">Plano</th><th className="text-left p-3">Valor</th><th className="text-left p-3">Comissao</th><th className="text-left p-3">Data</th><th className="text-left p-3">Pagamento</th><th className="text-left p-3">Comissao</th><th className="text-left p-3">Alterar loja</th></tr>
                    </thead>
                    <tbody>
                      {vendas.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-slate-500">Nenhuma venda encontrada.</td></tr>}
                      {vendas.map(venda => (
                        <tr key={venda.id} className="border-t border-white/5">
                          <td className="p-3"><p className="text-white font-semibold">{venda.loja}</p><p className="text-amber-300 text-[10px] font-mono">{venda.codigo_parceiro}</p></td>
                          <td className="p-3"><p className="text-white">{venda.cliente}</p><p className="text-slate-500 text-xs">{venda.cliente_email_mascarado}</p></td>
                          <td className="p-3"><p className="text-slate-300">{venda.equipamento}</p><p className="text-slate-500 text-xs">{venda.equipamento_serie}</p></td>
                          <td className="p-3 text-slate-300">{venda.plano}</td>
                          <td className="p-3 text-white">{money(venda.valor_recebido)}</td>
                          <td className="p-3 text-amber-300">{money(venda.comissao)} <span className="text-slate-500 text-xs">({venda.commission_percentage}%)</span></td>
                          <td className="p-3 text-slate-400 text-xs">{dateBR(venda.data)}</td>
                          <td className="p-3"><span className={statusBadge(venda.payment_status)}>{venda.payment_status}</span></td>
                          <td className="p-3"><span className={statusBadge(venda.commission_status)}>{venda.commission_status}</span></td>
                          <td className="p-3">
                            {venda.commission_status === 'paid' ? <span className="text-slate-600 text-xs">Paga</span> : (
                              <div className="flex gap-2">
                                <select value={manualStore[venda.id] || ''} onChange={e => setManualStore({ ...manualStore, [venda.id]: e.target.value })} className="w-36 rounded-lg bg-slate-950 border border-white/10 text-white text-xs px-2 py-1.5">
                                  <option value="">Selecionar</option>
                                  {lojas.filter(l => l.status === 'ativa').map(loja => <option key={loja.id} value={loja.id}>{loja.nome_fantasia}</option>)}
                                </select>
                                <button onClick={() => updateSaleStore(venda)} className="text-amber-300 text-xs">Salvar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tab === 'comissoes' && (
              <section className="space-y-5">
                <Filters filters={filters} setFilters={setFilters} lojas={lojas} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Metric title="Total vendido" value={money(summary.total_vendido)} icon={TrendingUp} color="text-blue-400" />
                  <Metric title="Comissao pendente" value={money(summary.total_comissao_pendente)} icon={Clock} color="text-amber-400" />
                  <Metric title="Comissao paga" value={money(summary.total_comissao_paga)} icon={CheckCircle} color="text-emerald-400" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="glass-card p-5">
                    <h2 className="text-white font-bold mb-4">Comissao por loja</h2>
                    <div className="space-y-3">
                      {summary.comissao_por_loja.length === 0 && <p className="text-slate-500 text-sm">Sem comissoes no periodo.</p>}
                      {summary.comissao_por_loja.map((item: any) => (
                        <div key={item.codigo_parceiro} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                          <div className="flex justify-between gap-3">
                            <div><p className="text-white font-semibold">{item.loja}</p><p className="text-slate-500 text-xs">{item.quantidade} vendas</p></div>
                            <p className="text-amber-300 font-bold">{money(item.vendido)}</p>
                          </div>
                          <p className="text-slate-400 text-xs mt-2">Pendente: {money(item.comissao_pendente)} | Pago: {money(item.comissao_paga)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-5">
                    <h2 className="text-white font-bold mb-4">Comissoes pendentes</h2>
                    <div className="space-y-3">
                      {pendingSales.length === 0 && <p className="text-slate-500 text-sm">Nenhuma comissao pendente.</p>}
                      {pendingSales.map(venda => (
                        <div key={venda.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
                          <div><p className="text-white font-semibold">{venda.loja}</p><p className="text-slate-500 text-xs">{venda.cliente} | {venda.plano} | {dateBR(venda.data)}</p></div>
                          <div className="text-right">
                            <p className="text-amber-300 font-bold">{money(venda.comissao)}</p>
                            <button onClick={() => markPaid(venda)} className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs font-bold">Marcar paga</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {tab === 'relatorios' && (
              <section className="space-y-5">
                <div className="glass-card p-5 flex flex-col md:flex-row md:items-end gap-3">
                  <label>
                    <span className="text-slate-400 text-xs">Mes do relatorio</span>
                    <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="mt-1 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50" />
                  </label>
                  <label>
                    <span className="text-slate-400 text-xs">Loja opcional</span>
                    <select value={filters.storeId} onChange={e => setFilters({ ...filters, storeId: e.target.value })} className="mt-1 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50">
                      <option value="">Todas</option>
                      {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome_fantasia}</option>)}
                    </select>
                  </label>
                  <button onClick={generateMonthlyReport} className="btn-primary">Gerar relatorio mensal</button>
                  <button onClick={exportReportCSV} disabled={!reportRows.length} className="btn-secondary flex items-center gap-2 disabled:opacity-50"><Download className="w-3 h-3" /> CSV</button>
                  <button onClick={exportReportPDF} disabled={!reportRows.length} className="btn-secondary flex items-center gap-2 disabled:opacity-50"><FileText className="w-3 h-3" /> PDF</button>
                </div>
                <div className="glass-card overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                      <tr><th className="text-left p-3">Loja</th><th className="text-left p-3">Qtd</th><th className="text-left p-3">Vendas por plano</th><th className="text-left p-3">Total vendido</th><th className="text-left p-3">Comissao 10%</th><th className="text-left p-3">Pagas</th><th className="text-left p-3">Pendente</th></tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Gere um relatorio para visualizar.</td></tr>}
                      {reportRows.map(row => (
                        <tr key={row.codigo_parceiro} className="border-t border-white/5">
                          <td className="p-3 text-white">{row.nome_loja}</td>
                          <td className="p-3 text-slate-300">{row.quantidade_vendas}</td>
                          <td className="p-3 text-slate-400">{row.vendas_por_plano || '-'}</td>
                          <td className="p-3 text-white">{money(row.valor_total_vendido)}</td>
                          <td className="p-3 text-amber-300">{money(row.comissao_total)}</td>
                          <td className="p-3 text-emerald-300">{money(row.comissoes_pagas)}</td>
                          <td className="p-3 text-red-300">{money(row.saldo_pendente)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Filters({ filters, setFilters, lojas }: any) {
  return (
    <div className="glass-card p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <select value={filters.storeId} onChange={e => setFilters({ ...filters, storeId: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
        <option value="">Todas as lojas</option>
        {lojas.map((loja: any) => <option key={loja.id} value={loja.id}>{loja.nome_fantasia}</option>)}
      </select>
      <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none" />
      <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none" />
      <select value={filters.plan} onChange={e => setFilters({ ...filters, plan: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
        <option value="">Todos planos</option>
        <option value="bronze">Bronze</option>
        <option value="prata">Prata</option>
        <option value="ouro">Ouro</option>
        <option value="diamante">Diamante</option>
      </select>
      <select value={filters.payment_status} onChange={e => setFilters({ ...filters, payment_status: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
        <option value="">Status pagamento</option>
        <option value="pago">Pago</option>
        <option value="pendente">Pendente</option>
        <option value="atrasado">Atrasado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <select value={filters.commission_status} onChange={e => setFilters({ ...filters, commission_status: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
        <option value="">Status comissao</option>
        <option value="pending">Pendente</option>
        <option value="paid">Paga</option>
        <option value="cancelled">Cancelada</option>
      </select>
    </div>
  )
}

function Metric({ title, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-5">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{title}</p>
    </div>
  )
}
