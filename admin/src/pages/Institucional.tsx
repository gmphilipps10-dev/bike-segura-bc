// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Table, Users } from '../components/Icons'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

const blankForm = {
  name: '',
  email: '',
  password: '',
  role: 'institucional_gm',
  department: '',
  phone: '',
  badgeNumber: '',
}

const roleOptions = [
  ['institucional_gm', 'Guarda Municipal'],
  ['institucional_pm', 'Policia Militar'],
  ['admin_bike_segura', 'Admin Bike Segura'],
]

const triggerStatuses = [
  ['open', 'Aberto'],
  ['in_progress', 'Em atendimento'],
  ['resolved', 'Resolvido'],
  ['dismissed', 'Descartado'],
]

function roleLabel(role: string) {
  return roleOptions.find(([value]) => value === role)?.[1] || role
}

function institutionForRole(role: string) {
  if (role === 'institucional_gm') return 'GMBC'
  if (role === 'institucional_pm') return 'PMBC'
  return 'BIKE_SEGURA'
}

function statusLabel(status: string) {
  return triggerStatuses.find(([value]) => value === status)?.[1] || status
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    login_success: 'Login',
    login_failed: 'Falha de login',
    logout: 'Saida',
    dashboard: 'Dashboard',
    search: 'Consulta',
    view_equipment: 'Detalhe de equipamento',
    view_owner_data: 'Dados do proprietario',
    trigger_bike_segura: 'Acionamento',
    view_alerts: 'Alertas',
    view_logs: 'Historico',
    admin_create_institutional_user: 'Criou operador',
    admin_update_institutional_user: 'Atualizou operador',
    admin_view_institutional_logs: 'Admin viu logs',
    admin_update_institutional_trigger: 'Atualizou acionamento',
  }
  return labels[action] || action
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(Number(date))) return '-'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function triggerBadge(status: string) {
  const map: Record<string, string> = {
    open: 'border-red-400/25 bg-red-400/10 text-red-300',
    in_progress: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    resolved: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    dismissed: 'border-slate-400/25 bg-slate-400/10 text-slate-300',
  }
  return `rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] || map.open}`
}

function userBadge(status: string) {
  return status === 'active'
    ? 'rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300'
    : 'rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300'
}

