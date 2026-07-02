import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, QrCode, Activity, CreditCard, ClipboardList, AlertTriangle, LogOut, ShieldAlert } from './Icons'
import { useAuth } from '../context/AuthContext'

const menu = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/equipamentos', label: 'Equipamentos', icon: Bike },
  { path: '/adesivos', label: 'Adesivos QR', icon: QrCode },
  { path: '/planos', label: 'Planos', icon: ClipboardList },
  { path: '/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { path: '/lojas-parceiras', label: 'Lojas Parceiras', icon: Users },
  { path: '/instalacoes', label: 'Instalações', icon: ClipboardList },
  { path: '/institucional', label: 'Institucional', icon: ShieldAlert },
  { path: '/analytics', label: 'Estatisticas', icon: Activity },
  { path: '/relatorios', label: 'Relatorios', icon: Activity },
  { path: '/sinistros', label: 'Sinistros', icon: AlertTriangle },
  { path: '/manutencao', label: 'Manutencao', icon: AlertTriangle },
]

export default function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-slate-800/50 border-r border-white/5 flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo-oficial.jpg" alt="" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h2 className="text-white font-bold text-sm">BIKE SEGURA BC</h2>
            <p className="text-slate-500 text-[10px]">Painel Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menu.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              location.pathname === item.path
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-red-400 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
