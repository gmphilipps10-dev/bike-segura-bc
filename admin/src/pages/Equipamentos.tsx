import { useState, useEffect } from 'react'
import { Search, Bike, ShieldAlert } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Equipamentos() {
  const [equips, setEquips] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'normal' | 'furto'>('todos')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEquips(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  let f = equips
  if (busca) f = f.filter(e => e.name?.toLowerCase().includes(busca.toLowerCase()) || e.serie?.includes(busca))
  if (filtro !== 'todos') f = f.filter(e => e.status === filtro)

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Equipamentos</h1>
          <p className="text-slate-400 text-sm">{equips.length} cadastrados</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="glass-card flex items-center gap-2 px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
          </div>
          <div className="flex gap-2">
            {(['todos', 'normal', 'furto'] as const).map(fi => (
              <button key={fi} onClick={() => setFiltro(fi)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtro === fi ? 'bg-amber-400 text-slate-900' : 'glass-card text-slate-400'}`}>{fi === 'todos' ? 'TODOS' : fi === 'normal' ? 'ATIVOS' : 'FURTADOS'}</button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {f.map(e => (
              <div key={e._id} className="glass-card p-4 flex items-center gap-4">
                {e.photo ? <img src={e.photo} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-amber-400/10 flex items-center justify-center"><Bike className="w-6 h-6 text-amber-400" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{e.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${e.status === 'furto' ? 'bg-red-500/20 text-red-400' : e.protected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{e.status === 'furto' ? 'FURTADO' : e.protected ? 'PROTEGIDO' : 'REGULAR'}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{e.brand} - {e.type} - {e.color}</p>
                  <p className="text-slate-600 text-[10px] font-mono mt-0.5">{e.serie} {e.stickerNumber && `| ${e.stickerNumber}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
