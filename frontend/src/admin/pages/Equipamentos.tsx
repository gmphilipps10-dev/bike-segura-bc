import { useState, useEffect } from 'react'
import { Search, Bike, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Equipamentos() {
  const [equips, setEquips] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'normal' | 'furto'>('todos')
  const [loading, setLoading] = useState(true)
  const [modalEquip, setModalEquip] = useState<any>(null)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    window.fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEquips(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  let f = equips
  if (busca) f = f.filter(e => e.name?.toLowerCase().includes(busca.toLowerCase()) || e.serie?.includes(busca) || e.stickerNumber?.includes(busca))
  if (filtro !== 'todos') f = f.filter(e => e.status === filtro)

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Equipamentos</h1>
          <p className="text-slate-400 text-sm">{equips.length} cadastrados</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="glass-panel flex items-center gap-2 px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
          </div>
          <div className="flex gap-2">
            {(['todos', 'normal', 'furto'] as const).map(fi => (
              <button key={fi} onClick={() => setFiltro(fi)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtro === fi ? 'bg-amber-400 text-slate-900' : 'glass-panel text-slate-400'}`}>{fi === 'todos' ? 'TODOS' : fi === 'normal' ? 'ATIVOS' : 'FURTADOS'}</button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-2">
            {f.map(e => (
              <div key={e._id} className="glass-panel p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1e293b]/80 transition-colors" onClick={() => setModalEquip(e)}>
                {e.photo ? <img src={e.photo} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-amber-400/10 flex items-center justify-center"><Bike className="w-6 h-6 text-amber-400" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{e.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${e.status === 'furto' ? 'bg-red-500/20 text-red-400' : e.protected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{e.status === 'furto' ? 'FURTADO' : e.protected ? 'PROTEGIDO' : 'REGULAR'}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{e.brand} {e.model && `- ${e.model}`} - {e.color}</p>
                  <p className="text-slate-600 text-[10px] font-mono mt-0.5">{e.serie} {e.stickerNumber && `| ${e.stickerNumber}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalEquip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalEquip(null)}>
            <div className="glass-panel p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Detalhes do Equipamento</h3>
                <button onClick={() => setModalEquip(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {modalEquip.photo && <img src={modalEquip.photo} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Nome:</span><span className="text-white">{modalEquip.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Marca:</span><span className="text-white">{modalEquip.brand}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Modelo:</span><span className="text-white">{modalEquip.model || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Cor:</span><span className="text-white">{modalEquip.color}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Serie:</span><span className="text-white font-mono">{modalEquip.serie}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className={modalEquip.status === 'furto' ? 'text-red-400' : 'text-emerald-400'}>{modalEquip.status === 'furto' ? 'FURTADO' : 'REGULAR'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Adesivo:</span><span className="text-white font-mono">{modalEquip.stickerNumber || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Valor:</span><span className="text-white">R${modalEquip.value?.toLocaleString('pt-BR') || '0'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
