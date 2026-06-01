import { useState, useEffect } from 'react'
import { Search, Mail, Phone, Calendar, MapPin, CreditCard, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'

const API_BASE = '/bike-segura-bc-backend/api'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalCliente, setModalCliente] = useState<any>(null)
  const token = localStorage.getItem('admin_token') || ''

  useEffect(() => {
    window.fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClientes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const filtrados = busca
    ? clientes.filter(c => c.name?.toLowerCase().includes(busca.toLowerCase()) || c.email?.includes(busca) || c.phone?.includes(busca) || c.cpf?.includes(busca))
    : clientes

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">{clientes.length} cadastrados</p>
        </header>

        <div className="glass-panel flex items-center gap-2 px-3 py-2 mb-4 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Buscar por nome, email, telefone ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
        </div>

        {loading ? <p className="text-slate-500">Carregando...</p> : (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-slate-400 text-xs uppercase">
                <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Email</th><th className="text-left p-3">Telefone</th><th className="text-left p-3">Plano</th><th className="text-left p-3">Cadastro</th></tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c._id} className="border-t border-white/[0.04] hover:bg-white/[0.02] cursor-pointer" onClick={() => setModalCliente(c)}>
                    <td className="p-3 text-white font-medium">{c.name || '-'}</td>
                    <td className="p-3 text-slate-400"><span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email || '-'}</span></td>
                    <td className="p-3 text-slate-400"><span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone || '-'}</span></td>
                    <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 uppercase">{c.plano || 'free'}</span></td>
                    <td className="p-3 text-slate-500 text-xs"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalCliente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalCliente(null)}>
            <div className="glass-panel p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Detalhes do Cliente</h3>
                <button onClick={() => setModalCliente(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300"><span className="text-slate-500 w-20">Nome:</span>{modalCliente.name || '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><Mail className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">Email:</span>{modalCliente.email || '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><Phone className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">Tel:</span>{modalCliente.phone || '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><CreditCard className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">CPF:</span>{modalCliente.cpf || '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">End:</span>{modalCliente.address || '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><Calendar className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">Nasc:</span>{modalCliente.birthDate ? new Date(modalCliente.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                <div className="flex items-center gap-2 text-slate-300"><CreditCard className="w-3 h-3 text-slate-500" /><span className="text-slate-500 w-16">Plano:</span><span className="text-amber-400 font-medium uppercase">{modalCliente.plano || 'free'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
