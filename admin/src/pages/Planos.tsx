import { useState, useEffect } from 'react'
import { Star, Shield, Gem } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

const PLANOS = [
  { nome: 'Bronze', preco: 50, cor: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Star, desc: 'Protecao basica com QR Code' },
  { nome: 'Prata', preco: 150, cor: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Shield, desc: 'Protecao intermediaria' },
  { nome: 'Ouro', preco: 300, cor: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Gem, desc: 'Protecao avancada' },
  { nome: 'Diamante', preco: 450, cor: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Gem, desc: 'Protecao premium completa' },
]

export default function Planos() {
  const [stats, setStats] = useState({
    totalBronze: 0, totalPrata: 0, totalOuro: 0, totalDiamante: 0, totalGeral: 0
  })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((users: any[]) => {
        const u = Array.isArray(users) ? users : []
        setStats({
          totalBronze: u.filter((x: any) => x.plano === 'bronze').length,
          totalPrata: u.filter((x: any) => x.plano === 'prata').length,
          totalOuro: u.filter((x: any) => x.plano === 'ouro').length,
          totalDiamante: u.filter((x: any) => x.plano === 'diamante').length,
          totalGeral: u.length,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const planoStats = [
    { label: 'Bronze', value: stats.totalBronze, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Prata', value: stats.totalPrata, icon: Shield, color: 'text-slate-300', bg: 'bg-slate-400/10' },
    { label: 'Ouro', value: stats.totalOuro, icon: Gem, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Diamante', value: stats.totalDiamante, icon: Gem, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-slate-400 text-sm">Gerenciamento de planos e assinaturas</p>
        </header>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {planoStats.map(p => (
                <div key={p.label} className={`${p.bg} border border-white/5 rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                    <span className="text-slate-300 text-sm font-medium">{p.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${p.color}`}>{p.value}</p>
                  <p className="text-slate-500 text-xs mt-1">assinantes</p>
                </div>
              ))}
            </div>

            <h2 className="text-white font-bold text-lg mb-4">Detalhes dos Planos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {PLANOS.map(plano => (
                <div key={plano.nome} className={`glass-card p-5 border ${plano.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${plano.bg} flex items-center justify-center`}>
                        <plano.icon className={`w-5 h-5 ${plano.cor}`} />
                      </div>
                      <div>
                        <h3 className={`text-white font-bold ${plano.cor}`}>{plano.nome}</h3>
                        <p className="text-slate-500 text-xs">{plano.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">R${plano.preco}</p>
                      <p className="text-slate-500 text-xs">/ano</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 glass-card p-6">
              <h2 className="text-white font-bold text-lg mb-2">Informacoes</h2>
              <p className="text-slate-400 text-sm">
                Nao ha plano gratuito. Todos os usuarios devem assinar um dos planos para proteger suas bikes.
                O plano e renovado anualmente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
