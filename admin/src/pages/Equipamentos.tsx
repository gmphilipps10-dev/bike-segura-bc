import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Bike, Download, FileText, Table } from '../components/Icons'
import Sidebar from '../components/Sidebar'
import { exportarCSV, exportarPDF, exportarExcel } from '../utils/exportar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function Equipamentos() {
  const [searchParams] = useSearchParams()
  const [equips, setEquips] = useState<any[]>([])
  const [busca, setBusca] = useState(searchParams.get('busca') || '')
  const [registroId, setRegistroId] = useState(searchParams.get('id') || '')
  const [filtro, setFiltro] = useState<'todos' | 'normal' | 'furto'>('todos')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEquips(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  useEffect(() => {
    setBusca(searchParams.get('busca') || '')
    setRegistroId(searchParams.get('id') || '')
  }, [searchParams])

  let f = equips
  if (registroId) f = f.filter(e => String(e._id || e.id) === registroId)
  if (busca) f = f.filter(e => {
    const termo = busca.toLowerCase()
    return e.name?.toLowerCase().includes(termo)
      || e.brand?.toLowerCase().includes(termo)
      || e.type?.toLowerCase().includes(termo)
      || e.serie?.toLowerCase().includes(termo)
      || e.stickerNumber?.toLowerCase().includes(termo)
  })
  if (filtro !== 'todos') f = f.filter(e => e.status === filtro)

  const getExportData = () => {
    const headers = ['Nome', 'Marca', 'Tipo', 'Cor', 'Serie', 'Sticker', 'Status', 'Protegido', 'Rastreamento', 'Dono']
    const rows = f.map(e => [
      e.name || '-',
      e.brand || '-',
      e.type || '-',
      e.color || '-',
      e.serie || '-',
      e.stickerNumber || '-',
      e.status === 'furto' ? 'Furtado' : e.status === 'recuperada' ? 'Recuperada' : 'Ativo',
      e.protected ? 'Sim' : 'Nao',
      e.rastreamento || 'Nenhum',
      e.userId?.name || e.userId?.email || '-',
    ])
    return { headers, rows }
  }

  const handleExportarCSV = () => { const { headers, rows } = getExportData(); exportarCSV(`equipamentos-${filtro}`, headers, rows) }
  const handleExportarPDF = () => { const { headers, rows } = getExportData(); exportarPDF('Relatorio de Equipamentos', `${f.length} equipamentos | Filtro: ${filtro.toUpperCase()}`, headers, rows, [{ label: 'Total', value: String(f.length) }, { label: 'Furtados', value: String(f.filter(x => x.status === 'furto').length) }]) }
  const handleExportarExcel = () => { const { headers, rows } = getExportData(); exportarExcel(`equipamentos-${filtro}`, 'Equipamentos', headers, rows, [{ label: 'Total', value: String(f.length) }, { label: 'Furtados', value: String(f.filter(x => x.status === 'furto').length) }]) }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Equipamentos</h1>
          <p className="text-slate-400 text-sm">{equips.length} cadastrados</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <div className="glass-card flex items-center gap-2 px-3 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Buscar..." value={busca} onChange={e => { setBusca(e.target.value); setRegistroId('') }} className="bg-transparent text-white text-sm w-40 outline-none placeholder-slate-600" />
            </div>
            {(['todos', 'normal', 'furto'] as const).map(fi => (
              <button key={fi} onClick={() => setFiltro(fi)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filtro === fi ? 'bg-amber-400 text-slate-900' : 'glass-card text-slate-400'}`}>{fi === 'todos' ? 'TODOS' : fi === 'normal' ? 'ATIVOS' : 'FURTADOS'}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportarCSV} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar CSV"><Download className="w-3 h-3" />CSV</button>
            <button onClick={handleExportarPDF} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar PDF"><FileText className="w-3 h-3" />PDF</button>
            <button onClick={handleExportarExcel} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar Excel"><Table className="w-3 h-3" />Excel</button>
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
