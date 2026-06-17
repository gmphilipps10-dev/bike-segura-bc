import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import SinistroModal from '../components/sinistro/SinistroModal'
import SinistroDetalhes from '../components/sinistro/SinistroDetalhes'
import { AlertTriangle, Shield, CheckCircle, MapPin, User, Bike, Zap, Pause, X, Eye, Search, Plus } from '../components/Icons'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Sinistros() {
  const [sinistros, setSinistros] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [sinistroSelecionado, setSinistroSelecionado] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => { fetchSinistros(); fetchStats() }, [filtroStatus, filtroTipo])

  const fetchSinistros = async () => {
    try {
      setLoading(true)
      let url = `${API_BASE}/sinistros`
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') params.append('status', filtroStatus)
      if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)
      if (params.toString()) url += `?${params.toString()}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setSinistros(data) }
    } catch (err) { console.error('Erro:', err) }
    finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/sinistros/stats`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setStats(data) }
    } catch (err) { console.error('Erro:', err) }
  }

  const handleMoverStatus = async (id, novoStatus) => {
    try {
      const res = await fetch(`${API_BASE}/sinistros/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus })
      })
      if (res.ok) { fetchSinistros(); fetchStats() }
    } catch (err) { console.error('Erro:', err) }
  }

  const handleProntaResposta = async (id) => {
    if (!confirm('Deseja acionar a pronta resposta?')) return
    try {
      const res = await fetch(`${API_BASE}/sinistros/${id}/pronta-resposta`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) { fetchSinistros(); alert('Pronta resposta acionada!') }
    } catch (err) { console.error('Erro:', err) }
  }

  const filtrados = sinistros.filter(s => {
    if (!busca) return true
    const t = busca.toLowerCase()
    return (s.veiculoSnapshot?.nome?.toLowerCase().includes(t) || s.proprietarioSnapshot?.nome?.toLowerCase().includes(t) || s.localOcorrencia?.toLowerCase().includes(t))
  })

  const abertos = filtrados.filter(s => s.status === 'aberto')
  const suspensos = filtrados.filter(s => s.status === 'suspenso')
  const fechados = filtrados.filter(s => s.status === 'fechado')

  const tipoLabels = { roubo: 'Roubo', furto: 'Furto', tentativa_roubo: 'Tentativa', apropriacao_indebita: 'Apropriação' }
  const tipoColors = { roubo: 'bg-red-500/20 text-red-400', furto: 'bg-orange-500/20 text-orange-400', tentativa_roubo: 'bg-yellow-500/20 text-yellow-400', apropriacao_indebita: 'bg-purple-500/20 text-purple-400' }
  const recLabels = { em_andamento: 'Em Andamento', veiculo_encontrado: 'Encontrado', falso_positivo: 'Falso Positivo', sem_exito: 'Sem Êxito', recuperado: 'Recuperado' }
  const recColors = { em_andamento: 'text-amber-400', veiculo_encontrado: 'text-blue-400', falso_positivo: 'text-slate-400', sem_exito: 'text-red-400', recuperado: 'text-green-400' }
  const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
  const fmtDias = (d) => d === 0 ? 'Hoje' : d === 1 ? '1 dia' : `${d} dias`

  const Card = ({ s, coluna }) => (
    <div draggable onDragStart={() => setDraggingId(s._id)} onDragEnd={() => setDraggingId(null)}
      className={`bg-slate-800/60 border border-white/5 rounded-xl p-4 mb-3 cursor-move hover:border-amber-400/30 transition-all ${draggingId === s._id ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${tipoColors[s.tipo] || 'bg-slate-500/20 text-slate-400'}`}>{tipoLabels[s.tipo] || s.tipo}</span>
          {s.prontaResposta === 'acionada' && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"><Zap className="w-3 h-3" /> PR</span>}
        </div>
        <span className="text-slate-500 text-[10px]">{fmtDias(s.diasEmAndamento)}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center overflow-hidden">
          {s.veiculoSnapshot?.foto ? <img src={s.veiculoSnapshot.foto} alt="" className="w-full h-full object-cover" /> : <Bike className="w-5 h-5 text-slate-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{s.veiculoSnapshot?.nome || 'Sem nome'}</p>
          <p className="text-slate-500 text-[11px]">{s.veiculoSnapshot?.marca} • {s.veiculoSnapshot?.cor}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-400"><User className="w-3 h-3" /><span className="truncate">{s.proprietarioSnapshot?.nome || 'N/A'}</span></div>
      <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-400"><MapPin className="w-3 h-3" /><span className="truncate">{s.localOcorrencia}</span></div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[11px] font-medium ${recColors[s.statusRecuperacao] || 'text-slate-400'}`}>{recLabels[s.statusRecuperacao] || s.statusRecuperacao}</span>
        {s.rastreadorOnline && <span className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Online</span>}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <button onClick={() => setSinistroSelecionado(s)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-[11px] hover:bg-slate-700 transition-colors"><Eye className="w-3 h-3" /> Ver</button>
        {s.prontaResposta === 'disponivel' && <button onClick={() => handleProntaResposta(s._id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-[11px] hover:bg-amber-400/20 transition-colors"><Zap className="w-3 h-3" /> PR</button>}
        {coluna !== 'aberto' && <button onClick={() => handleMoverStatus(s._id, 'aberto')} className="px-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-[11px] hover:bg-slate-700"><AlertTriangle className="w-3 h-3" /></button>}
        {coluna !== 'suspenso' && <button onClick={() => handleMoverStatus(s._id, 'suspenso')} className="px-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-[11px] hover:bg-slate-700"><Pause className="w-3 h-3" /></button>}
        {coluna !== 'fechado' && <button onClick={() => handleMoverStatus(s._id, 'fechado')} className="px-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-[11px] hover:bg-slate-700"><CheckCircle className="w-3 h-3" /></button>}
      </div>
    </div>
  )

  const Column = ({ titulo, cor, icon: Icon, lista, status, bgColor }) => (
    <div className={`flex-1 min-w-[320px] ${bgColor} rounded-xl border border-white/5 flex flex-col`}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (draggingId) handleMoverStatus(draggingId, status) }}>
      <div className={`p-4 border-b border-white/5 ${cor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Icon className="w-5 h-5" /><h3 className="font-semibold text-sm">{titulo}</h3></div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium">{lista.length}</span>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {lista.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">Nenhum sinistro</div> : lista.map(s => <Card key={s._id} s={s} coluna={status} />)}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="px-6 py-4 border-b border-white/5 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Módulo de Sinistro</h1>
              <p className="text-slate-500 text-sm mt-0.5">Gestão de roubos, furtos e recuperação</p>
            </div>
            <button onClick={() => setModalNovo(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg font-medium text-sm transition-colors"><Plus className="w-4 h-4" /> Novo Sinistro</button>
          </div>
        </header>

        {stats && (
          <div className="px-6 py-4 grid grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-red-400 mb-1"><AlertTriangle className="w-4 h-4" /><span className="text-2xl font-bold">{stats.abertos}</span></div>
              <p className="text-slate-500 text-xs">Abertos</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-yellow-400 mb-1"><Pause className="w-4 h-4" /><span className="text-2xl font-bold">{stats.suspensos}</span></div>
              <p className="text-slate-500 text-xs">Suspensos</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-green-400 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-2xl font-bold">{stats.fechados}</span></div>
              <p className="text-slate-500 text-xs">Fechados</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-amber-400 mb-1"><Zap className="w-4 h-4" /><span className="text-2xl font-bold">{stats.prontaRespostaAcionada}</span></div>
              <p className="text-slate-500 text-xs">Pronta Resposta</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 text-blue-400 mb-1"><Shield className="w-4 h-4" /><span className="text-2xl font-bold">{stats.recuperados}</span></div>
              <p className="text-slate-500 text-xs">Recuperados</p>
            </div>
          </div>
        )}

        <div className="px-6 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400/50" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm">
            <option value="todos">Todos status</option><option value="aberto">Aberto</option><option value="suspenso">Suspenso</option><option value="fechado">Fechado</option>
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm">
            <option value="todos">Todos tipos</option><option value="roubo">Roubo</option><option value="furto">Furto</option><option value="tentativa_roubo">Tentativa</option><option value="apropriacao_indebita">Apropriação</option>
          </select>
        </div>

        <div className="flex-1 px-6 py-4 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-[1000px]">
            <Column titulo="Abertos" cor="text-red-400" icon={AlertTriangle} lista={abertos} status="aberto" bgColor="bg-red-500/5" />
            <Column titulo="Suspensos" cor="text-yellow-400" icon={Pause} lista={suspensos} status="suspenso" bgColor="bg-yellow-500/5" />
            <Column titulo="Fechados" cor="text-green-400" icon={CheckCircle} lista={fechados} status="fechado" bgColor="bg-green-500/5" />
          </div>
        </div>
      </main>

      {modalNovo && <SinistroModal onClose={() => setModalNovo(false)} onSuccess={() => { fetchSinistros(); fetchStats(); setModalNovo(false) }} />}
      {sinistroSelecionado && <SinistroDetalhes sinistro={sinistroSelecionado} onClose={() => setSinistroSelecionado(null)} onUpdate={() => { fetchSinistros(); fetchStats() }} />}
    </div>
  )
}
