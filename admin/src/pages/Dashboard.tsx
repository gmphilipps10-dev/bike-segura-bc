import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bike, QrCode, ShieldAlert, TrendingUp, Activity, XCircle } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0, totalEquipamentos: 0, equipamentosProtegidos: 0,
    adesivosDisponiveis: 0, adesivosUsados: 0, adesivosInativos: 0, alertasFurto: 0,
  })
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersRes, bikesRes, qrRes] = await Promise.all([
          fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/preprinted`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        let totalClientes = 0, totalEquipamentos = 0, equipamentosProtegidos = 0
        let alertasFurto = 0, adesivosDisponiveis = 0, adesivosUsados = 0, adesivosInativos = 0

        if (usersRes.ok) { const d = await usersRes.json(); totalClientes = Array.isArray(d) ? d.length : 0 }
        if (bikesRes.ok) { const d = await bikesRes.json(); if (Array.isArray(d)) { totalEquipamentos = d.length; equipamentosProtegidos = d.filter((b: any) => b.protected).length; alertasFurto = d.filter((b: any) => b.status === 'furto').length } }
        if (qrRes.ok) { const d = await qrRes.json(); adesivosDisponiveis = d.disponiveis || 0; adesivosUsados = d.vinculados || 0; adesivosInativos = d.inativos || 0 }

        setStats({ totalClientes, totalEquipamentos, equipamentosProtegidos, adesivosDisponiveis, adesivosUsados, adesivosInativos, alertasFurto })
      } catch {}
      setLoading(false)
    }
    loadStats()
  }, [token])

  const cards = [
    { title: 'Clientes', value: stats.totalClientes, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', link: '/clientes' },
    { title: 'Equipamentos', value: stats.totalEquipamentos, icon: Bike, color: 'text-amber-400', bg: 'bg-amber-400/10', link: '/equipamentos' },
    { title: 'Protegidos', value: stats.equipamentosProtegidos, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', link: '/equipamentos' },
    { title: 'Alertas Furto', value: stats.alertasFurto, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10', link: '/equipamentos' },
    { title: 'Adesivos Livres', value: stats.adesivosDisponiveis, icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-400/10', link: '/adesivos' },
    { title: 'Adesivos Usados', value: stats.adesivosUsados, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10', link: '/adesivos' },
    { title: 'Adesivos Inativos', value: stats.adesivosInativos, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', link: '/adesivos' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Visao geral da plataforma</p>
        </header>

        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => (
              <Link key={card.title} to={card.link} className="glass-card-hover p-5">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-slate-500 text-xs mt-1">{card.title}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Status do Sistema</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm">Operacional</span>
          </div>
        </div>
      </div>
    </div>
  )
}
