// @ts-nocheck
import { useState, useEffect } from 'react'
import { X, Search, MapPin, Bike, AlertTriangle, FileText } from '../Icons'
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function SinistroModal({ onClose, onSuccess }) {
  const [bikes, setBikes] = useState([])
  const [bikeSel, setBikeSel] = useState(null)
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ tipo: 'roubo', dataOcorrencia: '', localOcorrencia: '', descricao: '', boletimOcorrencia: '', lat: '', lng: '' })
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => { fetchBikes() }, [])
  const fetchBikes = async () => {
    try {
      const res = await fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setBikes(Array.isArray(data) ? data : []) }
    } catch (err) { console.error('Erro:', err) }
  }

  const bikesFiltradas = bikes.filter(b => {
    if (!busca) return true
    const t = busca.toLowerCase()
    return (b.name?.toLowerCase().includes(t) || b.brand?.toLowerCase().includes(t) || b.serie?.toLowerCase().includes(t) || b.userId?.name?.toLowerCase().includes(t))
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!bikeSel) { alert('Selecione uma bicicleta'); return }
    setSalvando(true)
    try {
      const coord = form.lat && form.lng ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } : null
      const res = await fetch(`${API_BASE}/sinistros`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bikeId: bikeSel._id, tipo: form.tipo, dataOcorrencia: form.dataOcorrencia, localOcorrencia: form.localOcorrencia, descricao: form.descricao, boletimOcorrencia: form.boletimOcorrencia, coordenadasOcorrencia: coord })
      })
      if (res.ok) { onSuccess() } else { const err = await res.json(); alert('Erro: ' + (err.error || 'Erro ao criar')) }
    } catch (err) { alert('Erro ao criar sinistro') }
    finally { setSalvando(false) }
  }

  const tipos = [{ value: 'roubo', label: 'Roubo', color: 'bg-red-500/20 text-red-400 border-red-500/30' }, { value: 'furto', label: 'Furto', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }, { value: 'tentativa_roubo', label: 'Tentativa', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }, { value: 'apropriacao_indebita', label: 'Apropriação', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Novo Sinistro</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecionar Bicicleta <span className="text-red-400">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400/50" />
            </div>
            {bikeSel ? (
              <div className="mt-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center overflow-hidden">
                  {bikeSel.photo ? <img src={bikeSel.photo} alt="" className="w-full h-full object-cover" /> : <Bike className="w-5 h-5 text-slate-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{bikeSel.name}</p>
                  <p className="text-slate-500 text-xs">{bikeSel.brand} • {bikeSel.color} • {bikeSel.userId?.name}</p>
                </div>
                <button type="button" onClick={() => setBikeSel(null)} className="text-slate-400 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {bikesFiltradas.slice(0, 10).map(bike => (
                  <button key={bike._id} type="button" onClick={() => setBikeSel(bike)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left">
                    <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center overflow-hidden">
                      {bike.photo ? <img src={bike.photo} alt="" className="w-full h-full object-cover" /> : <Bike className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{bike.name}</p>
                      <p className="text-slate-500 text-xs">{bike.brand} • {bike.userId?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {tipos.map(t => (
                <button key={t.value} type="button" onClick={() => setForm({ ...form, tipo: t.value })} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${form.tipo === t.value ? t.color : 'bg-slate-800/50 text-slate-400 border-white/5 hover:border-white/10'}`}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Data <span className="text-red-400">*</span></label>
              <input type="datetime-local" required value={form.dataOcorrencia} onChange={(e) => setForm({ ...form, dataOcorrencia: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Local <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" required placeholder="Rua, bairro..." value={form.localOcorrencia} onChange={(e) => setForm({ ...form, localOcorrencia: e.target.value })} className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400/50" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Latitude (opcional)</label><input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Longitude (opcional)</label><input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm" /></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea rows={3} placeholder="Descreva o ocorrido..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400/50 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Boletim de Ocorrência</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Número do BO" value={form.boletimOcorrencia} onChange={(e) => setForm({ ...form, boletimOcorrencia: e.target.value })} className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400/50" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">Cancelar</button>
            <button type="submit" disabled={salvando || !bikeSel} className="flex-1 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 rounded-lg text-sm font-medium transition-colors">{salvando ? 'Criando...' : 'Criar Sinistro'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
