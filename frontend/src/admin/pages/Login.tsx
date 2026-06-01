import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await login(email, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-oficial.jpg" alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-2xl font-bold text-white">PAINEL ADMINISTRATIVO</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso restrito</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="admin@bikesegurabc.com" required />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Sua senha" required />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
        <p className="text-center text-slate-600 text-xs mt-6">Bike Segura BC - Sua bike protegida!</p>
      </div>
    </div>
  )
}
