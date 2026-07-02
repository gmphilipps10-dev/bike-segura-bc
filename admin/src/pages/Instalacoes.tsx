// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { AlertTriangle, Calendar, CheckCircle2, Clock, MapPin, Table } from '../components/Icons'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

const statusLabels: Record<string, string> = {
  cadastro_realizado: 'Cadastro realizado',
  plano_ativo: 'Plano ativo',
  dispositivo_em_preparacao: 'Em preparação',
  instalacao_agendada: 'Agendada',
  instalado: 'Instalado',
  cancelado: 'Cancelado',
}

const statusOptions = [
  ['dispositivo_em_preparacao', 'Em preparação'],
  ['instalacao_agendada', 'Agendada'],
  ['instalado', 'Instalado'],
  ['cancelado', 'Cancelado'],
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    cadastro_realizado: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20',
    plano_ativo: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    dispositivo_em_preparacao: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
    instalacao_agendada: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
    instalado: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    cancelado: 'bg-red-500/10 text-red-300 border-red-400/20',
  }
  return `inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] || map.dispositivo_em_preparacao}`
}

function deviceBadge(type: string) {
  return type === 'gps'
    ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20'
    : 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
}

function safe(value: any) {
  return value || '-'
}

export default function Instalacoes() {
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [filters, setFilters] = useState({ status: '', tracker_type: '' })
  const token = localStorage.getItem('admin_token') || ''
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.tracker_type) params.set('tracker_type', filters.tracker_type)
    return params.toString()
  }, [filters])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const load = async () => {
    try {
      setError('')
      const res = await fetch(`${API_BASE}/admin/installations${query ? `?${query}` : ''}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao carregar instalações.')
      setItems(Array.isArray(data.items) ? data.items : [])
      setSummary(data.summary || {})
      setInventory(Array.isArray(data.inventory) ? data.inventory : [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar instalações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [query])

  const updateStatus = async (item: any, status: string) => {
    const notes = window.prompt('Observação interna opcional:', item.notes || '')
    if (notes === null) return
    const res = await fetch(`${API_BASE}/admin/installations/${item.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ installation_status: status, notes }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Não foi possível atualizar o status.')
      return
    }
    await load()
    showToast('Status atualizado.')
  }

  const bindDevice = async (item: any) => {
    const serial = window.prompt(`Número de série do ${item.tracker_label}:`, item.device_serial_number || '')
    if (serial === null) return
    const notes = window.prompt('Observação interna opcional:', item.notes || '')
    if (notes === null) return
    const res = await fetch(`${API_BASE}/admin/installations/${item.id}/device`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ device_serial_number: serial, notes }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Não foi possível vincular o dispositivo.')
      return
    }
    await load()
    showToast('Dispositivo vinculado e instalação marcada como concluída.')
  }

  const updateStock = async (stock: any) => {
    const current = window.prompt(`Quantidade atual de ${stock.label}:`, String(stock.current_quantity))
    if (current === null) return
    const minimum = window.prompt(`Estoque mínimo de ${stock.label}:`, String(stock.minimum_quantity))
    if (minimum === null) return
    const res = await fetch(`${API_BASE}/admin/installations/stock/${stock.item}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ current_quantity: Number(current), minimum_quantity: Number(minimum) }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Não foi possível atualizar o estoque.')
      return
    }
    await load()
    showToast('Estoque atualizado.')
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        <header className="mb-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Operação técnica</p>
            <h1 className="text-2xl font-bold text-white mt-2">Instalações</h1>
            <p className="text-slate-400 text-sm mt-1">Agendamento, status técnico e estoque de TAG, GPS e adesivos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Todos os status</option>
              <option value="pendentes">Pendentes</option>
              <option value="dispositivo_em_preparacao">Em preparação</option>
              <option value="instalacao_agendada">Agendadas</option>
              <option value="instalado">Instaladas</option>
              <option value="cancelado">Canceladas</option>
            </select>
            <select value={filters.tracker_type} onChange={e => setFilters({ ...filters, tracker_type: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Todos os dispositivos</option>
              <option value="tag">TAG</option>
              <option value="gps">GPS 4G</option>
            </select>
          </div>
        </header>

        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-300 text-sm mb-4">{error}</div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-white text-sm font-semibold shadow-2xl">{toast}</div>}

        <section className="grid grid-cols-2 xl:grid-cols-7 gap-4 mb-6">
          <Metric title="Pendentes" value={summary.pending || 0} icon={Clock} color="text-amber-400" />
          <Metric title="Agendadas" value={summary.scheduled || 0} icon={Calendar} color="text-blue-400" />
          <Metric title="Aguardando TAG" value={summary.waiting_tag || 0} icon={Table} color="text-cyan-400" />
          <Metric title="Aguardando GPS" value={summary.waiting_gps || 0} icon={AlertTriangle} color="text-red-300" />
          <Metric title="Adesivos reservados" value={summary.adhesive_reserved || 0} icon={CheckCircle2} color="text-emerald-400" />
          <Metric title="GPS estoque" value={summary.gps_stock || 0} icon={MapPin} color="text-yellow-300" />
          <Metric title="TAG estoque" value={summary.tag_stock || 0} icon={Table} color="text-slate-300" />
        </section>

        {summary.inventory_alerts?.length > 0 && (
          <section className="glass-card border border-amber-400/20 bg-amber-400/5 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-sm font-bold">Atenção ao estoque mínimo</p>
                <p className="text-slate-400 text-xs mt-1">
                  {summary.inventory_alerts.map((alert: any) => `${alert.label}: ${alert.current_quantity}/${alert.minimum_quantity}`).join(' • ')}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
          <div className="glass-card overflow-x-auto">
            <table className="w-full min-w-[1250px] text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Equipamento</th>
                  <th className="text-left p-3">Dispositivo</th>
                  <th className="text-left p-3">Data mínima</th>
                  <th className="text-left p-3">Agendamento</th>
                  <th className="text-left p-3">Local</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Série</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="p-6 text-center text-slate-500">Carregando...</td></tr>}
                {!loading && items.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-500">Nenhuma instalação encontrada.</td></tr>}
                {items.map(item => (
                  <tr key={item.id} className="border-t border-white/5 align-top">
                    <td className="p-3">
                      <p className="text-white font-semibold">{safe(item.user?.name)}</p>
                      <p className="text-slate-500 text-xs">{safe(item.user?.phone)}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-white">{safe(item.equipment?.brand)} {safe(item.equipment?.name)}</p>
                      <p className="text-slate-500 text-xs">Série {safe(item.equipment?.serie)}</p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${deviceBadge(item.tracker_type)}`}>{item.tracker_label}</span>
                      {item.tracker_type === 'gps' && !item.device_reserved && !['instalado', 'cancelado'].includes(item.installation_status) && (
                        <p className="text-red-300 text-[10px] mt-1">Aguardando GPS</p>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{safe(item.min_installation_date_br)}</td>
                    <td className="p-3">
                      <p className="text-white">{item.installation_date_br || '-'}</p>
                      <p className="text-slate-500 text-xs">{item.installation_time || ''}</p>
                    </td>
                    <td className="p-3 text-slate-400 max-w-[220px]">{safe(item.installation_address)}</td>
                    <td className="p-3"><span className={statusBadge(item.installation_status)}>{statusLabels[item.installation_status] || item.installation_status}</span></td>
                    <td className="p-3 text-slate-400">{safe(item.device_serial_number)}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-2">
                        <select
                          value={item.installation_status}
                          onChange={e => updateStatus(item, e.target.value)}
                          className="w-44 rounded-lg bg-slate-950 border border-white/10 text-white text-xs px-2 py-1.5"
                        >
                          <option value={item.installation_status}>{statusLabels[item.installation_status] || item.installation_status}</option>
                          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button onClick={() => bindDevice(item)} className="w-44 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300 text-xs font-bold">
                          Vincular série / instalar
                        </button>
                        {item.notes && <p className="text-slate-500 text-[10px] max-w-[180px]">{item.notes}</p>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="glass-card p-5 h-fit">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-white font-bold">Estoque</h2>
                <p className="text-slate-500 text-xs">Controle simples de lançamento</p>
              </div>
            </div>
            <div className="space-y-3">
              {inventory.map(stock => (
                <div key={stock.item} className={`rounded-2xl border p-4 ${stock.below_minimum ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-bold">{stock.label}</p>
                      <p className="text-slate-500 text-[11px] mt-1">Mínimo: {stock.minimum_quantity}</p>
                    </div>
                    {stock.below_minimum && <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <StockNumber label="Atual" value={stock.current_quantity} />
                    <StockNumber label="Reservado" value={stock.reserved_quantity} />
                    <StockNumber label="Disponível" value={stock.available_quantity} />
                  </div>
                  <button onClick={() => updateStock(stock)} className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white text-xs font-bold">
                    Atualizar manualmente
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function Metric({ title, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-4">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{title}</p>
    </div>
  )
}

function StockNumber({ label, value }: any) {
  return (
    <div className="rounded-xl bg-slate-950/40 border border-white/5 px-2 py-3">
      <p className="text-white font-bold">{value}</p>
      <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
    </div>
  )
}
