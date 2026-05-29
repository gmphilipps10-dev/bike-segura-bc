import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/bike-segura-bc-backend/api';

export default function AdminSetup() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (pin.length < 4) { setErro('Digite o PIN completo'); return; }
    setLoading(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('bike_segura_token');
      const res = await fetch(`${API_BASE}/auth/become-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSucesso(true);
      } else {
        setErro(data.message || 'PIN incorreto');
      }
    } catch {
      setErro('Erro de conexao');
    }
    setLoading(false);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Acesso Liberado!</h2>
          <p className="text-slate-400 text-sm mb-4">
            Voce agora e administrador do Bike Segura BC.
          </p>
          <p className="text-amber-400 text-xs mb-6">
            Acesse o painel em:<br/>
            <span className="font-mono">{window.location.origin}/admin/</span>
          </p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')} className="flex-1 py-2.5 rounded-xl glass-card text-slate-400 text-sm font-semibold cursor-pointer">
              VOLTAR
            </button>
            <button onClick={() => window.open('/admin/', '_blank')} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] text-sm font-bold cursor-pointer">
              ABRIR PAINEL
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1222] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-[#0c1222]" />
          </div>
          <h2 className="text-white font-bold text-lg">Acesso Administrativo</h2>
          <p className="text-slate-500 text-xs mt-1">Digite o PIN de seguranca</p>
        </div>

        {erro && (
          <div className="glass-card bg-red-500/10 border border-red-500/20 p-3 mb-4 text-center">
            <p className="text-red-400 text-xs">{erro}</p>
          </div>
        )}

        <input
          type="password"
          inputMode="numeric"
          maxLength={10}
          placeholder="PIN de acesso"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full glass-card px-4 py-3 text-white text-center text-lg font-mono tracking-[0.5em] placeholder:text-slate-600 outline-none mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0c1222] font-bold text-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'VERIFICANDO...' : 'LIBERAR ACESSO'}
        </button>

        <Link to="/" className="block text-center text-slate-500 text-xs mt-4 hover:text-amber-400">
          Cancelar
        </Link>
      </motion.div>
    </div>
  );
}