export default function Institucional() {
  const [tab, setTab] = useState<'triggers' | 'users' | 'logs'>('triggers')
  const [usersList, setUsersList] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [triggers, setTriggers] = useState<any[]>([])
  const [form, setForm] = useState(blankForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const token = localStorage.getItem('admin_token') || ''

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const api = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Operacao nao concluida.')
    return data
  }

  const load = async () => {
    try {
      setError('')
      const [usersData, logsData, triggersData] = await Promise.all([
        api('/admin/institutional/users'),
        api('/admin/institutional/logs'),
        api('/admin/institutional/triggers'),
      ])
      setUsersList(Array.isArray(usersData.users) ? usersData.users : [])
      setLogs(Array.isArray(logsData.logs) ? logsData.logs : [])
      setTriggers(Array.isArray(triggersData.triggers) ? triggersData.triggers : [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados institucionais.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api('/admin/institutional/users', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          institution: institutionForRole(form.role),
        }),
      })
      setForm(blankForm)
      await load()
      showToast('Usuario institucional criado.')
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel criar usuario institucional.')
    } finally {
      setSaving(false)
    }
  }

  const updateUser = async (user: any, updates: Record<string, unknown>) => {
    try {
      await api(`/admin/institutional/users/${user.id || user._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      await load()
      showToast('Usuario atualizado.')
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel atualizar usuario.')
    }
  }

  const resetPassword = async (user: any) => {
    const password = window.prompt(`Nova senha institucional para ${user.email}:`)
    if (!password) return
    await updateUser(user, { password })
  }

  const updateTriggerStatus = async (trigger: any, status: string) => {
    const notes = window.prompt('Observacao do atendimento:', trigger.notes || '')
    if (notes === null) return
    try {
      await api(`/admin/institutional/triggers/${trigger._id || trigger.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      })
      await load()
      showToast('Acionamento atualizado.')
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel atualizar acionamento.')
    }
  }

  const stats = {
    activeUsers: usersList.filter(user => user.status === 'active').length,
    openTriggers: triggers.filter(trigger => ['open', 'in_progress'].includes(trigger.status)).length,
    ownerViews: logs.filter(log => log.action === 'view_owner_data').length,
    searches: logs.filter(log => log.action === 'search').length,
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Operacao institucional</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Institucional</h1>
            <p className="mt-1 text-sm text-slate-400">Operadores autorizados, logs de auditoria e acionamentos Bike Segura.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['triggers', 'Acionamentos'],
              ['users', 'Operadores'],
              ['logs', 'Historico'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value as any)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  tab === value ? 'bg-amber-400 text-slate-950' : 'border border-white/10 bg-white/[0.03] text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>}
        {toast && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl">{toast}</div>}

        <section className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric title="Operadores ativos" value={stats.activeUsers} icon={Users} color="text-cyan-300" />
          <Metric title="Acionamentos abertos" value={stats.openTriggers} icon={ShieldAlert} color="text-red-300" />
          <Metric title="Dados liberados" value={stats.ownerViews} icon={AlertTriangle} color="text-amber-300" />
          <Metric title="Consultas registradas" value={stats.searches} icon={Table} color="text-emerald-300" />
        </section>

        {loading && <div className="glass-card p-6 text-center text-slate-500">Carregando...</div>}

        {!loading && tab === 'triggers' && (
          <section className="glass-card overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Equipamento</th>
                  <th className="p-3 text-left">Instituicao</th>
                  <th className="p-3 text-left">Motivo</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Atendimento</th>
                </tr>
              </thead>
              <tbody>
                {triggers.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhum acionamento registrado.</td></tr>}
                {triggers.map(trigger => (
                  <tr key={trigger._id || trigger.id} className="border-t border-white/5 align-top">
                    <td className="p-3 text-slate-400">{formatDate(trigger.createdAt)}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{trigger.equipmentSnapshot?.brand} {trigger.equipmentSnapshot?.model}</p>
                      <p className="text-xs text-slate-500">{trigger.equipmentSnapshot?.color} · {trigger.equipmentSnapshot?.serieMasked}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{trigger.institution}</p>
                      <p className="text-xs text-slate-500">{trigger.userName || trigger.userEmail}</p>
                    </td>
                    <td className="max-w-[260px] p-3">
                      <p className="font-semibold text-slate-200">{trigger.reason}</p>
                      <p className="mt-1 text-xs text-slate-500">{trigger.reasonText || '-'}</p>
                    </td>
                    <td className="p-3"><span className={triggerBadge(trigger.status)}>{statusLabel(trigger.status)}</span></td>
                    <td className="p-3">
                      <select
                        value={trigger.status}
                        onChange={event => updateTriggerStatus(trigger, event.target.value)}
                        className="w-44 rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white"
                      >
                        {triggerStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {trigger.notes && <p className="mt-2 max-w-[220px] text-[11px] text-slate-500">{trigger.notes}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!loading && tab === 'users' && (
          <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <form onSubmit={createUser} className="glass-card h-fit p-5">
              <h2 className="mb-4 text-lg font-bold text-white">Novo operador</h2>
              <div className="space-y-3">
                <Input label="Nome" value={form.name} onChange={value => setForm({ ...form, name: value })} />
                <Input label="E-mail" type="email" value={form.email} onChange={value => setForm({ ...form, email: value })} />
                <Input label="Senha inicial" type="password" value={form.password} onChange={value => setForm({ ...form, password: value })} />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Perfil</span>
                  <select
                    value={form.role}
                    onChange={event => setForm({ ...form, role: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <Input label="Departamento" value={form.department} onChange={value => setForm({ ...form, department: value })} />
                <Input label="Telefone" value={form.phone} onChange={value => setForm({ ...form, phone: value })} />
                <Input label="Matrícula/identificação" value={form.badgeNumber} onChange={value => setForm({ ...form, badgeNumber: value })} />
              </div>
              <button disabled={saving} className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">
                {saving ? 'Criando...' : 'Criar operador'}
              </button>
            </form>

            <div className="glass-card overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-white/5 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3 text-left">Operador</th>
                    <th className="p-3 text-left">Instituição</th>
                    <th className="p-3 text-left">Perfil</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Último login</th>
                    <th className="p-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhum operador cadastrado.</td></tr>}
                  {usersList.map(user => (
                    <tr key={user.id || user._id} className="border-t border-white/5 align-top">
                      <td className="p-3">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="p-3 text-slate-300">{user.institution}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={event => updateUser(user, { role: event.target.value })}
                          className="w-44 rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white"
                        >
                          {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                      <td className="p-3"><span className={userBadge(user.status)}>{user.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="p-3 text-slate-400">{formatDate(user.lastLoginAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-2">
                          <button onClick={() => updateUser(user, { status: user.status === 'active' ? 'inactive' : 'active' })} className="w-36 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white">
                            {user.status === 'active' ? 'Inativar' : 'Ativar'}
                          </button>
                          <button onClick={() => resetPassword(user)} className="w-36 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-300">
                            Nova senha
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

        {!loading && tab === 'logs' && (
          <section className="glass-card overflow-hidden">
            <div className="divide-y divide-white/5">
              {logs.length === 0 && <div className="p-6 text-center text-slate-500">Nenhum log institucional.</div>}
              {logs.map(log => (
                <div key={log.id || log._id} className="grid gap-3 p-4 lg:grid-cols-[170px_1fr_220px]">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{formatDate(log.createdAt)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{log.institution}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{actionLabel(log.action)}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {log.searchTerm ? `Busca: ${log.searchTerm}` : log.reasonText || log.resourceId || 'Registro operacional'}
                    </p>
                  </div>
                  <div className="min-w-0 lg:text-right">
                    <p className="truncate text-xs font-semibold text-slate-300">{log.userName || log.userEmail}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{roleLabel(log.role)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function Metric({ title, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{title}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none"
      />
    </label>
  )
}
