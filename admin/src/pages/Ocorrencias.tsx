import { useState, useEffect } from 'react'
import { ShieldAlert, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, manual: 0, monitorado: 0 })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    Promise.all([
      window.fetch(`${API_BASE}/ocorrencias?dias=365`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).catch(() => []),
      window.fetch(`${API_BASE}/ocorrencias/stats?dias=365`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]).then(([occs, st]: [any, any]) => {
      setOcorrencias(Array.isArray(occs) ? occs : [])
      setStats({ total: st?.total || 0, manual: st?.manual || 0, monitorado: st?.monitorado || 0 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  const porBairro = ocorrencias.reduce((acc: any, o: any) => {
    const b = o.bairro || 'Nao informado'
    acc[b] = (acc[b] || 0) + 1
    return acc
  }, {})
  const chartData = Object.entries(porBairro).map(([bairro, total]) => ({ bairro, total })).sort((a: any, b: any) => b.total - a.total).slice(0, 10)

  const handleStatusChange = async (id: string, novoStatus: string) => {
    try {
      const res = await window.fetch(`${API_BASE}/ocorrencias/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (res.ok) {
        setOcorrencias(prev => prev.map(o => o._id === id ? { ...o, status: novoStatus } : o))
      }
    } catch {}
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Ocorrencias</h1>
          <p className="text-slate-400 text-sm">{stats.total} registros no ultimo ano</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card text-center"><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-slate-500 text-xs">Total</p></div>
          <div className="stat-card text-center"><p className="text-2xl font-bold text-amber-400">{stats.manual}</p><p className="text-slate-500 text-xs">Manuais</p></div>
          <div className="stat-card text-center"><p className="text-2xl font-bold text-emerald-400">{stats.monitorado}</p><p className="text-slate-500 text-xs">Monitorados</p></div>
        </div>

        {chartData.length > 0 && (
          <div className="glass-panel p-5 mb-6">
            <h3 className="text-white font-semibold text-sm mb-4">Ocorrencias por Local</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bairro" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {ocorrencias.length === 0 && <p className="text-slate-500 text-sm">Nenhuma ocorrencia encontrada.</p>}
            {ocorrencias.map(o => (
              <div key={o._id} className="glass-panel p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-white font-medium text-sm">{o.titulo || 'Ocorrencia'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'ativo' ? 'bg-red-500/20 text-red-400' : o.status === 'resolvido' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{(o.status || 'ativo').toUpperCase()}</span>
                    </div>
                    <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{o.endereco || '-'}{o.bairro ? `, ${o.bairro}` : ''}</p>
                    <p className="text-slate-600 text-[10px] mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{o.dataOcorrencia ? new Date(o.dataOcorrencia).toLocaleDateString('pt-BR') : '-'}</p>
                    {o.veiculoTipo && <p className="text-slate-500 text-[10px] mt-1">{o.veiculoTipo}{o.veiculoCor ? ` - ${o.veiculoCor}` : ''}{o.veiculoMarca ? ` - ${o.veiculoMarca}` : ''}</p>}
                  </div>
                  <div className="flex gap-1">
                    {o.status === 'ativo' && (
                      <>
                        <button onClick={() => handleStatusChange(o._id, 'resolvido')} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Resolvido"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleStatusChange(o._id, 'falso')} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Falso"><XCircle className="w-4 h-4" /></button>
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
