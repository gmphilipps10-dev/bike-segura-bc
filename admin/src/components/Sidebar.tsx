import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, QrCode, ShieldAlert, CreditCard, Receipt, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const menu = [
  { path: '/', label: 'Painel', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/equipamentos', label: 'Equipamentos', icon: Bike },
  { path: '/adesivos', label: 'Adesivos QR', icon: QrCode },
  { path: '/ocorrencias', label: 'Ocorrencias', icon: ShieldAlert },
  { path: '/planos', label: 'Planos', icon: CreditCard },
  { path: '/pagamentos', label: 'Pagamentos', icon: Receipt },
]

export default function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-white/[0.06] flex flex-col h-screen fixed left-0 top-0">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img src="/logo-oficial.jpg" alt="" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div>
            <h2 className="text-white font-bold text-sm tracking-wide">BIKE SEGURA BC</h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menu.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-amber-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 transition-colors w-full rounded-lg hover:bg-white/[0.03]">
          <LogOut className="w-[18px] h-[18px]" />
          <span className="font-medium">Sair do painel</span>
        </button>
        <p className="text-slate-600 text-[10px] mt-3 px-4">v3.1 - Bicicleta Segura BC</p>
      </div>
    </aside>
  )
}
