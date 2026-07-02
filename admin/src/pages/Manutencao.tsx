// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { AlertTriangle, CheckCircle, ShieldAlert, Trash2 } from '../components/Icons'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

const removeLabels: Record<string, string> = {
  clientesComuns: 'Clientes comuns',
  equipamentos: 'Equipamentos',
  pagamentos: 'Pagamentos',
  sinistros: 'Sinistros',
  ocorrencias: 'Ocorrencias do mapa',
  sessoesProtecao: 'Sessoes de protecao',
  eventosProtecao: 'Eventos de protecao',
  pushSubscriptions: 'Push notifications',
  analytics: 'Analytics',
  vendasParceiras: 'Vendas por lojas parceiras',
  instalacoes: 'Agendamentos de instalacao',
}

function numberBR(value: number) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function StatRow({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-mono text-sm font-bold ${danger && value > 0 ? 'text-red-300' : 'text-white'}`}>{numberBR(value)}</span>
    </div>
  )
}

export default function Manutencao() {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const token = localStorage.getItem('admin_token') || ''

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token])

  const loadPreview = async () => {
    try {
      setError('')
      const res = await fetch(`${API_BASE}/admin/maintenance/reset-preview`, { headers: authHeaders })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar a previa.')
      setPreview(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar manutencao.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPreview() }, [authHeaders])

  const canReset = preview && confirmation.trim().toUpperCase() === preview.confirmationPhrase

  const resetOperationalData = async () => {
    if (!canReset || resetting) return
    const confirmou = window.confirm('Executar a limpeza definitiva da base operacional agora?')
    if (!confirmou) return

    setResetting(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/admin/maintenance/reset-operational-data`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ confirmation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao zerar base operacional.')
      setPreview(data.after)
      setConfirmation('')
      setMessage(data.message || 'Base operacional zerada com sucesso.')
    } catch (err: any) {
      setError(err.message || 'Erro ao zerar base operacional.')
    } finally {
      setResetting(false)
    }
  }

  const removeEntries = Object.entries(preview?.remove || {})
  const stickerReset = preview?.reset || {}
  const inventory = Array.isArray(stickerReset.inventarioInstalacao) ? stickerReset.inventarioInstalacao : []

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        <header className="mb-6">
          <p className="text-red-300 text-xs font-bold tracking-[0.2em] uppercase">Area sensivel</p>
          <h1 className="text-2xl font-bold text-white mt-2">Manutencao</h1>
          <p className="text-slate-400 text-sm mt-1">Ferramentas administrativas para preparar o app antes da operacao oficial.</p>
        </header>

        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-300 text-sm mb-4">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-300 text-sm mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{message}</div>}

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
            <section className="space-y-5">
              <div className="glass-card p-5 border border-red-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-300" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">Zerar base operacional</h2>
                    <p className="text-slate-400 text-sm mt-1">Remove dados de teste e deixa os adesivos prontos para novo uso.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-red-300 text-xs font-bold uppercase mb-3">Sera removido</h3>
                    {removeEntries.map(([key, value]) => (
                      <StatRow key={key} label={removeLabels[key] || key} value={Number(value || 0)} danger />
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-amber-300 text-xs font-bold uppercase mb-3">Sera resetado</h3>
                    <StatRow label="Adesivos totais" value={stickerReset.adesivosTotal || 0} />
                    <StatRow label="Adesivos em uso" value={stickerReset.adesivosVinculados || 0} danger />
                    <StatRow label="Adesivos inativos" value={stickerReset.adesivosInativos || 0} danger />
                    <div className="pt-3 mt-2 border-t border-white/5">
                      {inventory.length === 0 ? <p className="text-slate-500 text-sm">Inventario sera criado com os padroes.</p> : inventory.map((item: any) => (
                        <p key={item.item} className="text-slate-400 text-xs mb-1">
                          {item.label}: {numberBR(item.current_quantity)} total, {numberBR(item.reserved_quantity)} reservado
                        </p>
                      ))}
                      <p className="text-slate-500 text-xs mt-3">Apos reset: TAG 0, GPS 3, adesivos 200 e reservas zeradas.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-emerald-300 text-xs font-bold uppercase mb-3">Sera preservado</h3>
                    <StatRow label="Admins e owners" value={preview?.preserve?.adminsPreservados || 0} />
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><CheckCircle className="w-4 h-4 text-emerald-300" /> Configuracao de planos</div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><CheckCircle className="w-4 h-4 text-emerald-300" /> Lojas parceiras cadastradas</div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="glass-card p-5 h-fit border border-red-500/20">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-300 shrink-0" />
                <div>
                  <h2 className="text-white font-bold">Confirmacao obrigatoria</h2>
                  <p className="text-slate-400 text-sm mt-1">Esta acao apaga dados operacionais de teste e nao pode ser desfeita pelo painel.</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                <p className="text-amber-100 text-xs leading-relaxed">
                  Digite exatamente <span className="font-mono font-bold">{preview?.confirmationPhrase}</span> para liberar a limpeza.
                </p>
              </div>

              <input
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none focus:border-red-300/60"
                placeholder="Frase de confirmacao"
              />

              <button
                onClick={resetOperationalData}
                disabled={!canReset || resetting}
                className="mt-4 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-400"
              >
                {resetting ? 'Zerando...' : 'Zerar dados de teste'}
              </button>

              <button onClick={loadPreview} disabled={resetting} className="mt-2 w-full btn-secondary disabled:opacity-50">
                Atualizar previa
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
