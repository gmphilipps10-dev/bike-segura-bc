import { useState, useEffect } from 'react'
import { Search, Mail, Phone, Calendar } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClientes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const filtrados = busca
    ? clientes.filter(c => c.name?.toLowerCase().includes(busca.toLowerCase()) || c.email?.includes(busca) || c.phone?.includes(busca))
    : clientes

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">{clientes.length} cadastrados</p>
        </header>

        <div className="glass-card flex items-center gap-2 px-3 py-2 mb-4 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-white font-medium">{c.name || '-'}</td>
                    <td className="p-3 text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email || '-'}</td>
                    <td className="p-3 text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone || '-'}</td>
                    <td className="p-3 text-slate-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
