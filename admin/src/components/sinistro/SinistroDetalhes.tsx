// @ts-nocheck
import { useState } from 'react'
import { X, MapPin, Phone, Mail, User, Bike, FileText, Zap, AlertTriangle, CheckCircle, Pause, Map, Navigation, Battery, Route } from '../Icons'
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function SinistroDetalhes({ sinistro, onClose, onUpdate }) {
  const [aba, setAba] = useState('info')
  const [observacoes, setObservacoes] = useState(sinistro.observacoes || '')
  const [responsavel, setResponsavel] = useState(sinistro.responsavel || '')
  const [salvando, setSalvando] = useState(false)
  const token = localStorage.getItem('admin_token') || ''

  const handleAtualizar = async () => {
    setSalvando(true)
    try {
      const res = await fetch(`${API_BASE}/sinistros/${sinistro._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ observacoes, responsavel })
      })
      if (res.ok) { onUpdate(); alert('Atualizado!') }
    } catch (err) { console.error('Erro:', err) }
    finally { setSalvando(false) }
  }

  const handleStatusRec = async (novoStatus) => {
    if (!confirm(`Alterar para: ${novoStatus}?`)) return
    try {
      const res = await fetch(`${API_BASE}/sinistros/${sinistro._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statusRecuperacao: novoStatus })
      })
      if (res.ok) { onUpdate(); onClose() }
    } catch (err) { console.error('Erro:', err) }
  }

  const tipoLabels = { roubo: 'Roubo', furto: 'Furto', tentativa_roubo: 'Tentativa de Roubo', apropriacao_indebita: 'Apropriação Indébita' }
  const recLabels = { em_andamento: 'Em Andamento', veiculo_encontrado: 'Encontrado', falso_positivo: 'Falso Positivo', sem_exito: 'Sem Êxito', recuperado: 'Recuperado' }
  const recColors = { em_andamento: 'text-amber-400', veiculo_encontrado: 'text-blue-400', falso_positivo: 'text-slate-400', sem_exito: 'text-red-400', recuperado: 'text-green-400' }
  const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR') : '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Sinistro #{sinistro._id.slice(-6).toUpperCase()}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{tipoLabels[sinistro.tipo]} • {fmtDate(sinistro.dataOcorrencia)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-white/5">
          {[{ id: 'info', label: 'Informações', icon: FileText }, { id: 'rastreamento', label: 'Rastreamento', icon: Map }, { id: 'historico', label: 'Histórico', icon: Route }].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${aba === tab.id ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aba === 'info' && (
            <div className="space-y-6">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><Bike className="w-4 h-4" /> Veículo</h3>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-700/50 flex items-center justify-center overflow-hidden">
                    {sinistro.veiculoSnapshot?.foto ? <img src={sinistro.veiculoSnapshot.foto} alt="" className="w-full h-full object-cover" /> : <Bike className="w-7 h-7 text-slate-500" />}
                  </div>
                  <div>
                    <p className="text-white font-medium">{sinistro.veiculoSnapshot?.nome || 'N/A'}</p>
                    <p className="text-slate-500 text-sm">{sinistro.veiculoSnapshot?.marca} • {sinistro.veiculoSnapshot?.cor}</p>
                    <p className="text-slate-500 text-xs">Série: {sinistro.veiculoSnapshot?.serie}</p>
                    <p className="text-amber-400/70 text-xs mt-1">Tipo: {sinistro.veiculoSnapshot?.tipo || 'bicicleta'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Proprietário</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300"><User className="w-4 h-4 text-slate-500" />{sinistro.proprietarioSnapshot?.nome || 'N/A'}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-300"><Phone className="w-4 h-4 text-slate-500" />{sinistro.proprietarioSnapshot?.telefone || 'N/A'}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-300"><Mail className="w-4 h-4 text-slate-500" />{sinistro.proprietarioSnapshot?.email || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Ocorrência</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300"><span className="text-slate-500">Local:</span> {sinistro.localOcorrencia}</p>
                  <p className="text-slate-300"><span className="text-slate-500">Data:</span> {fmtDate(sinistro.dataOcorrencia)}</p>
                  <p className="text-slate-300"><span className="text-slate-500">BO:</span> {sinistro.boletimOcorrencia || 'Não informado'}</p>
                  <p className="text-slate-300"><span className="text-slate-500">Dias:</span> {sinistro.diasEmAndamento} dias</p>
                  {sinistro.descricao && <p className="text-slate-300 mt-2"><span className="text-slate-500">Descrição:</span> {sinistro.descricao}</p>}
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Status de Recuperação</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'em_andamento', label: 'Em Andamento', color: 'bg-amber-400/10 text-amber-400 border-amber-400/30' }, { value: 'veiculo_encontrado', label: 'Encontrado', color: 'bg-blue-400/10 text-blue-400 border-blue-400/30' }, { value: 'recuperado', label: 'Recuperado', color: 'bg-green-400/10 text-green-400 border-green-400/30' }, { value: 'falso_positivo', label: 'Falso Positivo', color: 'bg-slate-400/10 text-slate-400 border-slate-400/30' }, { value: 'sem_exito', label: 'Sem Êxito', color: 'bg-red-400/10 text-red-400 border-red-400/30' }].map(s => (
                    <button key={s.value} onClick={() => handleStatusRec(s.value)} className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${sinistro.statusRecuperacao === s.value ? s.color : 'bg-slate-800/50 text-slate-400 border-white/5 hover:border-white/10'}`}>{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Responsável (Guarda/PM)</label>
                  <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome..." className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                  <textarea rows={4} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Adicione observações..." className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400/50 resize-none" />
                </div>
                <button onClick={handleAtualizar} disabled={salvando} className="w-full px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-900 rounded-lg text-sm font-medium transition-colors">{salvando ? 'Salvando...' : 'Salvar Alterações'}</button>
              </div>
            </div>
          )}

          {aba === 'rastreamento' && (
            <div className="space-y-6">
              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${sinistro.rastreadorOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-white font-medium">Rastreador {sinistro.rastreadorOnline ? 'Online' : 'Offline'}</p>
                      <p className="text-slate-500 text-sm">Última atualização: {fmtDate(sinistro.ultimaAtualizacaoRastreador)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><Battery className="w-4 h-4 text-slate-500" /><span className="text-sm text-slate-300">{sinistro.bateriaRastreador}%</span></div>
                </div>
              </div>

              {sinistro.coordenadasAtual?.lat && (
                <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><Navigation className="w-4 h-4" /> Localização Atual</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3"><p className="text-slate-500 text-xs">Latitude</p><p className="text-white font-mono text-sm">{sinistro.coordenadasAtual.lat}</p></div>
                    <div className="bg-slate-900/50 rounded-lg p-3"><p className="text-slate-500 text-xs">Longitude</p><p className="text-white font-mono text-sm">{sinistro.coordenadasAtual.lng}</p></div>
                  </div>
                  <a href={`https://www.google.com/maps?q=${sinistro.coordenadasAtual.lat},${sinistro.coordenadasAtual.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"><Map className="w-4 h-4" /> Abrir no Google Maps</a>
                </div>
              )}

              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Mapa de Rastreamento</h3>
                <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500 text-sm">Mapa será integrado com Google Maps API</p>
                </div>
              </div>
            </div>
          )}

          {aba === 'historico' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2"><Route className="w-4 h-4" /> Histórico de Rastreamento</h3>
              {sinistro.historicoRastreamento?.length > 0 ? (
                <div className="space-y-2">
                  {sinistro.historicoRastreamento.map((h, i) => (
                    <div key={i} className="bg-slate-800/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-amber-400" /></div>
                        <div>
                          <p className="text-white text-sm">{h.lat?.toFixed(6)}, {h.lng?.toFixed(6)}</p>
                          <p className="text-slate-500 text-xs">{fmtDate(h.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className="text-slate-400 text-xs">{h.velocidade} km/h</p><p className="text-slate-500 text-xs">Bateria: {h.bateria}%</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500"><Route className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Nenhum histórico</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
