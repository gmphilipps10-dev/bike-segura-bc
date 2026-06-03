import { useState, useEffect } from 'react'
import { Users, Bike, QrCode } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Relatorios() {
  const [stats, setStats] = useState({
    totalClientes: 0, totalEquip: 0, protegidos: 0,
    adesivosDisp: 0, adesivosUsados: 0, furtos: 0,
  })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/bikes/all`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/preprinted`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : {}),
    ])
      .then(([users, bikes, qr]) => {
        const u = Array.isArray(users) ? users : []
        const b = Array.isArray(bikes) ? bikes : []
        setStats({
          totalClientes: u.length,
          totalEquip: b.length,
          protegidos: b.filter((x: any) => x.protected).length,
          furtos: b.filter((x: any) => x.status === 'furto').length,
          adesivosDisp: qr.disponiveis || 0,
          adesivosUsados: qr.vinculados || 0,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const sections = [
    { title: 'Clientes', icon: Users, color: 'text-blue-400', items: [
      { label: 'Total', value: stats.totalClientes },
    ]},
    { title: 'Equipamentos', icon: Bike, color: 'text-amber-400', items: [
      { label: 'Total', value: stats.totalEquip },
      { label: 'Protegidos', value: stats.protegidos },
      { label: 'Furtados', value: stats.furtos },
    ]},
    { title: 'Adesivos QR', icon: QrCode, color: 'text-purple-400', items: [
      { label: 'Disponiveis', value: stats.adesivosDisp },
      { label: 'Em uso', value: stats.adesivosUsados },
      { label: 'Total', value: stats.adesivosDisp + stats.adesivosUsados },
    ]},
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Relatorios</h1>
        </header>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="space-y-4">
            {sections.map(sec => (
              <div key={sec.title} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <sec.icon className={`w-5 h-5 ${sec.color}`} />
                  <h2 className="text-white font-bold">{sec.title}</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {sec.items.map(item => (
                    <div key={item.label} className="glass-card p-3 text-center">
                      <p className="text-2xl font-bold text-white">{item.value}</p>
                      <p className="text-slate-500 text-xs">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
