import { useState, useEffect } from 'react'
import { ShieldAlert, MapPin, Calendar, Search, CheckCircle, XCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, manual: 0, monitorado: 0 })
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'resolvido' | 'falso'>('todos')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  const fetchData = async () => {
    try {
      const [ocRes, stRes] = await Promise.all([
        fetch(`${API_BASE}/ocorrencias?dias=365`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/ocorrencias/stats?dias=365`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (ocRes.ok) {
        const data = await ocRes.json()
        setOcorrencias(Array.isArray(data) ? data : [])
      }
      if (stRes.ok) {
        const data = await stRes.json()
        setStats({
          total: data.total || 0,
          manual: data.manual || 0,
          monitorado: data.monitorado || 0,
        })
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [token])

  let filtrados = ocorrencias
  if (busca) {
    const q = busca.toLowerCase()
    filtrados = filtrados.filter(o =>
      (o.titulo || '').toLowerCase().includes(q) ||
      (o.endereco || '').toLowerCase().includes(q) ||
      (o.bairro || '').toLowerCase().includes(q) ||
      (o.veiculoTipo || '').toLowerCase().includes(q)
    )
  }
  if (filtroStatus !== 'todos') {
    filtrados = filtrados.filter(o => o.status === filtroStatus)
  }

  const handleStatusChange = async (id: string, novoStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/ocorrencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (res.ok) fetchData()
    } catch {}
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Ocorrencias</h1>
          <p className="text-slate-400 text-sm">{stats.total} registros no ultimo ano</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-500 text-xs">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.manual}</p>
            <p className="text-slate-500 text-xs">Manuais</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.monitorado}</p>
            <p className="text-slate-500 text-xs">Monitorados</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="glass-card flex items-center gap-2 px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar ocorrencia..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
          </div>
          <div className="flex gap-2">
            {(['todos', 'ativo', 'resolvido', 'falso'] as const).map(f => (
              <button key={f} onClick={() => setFiltroStatus(f)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtroStatus === f ? 'bg-amber-400 text-slate-900' : 'glass-card text-slate-400'}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {filtrados.length === 0 && <p className="text-slate-500 text-sm">Nenhuma ocorrencia encontrada.</p>}
            {filtrados.map(o => (
              <div key={o._id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <p className="text-white font-medium text-sm">{o.titulo || 'Ocorrencia'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'ativo' ? 'bg-red-500/20 text-red-400' : o.status === 'resolvido' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{(o.status || 'ativo').toUpperCase()}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">{o.tipo || 'manual'}</span>
                    </div>
                    <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{o.endereco || '-'}{o.bairro ? `, ${o.bairro}` : ''}</p>
                    <p className="text-slate-600 text-[10px] mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{o.dataOcorrencia ? new Date(o.dataOcorrencia).toLocaleDateString('pt-BR') : '-'}</p>
                    {o.descricao && <p className="text-slate-400 text-xs mt-2 line-clamp-2">{o.descricao}</p>}
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                      {o.veiculoTipo && <span>Tipo: {o.veiculoTipo}</span>}
                      {o.veiculoCor && <span>Cor: {o.veiculoCor}</span>}
                      {o.veiculoMarca && <span>Marca: {o.veiculoMarca}</span>}
                      {o.confirmacoes > 1 && <span className="text-amber-400">{o.confirmacoes} confirmacoes</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {o.status === 'ativo' && (
                      <>
                        <button onClick={() => handleStatusChange(o._id, 'resolvido')} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Marcar como resolvido"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleStatusChange(o._id, 'falso')} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Marcar como falso"><XCircle className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
