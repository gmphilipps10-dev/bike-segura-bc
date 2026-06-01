import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Printer, Plus, Hash } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Adesivos() {
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, disponiveis: 0, vinculados: 0 })
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [msg, setMsg] = useState('')
  const [filtro, setFiltro] = useState<'disponivel' | 'vinculado' | 'todos'>('disponivel')
  const token = localStorage.getItem('admin_token') || ''

  const fetchData = () => {
    const status = filtro !== 'todos' ? `&status=${filtro}` : ''
    window.fetch(`${API_BASE}/preprinted?limit=100${status}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { items: [], total: 0, disponiveis: 0, vinculados: 0 })
      .then(d => { setItems(d.items || []); setStats({ total: d.total || 0, disponiveis: d.disponiveis || 0, vinculados: d.vinculados || 0 }); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filtro, token])

  const gerarLote = () => {
    setGerando(true)
    window.fetch(`${API_BASE}/preprinted/gerar-lote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantidade: 100 })
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setMsg(`${d.quantidade} adesivos gerados: ${d.de} ate ${d.ate}`); fetchData() })
      .finally(() => setGerando(false))
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Adesivos QR Code</h1>
          <p className="text-slate-400 text-sm">{stats.disponiveis} disponiveis / {stats.vinculados} em uso / {stats.total} total</p>
        </header>

        {stats.disponiveis < 10 && (
          <div className="glass-panel border border-red-500/20 p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">Estoque baixo! Apenas {stats.disponiveis} adesivos disponiveis.</p>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button onClick={gerarLote} disabled={gerando} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" />{gerando ? 'Gerando...' : 'Gerar Lote (+100)'}
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />Imprimir
          </button>
        </div>

        {msg && <div className="glass-panel bg-emerald-500/5 border border-emerald-500/20 p-3 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /><p className="text-emerald-400 text-xs">{msg}</p></div>}

        <div className="flex gap-2 mb-3">
          {(['disponivel', 'vinculado', 'todos'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${filtro === f ? 'bg-white/[0.08] text-white' : 'text-slate-600'}`}>{f === 'todos' ? 'TODOS' : f === 'disponivel' ? 'DISPONIVEIS' : 'USADOS'}</button>
          ))}
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {items.map(item => (
              <div key={item._id} className={`glass-panel p-3 text-center ${item.status === 'disponivel' ? 'border-emerald-500/10' : 'opacity-50'}`}>
                <Hash className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <p className="text-white font-mono text-xs font-bold">{item.stickerNumber}</p>
                <p className="text-slate-600 text-[9px] font-mono">{item.hash?.slice(0, 8).toUpperCase()}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${item.status === 'disponivel' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.status === 'disponivel' ? 'LIVRE' : 'USADO'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="hidden print:block mt-8">
          <h2 className="text-center text-black font-bold text-sm mb-4">ADESIVOS BIKE SEGURA BC</h2>
          <div className="grid grid-cols-5 gap-2">
            {items.filter((i: any) => i.status === 'disponivel').map((item: any) => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://www.bikesegurabc.com.br/qr/${item.hash}`)}`
              return (
                <div key={item._id} className="border border-gray-300 rounded p-1.5 text-center">
                  <img src={qrUrl} alt="" className="w-10 h-10 mx-auto mb-0.5" />
                  <p className="text-black font-mono text-[7px] font-bold">{item.stickerNumber}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
