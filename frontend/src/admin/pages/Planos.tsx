import { useState, useEffect } from 'react'
import { CreditCard, Users, TrendingUp, Bike } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

const PLANOS_INFO = [
  { nome: 'Bronze', preco: 50, cor: '#f97316', bg: 'bg-orange-400/10', text: 'text-orange-400' },
  { nome: 'Prata', preco: 150, cor: '#cbd5e1', bg: 'bg-slate-300/10', text: 'text-slate-300' },
  { nome: 'Ouro', preco: 300, cor: '#f59e0b', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  { nome: 'Diamante', preco: 450, cor: '#a855f7', bg: 'bg-purple-400/10', text: 'text-purple-400' },
]

export default function Planos() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    window.fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClientes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  // Usuarios SEM plano definido = nao assinantes
  const semPlano = clientes.filter(c => !c.plano || c.plano === '').length

  const distribuicao = PLANOS_INFO.map(p => ({
    name: p.nome,
    value: clientes.filter(c => (c.plano || '').toLowerCase() === p.nome.toLowerCase()).length,
    ...p
  })).filter(p => p.value > 0)

  const faturamentoMensal = PLANOS_INFO.reduce((acc, p) => {
    const qtd = clientes.filter(c => (c.plano || '').toLowerCase() === p.nome.toLowerCase()).length
    return acc + (qtd * p.preco)
  }, 0)
  const faturamentoAnual = faturamentoMensal * 12
  const totalAssinantes = clientes.filter(c => c.plano && c.plano !== '').length

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-slate-400 text-sm">Gestao de planos e assinantes</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card text-center"><Users className="w-5 h-5 text-blue-400 mx-auto mb-2" /><p className="text-2xl font-bold text-white">{clientes.length}</p><p className="text-slate-500 text-xs">Total usuarios</p></div>
          <div className="stat-card text-center"><CreditCard className="w-5 h-5 text-emerald-400 mx-auto mb-2" /><p className="text-2xl font-bold text-white">{totalAssinantes}</p><p className="text-slate-500 text-xs">Assinantes</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" /><p className="text-2xl font-bold text-white">R${faturamentoMensal.toLocaleString('pt-BR')}</p><p className="text-slate-500 text-xs">Faturamento/mes</p></div>
          <div className="stat-card text-center"><Bike className="w-5 h-5 text-purple-400 mx-auto mb-2" /><p className="text-2xl font-bold text-white">R${faturamentoAnual.toLocaleString('pt-BR')}</p><p className="text-slate-500 text-xs">Faturamento/ano</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {distribuicao.length > 0 ? (
            <div className="glass-panel p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Distribuicao por Plano</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={distribuicao} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {distribuicao.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.cor} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="glass-panel p-5 flex items-center justify-center">
              <p className="text-slate-500 text-sm">Nenhum assinante ainda.</p>
            </div>
          )}

          <div className="glass-panel p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Detalhes dos Planos</h3>
            <div className="space-y-3">
              {PLANOS_INFO.map(p => {
                const qtd = clientes.filter(c => (c.plano || '').toLowerCase() === p.nome.toLowerCase()).length
                return (
                  <div key={p.nome} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.cor }} />
                      <span className={`text-sm font-medium ${p.text}`}>{p.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white text-sm font-bold">{qtd}</span>
                      <span className="text-slate-500 text-xs ml-2">R${p.preco}/ano</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {semPlano > 0 && <p className="text-slate-500 text-xs mt-3">{semPlano} usuario(s) sem plano definido</p>}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Lista de Assinantes</h3>
          {loading ? <p className="text-slate-500">Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-slate-400 text-xs uppercase"><tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Plano</th><th className="text-left p-3">Email</th><th className="text-left p-3">Telefone</th></tr></thead>
                <tbody>
                  {clientes.filter(c => c.plano && c.plano !== '').map(c => {
                    const planoInfo = PLANOS_INFO.find(p => p.nome.toLowerCase() === (c.plano || '').toLowerCase())
                    return (
                      <tr key={c._id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-medium">{c.name || '-'}</td>
                        <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${planoInfo?.bg || 'bg-slate-500/10'} ${planoInfo?.text || 'text-slate-400'}`}>{c.plano || '-'}</span></td>
                        <td className="p-3 text-slate-400">{c.email || '-'}</td>
                        <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                      </tr>
                    )
                  })}
                  {clientes.filter(c => c.plano && c.plano !== '').length === 0 && <tr><td colSpan={4} className="p-3 text-slate-500 text-center text-xs">Nenhum assinante encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
