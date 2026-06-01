import { useState, useEffect } from 'react'
import { CreditCard, Users, TrendingUp, Bike } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

const PLANOS_INFO = [
  { nome: 'Free', preco: 0, cor: 'text-slate-400', bg: 'bg-slate-400/10', recursos: ['Cadastro basico', 'QR Code padrao', 'Consulta publica'] },
  { nome: 'Bronze', preco: 50, cor: 'text-orange-400', bg: 'bg-orange-400/10', recursos: ['Cadastro + foto', 'Alerta de furto', 'Sem rastreamento'] },
  { nome: 'Prata', preco: 150, cor: 'text-slate-300', bg: 'bg-slate-300/10', recursos: ['Tudo do Bronze', 'Rastreamento basico', 'Suporte por email'] },
  { nome: 'Ouro', preco: 300, cor: 'text-amber-400', bg: 'bg-amber-400/10', recursos: ['Tudo do Prata', 'Rastreamento avancado', 'Suporte prioritario', 'Relatorios mensais'] },
  { nome: 'Diamante', preco: 450, cor: 'text-purple-400', bg: 'bg-purple-400/10', recursos: ['Tudo do Ouro', 'Rastreamento em tempo real', 'Suporte 24h', 'Indenizacao'] },
]

export default function Planos() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClientes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const distribuicao = PLANOS_INFO.map(p => ({
    ...p,
    quantidade: clientes.filter(c => (c.plano || 'free').toLowerCase() === p.nome.toLowerCase()).length,
  }))

  const faturamentoMensal = distribuicao.reduce((acc, p) => acc + (p.quantidade * p.preco), 0)
  const faturamentoAnual = faturamentoMensal * 12
  const totalAssinantes = clientes.filter(c => c.plano && c.plano !== 'free').length

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-slate-400 text-sm">Gestao de planos e assinantes</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{clientes.length}</p>
            <p className="text-slate-500 text-xs">Total usuarios</p>
          </div>
          <div className="glass-card p-4 text-center">
            <CreditCard className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalAssinantes}</p>
            <p className="text-slate-500 text-xs">Assinantes pagos</p>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">R${faturamentoMensal.toLocaleString('pt-BR')}</p>
            <p className="text-slate-500 text-xs">Faturamento/mes</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Bike className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">R${faturamentoAnual.toLocaleString('pt-BR')}</p>
            <p className="text-slate-500 text-xs">Faturamento/ano</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {distribuicao.map(p => (
            <div key={p.nome} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${p.bg} flex items-center justify-center`}>
                    <CreditCard className={`w-5 h-5 ${p.cor}`} />
                  </div>
                  <div>
                    <p className={`font-bold ${p.cor}`}>{p.nome}</p>
                    <p className="text-slate-500 text-xs">R${p.preco}/ano</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{p.quantidade}</p>
                  <p className="text-slate-500 text-[10px]">assinantes</p>
                </div>
              </div>
              <div className="space-y-1">
                {p.recursos.map(r => (
                  <p key={r} className="text-slate-400 text-xs flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400" />{r}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Lista de Assinantes</h2>
          {loading ? <p className="text-slate-500">Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Plano</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.filter(c => c.plano && c.plano !== 'free').map(c => {
                    const planoInfo = PLANOS_INFO.find(p => p.nome.toLowerCase() === (c.plano || '').toLowerCase())
                    return (
                      <tr key={c._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 text-white font-medium">{c.name || '-'}</td>
                        <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${planoInfo?.bg || 'bg-slate-500/10'} ${planoInfo?.cor || 'text-slate-400'}`}>{c.plano || 'free'}</span></td>
                        <td className="p-3 text-slate-400">{c.email || '-'}</td>
                        <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                      </tr>
                    )
                  })}
                  {clientes.filter(c => c.plano && c.plano !== 'free').length === 0 && (
                    <tr><td colSpan={4} className="p-3 text-slate-500 text-center text-xs">Nenhum assinante pago encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
