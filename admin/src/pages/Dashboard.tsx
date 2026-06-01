import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Bike, QrCode, ShieldAlert, TrendingUp, Activity, CreditCard, Receipt } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

const mockChartData = [
  { name: 'Jan', clientes: 12, equipamentos: 8 },
  { name: 'Fev', clientes: 19, equipamentos: 15 },
  { name: 'Mar', clientes: 25, equipamentos: 22 },
  { name: 'Abr', clientes: 34, equipamentos: 30 },
  { name: 'Mai', clientes: 42, equipamentos: 38 },
  { name: 'Jun', clientes: 48, equipamentos: 45 },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0, totalEquipamentos: 0, equipamentosProtegidos: 0,
    adesivosDisponiveis: 0, adesivosUsados: 0, alertasFurto: 0,
    totalOcorrencias: 0, faturamentoTotal: 0,
  })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, bikesRes, qrRes, ocRes] = await Promise.all([
          window.fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          window.fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          window.fetch(`${API_BASE}/preprinted`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          window.fetch(`${API_BASE}/ocorrencias?dias=365`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ])

        let totalClientes = 0, totalEquipamentos = 0, equipamentosProtegidos = 0
        let alertasFurto = 0, adesivosDisponiveis = 0, adesivosUsados = 0, totalOcorrencias = 0

        if (usersRes?.ok) { const d = await usersRes.json(); totalClientes = Array.isArray(d) ? d.length : 0 }
        if (bikesRes?.ok) {
          const d = await bikesRes.json()
          if (Array.isArray(d)) {
            totalEquipamentos = d.length
            equipamentosProtegidos = d.filter((b: any) => b.protected).length
            alertasFurto = d.filter((b: any) => b.status === 'furto').length
          }
        }
        if (qrRes?.ok) { const d = await qrRes.json(); adesivosDisponiveis = d.disponiveis || 0; adesivosUsados = d.vinculados || 0 }
        if (ocRes?.ok) { const d = await ocRes.json(); totalOcorrencias = Array.isArray(d) ? d.length : 0 }

        setStats({ totalClientes, totalEquipamentos, equipamentosProtegidos, adesivosDisponiveis, adesivosUsados, alertasFurto, totalOcorrencias, faturamentoTotal: 0 })
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [token])

  const cards = [
    { title: 'Clientes', value: stats.totalClientes, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', link: '/clientes' },
    { title: 'Equipamentos', value: stats.totalEquipamentos, icon: Bike, color: 'text-amber-400', bg: 'bg-amber-400/10', link: '/equipamentos' },
    { title: 'Protegidos', value: stats.equipamentosProtegidos, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', link: '/equipamentos' },
    { title: 'Alertas Furto', value: stats.alertasFurto, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10', link: '/equipamentos' },
    { title: 'Adesivos QR', value: stats.adesivosDisponiveis + stats.adesivosUsados, icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-400/10', link: '/adesivos' },
    { title: 'Ocorrencias', value: stats.totalOcorrencias, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-400/10', link: '/ocorrencias' },
    { title: 'Assinantes', value: 0, icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-400/10', link: '/planos' },
    { title: 'Faturamento', value: `R$${stats.faturamentoTotal}`, icon: Receipt, color: 'text-pink-400', bg: 'bg-pink-400/10', link: '/pagamentos' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Visao geral da plataforma</p>
        </header>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {cards.map(card => (
                <Link key={card.title} to={card.link} className="stat-card hover:bg-[#1e293b]/80 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{card.title}</p>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Evolucao de Cadastros</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={mockChartData}>
                    <defs><linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="clientes" stroke="#3b82f6" fillOpacity={1} fill="url(#c1)" />
                    <Area type="monotone" dataKey="equipamentos" stroke="#10b981" fillOpacity={0} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-panel p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Cadastros por Mes</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="equipamentos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
