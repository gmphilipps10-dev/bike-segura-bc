import { useState, useEffect } from 'react'
import { Search, Mail, Phone, Calendar, Download, FileText, Table } from '../components/Icons'
import Sidebar from '../components/Sidebar'
import { exportarCSV, exportarPDF, exportarExcel } from '../utils/exportar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalSenha, setModalSenha] = useState<{ aberto: boolean, cliente: any | null }>({ aberto: false, cliente: null })
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro', msg: string } | null>(null)
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

  const getExportData = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Plano', 'Plano Ativo', 'Data Cadastro']
    const rows = filtrados.map(c => [
      c.name || '-',
      c.email || '-',
      c.phone || '-',
      c.plano || 'free',
      c.planoAtivo ? 'Sim' : 'Nao',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-',
    ])
    return { headers, rows }
  }

  const handleExportarCSV = () => { const { headers, rows } = getExportData(); exportarCSV('clientes', headers, rows) }
  const handleExportarPDF = () => { const { headers, rows } = getExportData(); exportarPDF('Relatorio de Clientes', `${filtrados.length} clientes`, headers, rows, [{ label: 'Total', value: String(filtrados.length) }]) }
  const handleExportarExcel = () => { const { headers, rows } = getExportData(); exportarExcel('clientes', 'Clientes', headers, rows, [{ label: 'Total', value: String(filtrados.length) }]) }

  const abrirModalSenha = (cliente: any) => {
    setModalSenha({ aberto: true, cliente })
    setNovaSenha('')
  }

  const fecharModalSenha = () => {
    setModalSenha({ aberto: false, cliente: null })
    setNovaSenha('')
  }

  const redefinirSenha = async () => {
    if (!modalSenha.cliente) return
    if (novaSenha.length < 6) {
      setToast({ tipo: 'erro', msg: 'A nova senha deve ter pelo menos 6 caracteres.' })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setSalvandoSenha(true)
    try {
      const res = await fetch(`${API_BASE}/auth/users/${modalSenha.cliente._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: novaSenha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao redefinir senha.')
      setToast({ tipo: 'sucesso', msg: 'Senha redefinida com sucesso.' })
      fecharModalSenha()
    } catch (err: any) {
      setToast({ tipo: 'erro', msg: err.message || 'Erro ao redefinir senha.' })
    } finally {
      setSalvandoSenha(false)
      setTimeout(() => setToast(null), 5000)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">{clientes.length} cadastrados</p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
          <div className="glass-card flex items-center gap-2 px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportarCSV} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar CSV"><Download className="w-3 h-3" />CSV</button>
            <button onClick={handleExportarPDF} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar PDF"><FileText className="w-3 h-3" />PDF</button>
            <button onClick={handleExportarExcel} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2" title="Exportar Excel"><Table className="w-3 h-3" />Excel</button>
          </div>
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
                  <th className="text-left p-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-white font-medium">{c.name || '-'}</td>
                    <td className="p-3 text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email || '-'}</td>
                    <td className="p-3 text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone || '-'}</td>
                    <td className="p-3 text-slate-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => abrirModalSenha(c)}
                        className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-400/20"
                      >
                        Redefinir senha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalSenha.aberto && modalSenha.cliente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Redefinir senha</h3>
              <p className="mt-1 text-sm text-slate-400">
                Cliente: <span className="text-white">{modalSenha.cliente.name}</span>
              </p>
              <p className="text-xs text-slate-500">{modalSenha.cliente.email}</p>

              <label className="mt-5 block text-sm font-medium text-slate-300">Nova senha temporaria</label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-amber-400"
                placeholder="Minimo 6 caracteres"
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={fecharModalSenha}
                  disabled={salvandoSenha}
                  className="flex-1 rounded-lg bg-slate-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={redefinirSenha}
                  disabled={salvandoSenha || novaSenha.length < 6}
                  className="flex-1 rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-2xl ${toast.tipo === 'sucesso' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}
